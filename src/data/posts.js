// Helpers for blog posts with no browser or Firebase dependencies, so the prerender
// script (scripts/prerender-blog.js) can use them in Node too.

// Words and minutes to read, counted over a post's text blocks and quotes.
export function readingStats(blocks = []) {
  const text = blocks.map((b) => (b.type === "text" ? b.md : b.type === "quote" ? b.text : "") || "").join(" ");
  const words = (text.replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1").match(/[\p{L}\p{N}'’]+/gu) || []).length;
  return { words, minutes: Math.max(1, Math.round(words / 230)) };
}

export const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "";

// The image link previews (Bluesky, iMessage, Slack…) should show: the share image, else
// the hero (or its poster when the hero is a video), else the card image.
export function shareImage(entry) {
  if (entry.shareImage) return entry.shareImage;
  const hero = entry.hero || {};
  if (hero.type === "video") return hero.poster || entry.image || "";
  return hero.src || entry.image || "";
}

// Markdown to plain text, for descriptions and excerpts.
export const plainText = (md = "") =>
  md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+\.)\s+/gm, "")
    .replace(/[*_`~]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const clip = (text, max) => (text.length <= max ? text : `${text.slice(0, max - 1).replace(/\s+\S*$/, "")}…`);

// What link previews and the blog list say about a post: its share description, else its
// subtitle, else the opening of the text.
export function shareDescription(entry, max = 200) {
  if (entry.excerpt) return entry.excerpt;
  if (entry.tagline) return entry.tagline;
  const firstText = (entry.blocks || []).find((b) => b.type === "text" && b.md?.trim());
  return firstText ? clip(plainText(firstText.md), max) : entry.text || "";
}
