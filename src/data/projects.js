import { db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";

export const slugify = (text = "") =>
  text
    .toString()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// Older docs predate the slug field, so fall back to a slug derived from the title.
export const projectSlug = (project) => project.slug || slugify(project.title);

export const projectPath = (project) => `/projects/${projectSlug(project)}`;

// Docs without a `published` field predate drafts and are treated as published.
export const isPublished = (project) => project.published !== false;

let cache = null;

export async function getProjects({ includeDrafts = false, fresh = false } = {}) {
  if (!cache || fresh) {
    cache = getDocs(collection(db, "projects")).then((snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      return data;
    });
    cache.catch(() => {
      cache = null;
    });
  }
  const projects = await cache;
  return includeDrafts ? projects : projects.filter(isPublished);
}

// The collection is small, so load it whole: that also gives prev/next neighbours.
export async function getProjectBySlug(slug, { includeDrafts = false } = {}) {
  const projects = await getProjects({ includeDrafts, fresh: includeDrafts });
  const index = projects.findIndex((p) => projectSlug(p) === slug);
  if (index === -1) return { project: null, prev: null, next: null };
  return {
    project: projects[index],
    prev: projects[index - 1] ?? projects[projects.length - 1],
    next: projects[index + 1] ?? projects[0],
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

export const isVideoUrl = (url = "") => /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url);
