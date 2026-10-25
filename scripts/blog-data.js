// Reads the published blog posts and the site settings from Firestore's public REST API.
// No dependencies and no credentials, so the deploy workflow can run it before `npm ci`
// to decide whether anything changed (see .github/workflows/deploy.yml).
//
//   node scripts/blog-data.js --version   prints a hash of everything the blog's static files are built from
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const PROJECT = "driven-binder-500400-c2";
const host = process.env.FIRESTORE_EMULATOR_HOST
  ? `http://${process.env.FIRESTORE_EMULATOR_HOST}`
  : "https://firestore.googleapis.com";
const BASE = `${host}/v1/projects/${PROJECT}/databases/(default)/documents`;

// Firestore REST wraps every value in its type ({ stringValue: "…" }); unwrap to plain JSON.
function decode(value) {
  if (!value || typeof value !== "object") return value;
  if ("stringValue" in value) return value.stringValue;
  if ("booleanValue" in value) return value.booleanValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return value.doubleValue;
  if ("timestampValue" in value) return value.timestampValue;
  if ("nullValue" in value) return null;
  if ("arrayValue" in value) return (value.arrayValue.values || []).map(decode);
  if ("mapValue" in value) return decodeFields(value.mapValue.fields);
  return null;
}

const decodeFields = (fields = {}) => Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, decode(v)]));

async function request(url, init) {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`Firestore ${res.status}: ${await res.text()}`);
  return res.json();
}

// Drafts are refused to anyone but the admin, so ask for published posts only.
export async function getPublishedPosts() {
  const rows = await request(`${BASE}:runQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: "posts" }],
        where: { fieldFilter: { field: { fieldPath: "published" }, op: "EQUAL", value: { booleanValue: true } } },
      },
    }),
  });
  return rows
    .filter((row) => row.document)
    .map((row) => ({ id: row.document.name.split("/").pop(), ...decodeFields(row.document.fields) }))
    .sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""));
}

export async function getSiteSettings() {
  try {
    return decodeFields((await request(`${BASE}/settings/site`)).fields);
  } catch {
    return {};
  }
}

const stable = (value) =>
  Array.isArray(value)
    ? `[${value.map(stable).join(",")}]`
    : value && typeof value === "object"
      ? `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${stable(value[k])}`).join(",")}}`
      : JSON.stringify(value);

// Changes whenever a post is published, edited or unpublished, or the blog's settings change.
export function blogVersion(posts, settings) {
  return createHash("sha256").update(stable({ posts, blog: settings.blog || null, footer: settings.footer || null })).digest("hex");
}

if (import.meta.url === pathToFileURL(process.argv[1]).href && process.argv.includes("--version")) {
  const [posts, settings] = await Promise.all([getPublishedPosts(), getSiteSettings()]);
  console.log(blogVersion(posts, settings));
}
