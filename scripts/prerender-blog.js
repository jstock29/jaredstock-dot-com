// Runs after `vite build` (see the build script in package.json). Link previews on Bluesky,
// iMessage, Slack, LinkedIn and the rest come from crawlers that read a page's HTML without
// running JavaScript, so a single-page app would preview every post as the home page.
// This writes a copy of index.html for each published post with that post's title,
// description and hero image in its preview tags, plus the blog's front page, an RSS feed
// and a version stamp the deploy workflow uses to tell when the blog changed.
//
//   dist/blog/<slug>.html   served at /blog/<slug> (cleanUrls in firebase.json)
//   dist/blog.html          served at /blog
//   dist/blog/feed.xml      RSS, full text
//   dist/blog/version.txt   see scripts/blog-data.js
//   dist/.well-known/site.standard.publication/blog   see scripts/atproto-sync.js
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { syncStandardSite } from "./atproto-sync.js";
import { blogVersion, getPublishedPosts, getSiteSettings } from "./blog-data.js";
import { plainText, shareDescription, shareImage } from "../src/data/posts.js";

const SITE = "https://jaredstock.com";
const DIST = new URL("../dist/", import.meta.url);
// Same as the defaults in src/data/settings.js (which can't be imported here: it loads Firebase).
const DEFAULT_BLOG = { title: "Minimum Viable", description: "" };
const DEFAULT_AUTHOR = "Jared Stock";

const esc = (s = "") =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Swaps the home page's title, description, canonical link and preview tags for the page's own.
function withHead(template, head) {
  const stripped = template
    .replace(/<title>[\s\S]*?<\/title>/, "")
    .replace(/<link\s[^>]*rel="canonical"[^>]*>/g, "")
    .replace(/<meta\s[^>]*(?:property="og:[^"]*"|name="twitter:[^"]*"|name="description")[^>]*>/g, "")
    .replace(/<!-- (Open Graph|Twitter)[^>]*-->\s*/g, "");
  return stripped.replace("</head>", `${head}\n    </head>`);
}

function headTags({ title, shareTitle = title, description, url, image, imageAlt, type = "website", siteName, extra = "" }) {
  const tags = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    `<link rel="canonical" href="${esc(url)}" />`,
    `<link rel="alternate" type="application/rss+xml" title="${esc(siteName)}" href="${SITE}/blog/feed.xml" />`,
    `<meta property="og:type" content="${type}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:title" content="${esc(shareTitle)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:site_name" content="${esc(siteName)}" />`,
    `<meta property="og:locale" content="en_US" />`,
    `<meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}" />`,
    `<meta name="twitter:title" content="${esc(shareTitle)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
  ];
  if (image) {
    tags.push(
      `<meta property="og:image" content="${esc(image)}" />`,
      `<meta property="og:image:alt" content="${esc(imageAlt || shareTitle)}" />`,
      `<meta name="twitter:image" content="${esc(image)}" />`,
    );
  }
  return [...tags, extra].filter(Boolean).map((t) => `        ${t}`).join("\n");
}

const md = (text) => renderToStaticMarkup(createElement(Markdown, { remarkPlugins: [remarkGfm] }, text || ""));
const figure = (inner, caption) => `<figure>${inner}${caption ? `<figcaption>${esc(caption)}</figcaption>` : ""}</figure>`;
const isVideo = (url = "") => /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(decodeURIComponent(url));
const mediaHtml = (src, alt, video) =>
  video || isVideo(src) ? `<video src="${esc(src)}" controls></video>` : `<img src="${esc(src)}" alt="${esc(alt || "")}" />`;

// A post's body as plain HTML, for feed readers.
function postHtml(post) {
  const hero = post.hero?.src ? figure(mediaHtml(post.hero.src, post.hero.alt, post.hero.type === "video"), post.hero.caption) : "";
  const body = (post.blocks || [])
    .map((b) => {
      switch (b.type) {
        case "text":
          return md(b.md);
        case "image":
        case "video":
          return b.src ? figure(mediaHtml(b.src, b.alt, b.type === "video"), b.caption) : "";
        case "gallery":
          return figure((b.items || []).map((it) => mediaHtml(it.src, it.alt)).join(""), b.caption);
        case "embed":
          return b.url ? `<p><a href="${esc(b.url)}">${esc(b.caption || b.url)}</a></p>` : "";
        case "quote":
          return `<blockquote><p>${esc(b.text)}</p>${b.cite ? `<p>— ${esc(b.cite)}</p>` : ""}</blockquote>`;
        default:
          return "";
      }
    })
    .join("\n");
  return `${post.tagline ? `<p><em>${esc(post.tagline)}</em></p>` : ""}${hero}${body}`;
}

const cdata = (s) => `<![CDATA[${s.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;

function feed(posts, blog, author) {
  const items = posts
    .map((post) => {
      const url = `${SITE}/blog/${post.slug}`;
      return `    <item>
      <title>${esc(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(post.publishedAt || post.updatedAt).toUTCString()}</pubDate>
      <dc:creator>${esc(author)}</dc:creator>
      ${(post.tags || []).map((t) => `<category>${esc(t)}</category>`).join("")}
      <description>${esc(shareDescription(post))}</description>
      <content:encoded>${cdata(postHtml(post))}</content:encoded>
    </item>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${esc(blog.title)}</title>
    <link>${SITE}/blog</link>
    <atom:link href="${SITE}/blog/feed.xml" rel="self" type="application/rss+xml" />
    <description>${esc(blog.description || blog.title)}</description>
    <language>en-us</language>
${posts[0] ? `    <lastBuildDate>${new Date(posts[0].updatedAt || posts[0].publishedAt).toUTCString()}</lastBuildDate>\n` : ""}${items}
  </channel>
</rss>
`;
}

async function main() {
  const template = await readFile(new URL("index.html", DIST), "utf8");
  let posts;
  let settings;
  try {
    [posts, settings] = await Promise.all([getPublishedPosts(), getSiteSettings()]);
  } catch (err) {
    // Never fail the site's deploy over the blog: without these files /blog still works
    // as a normal page, it just previews like the home page when shared.
    console.warn(`Skipping blog prerender: ${err.message}`);
    return;
  }
  const version = blogVersion(posts, settings);
  posts = posts.filter((p) => /^[a-z0-9-]+$/.test(p.slug || "") && p.title);
  const blog = { ...DEFAULT_BLOG, ...(settings.blog || {}) };
  const author = settings.footer?.name || DEFAULT_AUTHOR;

  await mkdir(new URL("blog/", DIST), { recursive: true });

  // Each post's standard.site record, linked from its page so the record and the page vouch
  // for each other.
  const at = await syncStandardSite(
    posts.map((p) => ({ ...p, cover: shareImage(p) })),
    blog,
    { describe: shareDescription },
  );

  for (const post of posts) {
    const url = `${SITE}/blog/${post.slug}`;
    const description = shareDescription(post);
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description,
      url,
      datePublished: post.publishedAt,
      dateModified: post.updatedAt || post.publishedAt,
      author: { "@type": "Person", name: author, url: SITE },
      ...(shareImage(post) ? { image: shareImage(post) } : {}),
      wordCount: plainText((post.blocks || []).map((b) => b.md || "").join(" ")).split(" ").filter(Boolean).length,
    };
    const extra = [
      post.publishedAt && `<meta property="article:published_time" content="${esc(post.publishedAt)}" />`,
      post.updatedAt && `<meta property="article:modified_time" content="${esc(post.updatedAt)}" />`,
      `<meta property="article:author" content="${esc(author)}" />`,
      ...(post.tags || []).map((t) => `<meta property="article:tag" content="${esc(t)}" />`),
      at?.documents.get(post.slug) && `<link rel="site.standard.document" href="${esc(at.documents.get(post.slug))}" />`,
      `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>`,
    ]
      .filter(Boolean)
      .join("\n        ");
    const head = headTags({
      title: `${post.title} · ${blog.title}`,
      shareTitle: post.title,
      description,
      url,
      image: shareImage(post),
      imageAlt: post.hero?.alt,
      type: "article",
      siteName: blog.title,
      extra,
    });
    await writeFile(new URL(`blog/${post.slug}.html`, DIST), withHead(template, head));
  }

  const latestImage = posts.map(shareImage).find(Boolean);
  await writeFile(
    new URL("blog.html", DIST),
    withHead(
      template,
      headTags({
        title: blog.title,
        description: blog.description || blog.title,
        url: `${SITE}/blog`,
        image: latestImage,
        siteName: blog.title,
        extra: at ? `<link rel="site.standard.publication" href="${esc(at.publicationUri)}" />` : "",
      }),
    ),
  );
  await writeFile(new URL("blog/feed.xml", DIST), feed(posts, blog, author));
  if (at) {
    // The publication lives at /blog, so its proof goes at /.well-known/site.standard.publication/blog.
    await mkdir(new URL(".well-known/site.standard.publication/", DIST), { recursive: true });
    await writeFile(new URL(".well-known/site.standard.publication/blog", DIST), at.publicationUri);
  }
  await writeFile(new URL("blog/version.txt", DIST), `${version}\n`);
  console.log(`Prerendered the blog: ${posts.length} post${posts.length === 1 ? "" : "s"}, front page, feed.`);
}

await main();
