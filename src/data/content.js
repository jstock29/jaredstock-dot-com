import { db } from "../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

// Content types that get their own pages, edited with the block editor in /admin.
export const ENTRY_TYPES = {
  projects: { label: "Projects", singular: "project", basePath: "/projects" },
  publications: { label: "Publications", singular: "publication", basePath: "/publications" },
  pages: { label: "Pages", singular: "page", basePath: "" },
  // Posts are dated and newest first instead of hand-ordered, and the security rules
  // keep drafts private (see firestore.rules).
  posts: { label: "Blog", singular: "post", basePath: "/blog", dated: true },
};

// Slugs a custom page can't take, because the site already uses those paths.
export const RESERVED_PAGE_SLUGS = ["admin", "projects", "publications", "blog"];

export const slugify = (text = "") =>
  text
    .toString()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// Older docs predate the slug field, so fall back to a slug derived from the title.
export const entrySlug = (entry) => entry.slug || slugify(entry.title);

export const entryPath = (type, entry) => `${ENTRY_TYPES[type].basePath}/${entrySlug(entry)}`;

// Docs without a `published` field predate drafts and are treated as published.
export const isPublished = (entry) => entry.published !== false;

// Projects always get a page. A publication only gets one once it has blocks written
// for it; until then its card links straight to the article.
export const hasPage = (type, entry) =>
  type !== "publications" || (Array.isArray(entry.blocks) && entry.blocks.length > 0);

const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0);
const byNewest = (a, b) => (b.publishedAt || b.updatedAt || "").localeCompare(a.publishedAt || a.updatedAt || "");
const caches = {};

// Reading a draft post is refused for anyone but the admin, so the public site only asks
// for published posts; the admin (includeDrafts) reads the whole collection.
function load(type, includeDrafts) {
  const dated = ENTRY_TYPES[type]?.dated;
  const source = dated && !includeDrafts ? query(collection(db, type), where("published", "==", true)) : collection(db, type);
  return getDocs(source).then((snapshot) =>
    snapshot.docs.map((d) => ({ id: d.id, ...d.data() })).sort(dated ? byNewest : byOrder),
  );
}

export async function getEntries(type, { includeDrafts = false, fresh = false } = {}) {
  const key = ENTRY_TYPES[type]?.dated && includeDrafts ? `${type}:drafts` : type;
  if (!caches[key] || fresh) {
    const pending = load(type, includeDrafts);
    caches[key] = pending;
    pending.catch(() => {
      if (caches[key] === pending) delete caches[key];
    });
  }
  const entries = await caches[key];
  return includeDrafts ? entries : entries.filter(isPublished);
}

// Collections are small, so load them whole: that also gives prev/next neighbours.
export async function getEntryBySlug(type, slug, { includeDrafts = false } = {}) {
  const entries = (await getEntries(type, { includeDrafts, fresh: includeDrafts })).filter((e) =>
    hasPage(type, e),
  );
  const index = entries.findIndex((e) => entrySlug(e) === slug);
  if (index === -1) return { entry: null, prev: null, next: null };
  return {
    entry: entries[index],
    prev: entries[index - 1] ?? entries[entries.length - 1],
    next: entries[index + 1] ?? entries[0],
  };
}

// Converts YouTube / Vimeo share links into embeddable URLs; other https URLs pass through.
export function toEmbedUrl(url = "") {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    if (host.endsWith("youtube.com")) {
      if (u.pathname.startsWith("/embed/")) return url;
      const id = u.searchParams.get("v") || u.pathname.split("/").pop();
      return `https://www.youtube.com/embed/${id}`;
    }
    if (host === "vimeo.com") return `https://player.vimeo.com/video/${u.pathname.split("/").pop()}`;
    return u.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

// Storage download URLs end in ?alt=media&token=…, so match the extension before the query.
export const isVideoUrl = (url = "") => /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(decodeURIComponent(url));

// Pure helpers, shared with the build-time prerender script (which runs in Node).
export { formatDate, plainText, readingStats, shareDescription, shareImage } from "./posts.js";
