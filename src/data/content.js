import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

// Content types that get their own pages, edited with the block editor in /admin.
export const ENTRY_TYPES = {
  projects: { label: "Projects", singular: "project", basePath: "/projects" },
  publications: { label: "Publications", singular: "publication", basePath: "/publications" },
  pages: { label: "Pages", singular: "page", basePath: "" },
};

// Slugs a custom page can't take, because the site already uses those paths.
export const RESERVED_PAGE_SLUGS = ["admin", "projects", "publications"];

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
const caches = {};

export async function getEntries(type, { includeDrafts = false, fresh = false } = {}) {
  if (!caches[type] || fresh) {
    const pending = getDocs(collection(db, type)).then((snapshot) =>
      snapshot.docs.map((d) => ({ id: d.id, ...d.data() })).sort(byOrder),
    );
    caches[type] = pending;
    pending.catch(() => {
      if (caches[type] === pending) delete caches[type];
    });
  }
  const entries = await caches[type];
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
