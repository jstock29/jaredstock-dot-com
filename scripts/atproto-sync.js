// Publishes the blog to the AT Protocol network as standard.site records (https://standard.site):
// one site.standard.publication record for the blog, and one site.standard.document record
// per published post, in Jared's own repo (@jaredstock.com). Readers and tools across the
// network can then find the posts; jaredstock.com stays their home, and the records point back.
//
// Called by scripts/prerender-blog.js at deploy time. With BLUESKY_APP_PASSWORD set it
// creates, updates and deletes records to match the published posts (an unpublished or
// deleted post loses its record). Without it, it only reads the existing records so the
// verification tags still go out. Either way it never throws: the site deploys regardless.
import { readFile } from "node:fs/promises";
import { plainText } from "../src/data/posts.js";

const HANDLE = process.env.BLUESKY_HANDLE || "jaredstock.com";
const PASSWORD = process.env.BLUESKY_APP_PASSWORD;
export const PUBLICATION_URL = "https://jaredstock.com/blog";
const PUBLICATION = "site.standard.publication";
const DOCUMENT = "site.standard.document";
const MAX_BLOB = 950 * 1024; // the lexicons cap images at 1MB
const BSKY_POST_URL = /^https:\/\/bsky\.app\/profile\/([^/]+)\/post\/([a-z0-9]+)/i;

async function json(url, init) {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`${init?.method || "GET"} ${url.split("?")[0]} → ${res.status} ${await res.text()}`);
  return res.status === 200 && res.headers.get("content-type")?.includes("json") ? res.json() : null;
}

const resolveHandle = async (handle) =>
  handle.startsWith("did:")
    ? handle
    : (await json(`https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle=${encodeURIComponent(handle)}`)).did;

// The PDS hosting a repo is listed in its DID document.
async function resolvePds(did) {
  const doc = did.startsWith("did:web:")
    ? await json(`https://${did.slice(8)}/.well-known/did.json`)
    : await json(`https://plc.directory/${did}`);
  const service = (doc.service || []).find((s) => s.id === "#atproto_pds" || s.id?.endsWith("#atproto_pds"));
  if (!service) throw new Error(`no PDS listed for ${did}`);
  return service.serviceEndpoint.replace(/\/$/, "");
}

async function listRecords(pds, did, collection) {
  const records = [];
  let cursor;
  do {
    const params = new URLSearchParams({ repo: did, collection, limit: "100", ...(cursor ? { cursor } : {}) });
    const page = await json(`${pds}/xrpc/com.atproto.repo.listRecords?${params}`);
    records.push(...page.records);
    cursor = page.cursor;
  } while (cursor);
  return records;
}

const rkeyOf = (uri) => uri.split("/").pop();
const trimSlash = (url = "") => url.replace(/\/+$/, "");

const stable = (value) =>
  Array.isArray(value)
    ? `[${value.map(stable).join(",")}]`
    : value && typeof value === "object"
      ? `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${stable(value[k])}`).join(",")}}`
      : JSON.stringify(value);

// Drops empty optional fields so a record compares equal to what the PDS hands back.
const compact = (obj) =>
  Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && !v.length)),
  );

// Images go up as JPEG under 1MB (cover) or as-is when they already fit (the icon).
async function imageBytes(source) {
  const input = Buffer.isBuffer(source) ? source : Buffer.from(await (await fetch(source)).arrayBuffer());
  const { default: sharp } = await import("sharp");
  for (const [edge, quality] of [[1600, 82], [1200, 72], [1000, 60]]) {
    const out = await sharp(input).rotate().resize({ width: edge, height: edge, fit: "inside", withoutEnlargement: true }).jpeg({ quality, mozjpeg: true }).toBuffer();
    if (out.length <= MAX_BLOB) return out;
  }
  return null;
}

// Strong reference ({ uri, cid }) to the Bluesky post that shares an article, so apps on the
// network can find its conversation, same as the replies shown under the post on the site.
async function bskyPostRef(url) {
  const match = BSKY_POST_URL.exec(url || "");
  if (!match) return undefined;
  const did = await resolveHandle(match[1]);
  const uri = `at://${did}/app.bsky.feed.post/${match[2]}`;
  const { posts } = await json(`https://public.api.bsky.app/xrpc/app.bsky.feed.getPosts?uris=${encodeURIComponent(uri)}`);
  return posts?.[0] ? { uri, cid: posts[0].cid } : undefined;
}

function textContent(post) {
  const parts = (post.blocks || []).map((b) => (b.type === "text" ? plainText(b.md) : b.type === "quote" ? b.text : b.caption || ""));
  return parts.filter(Boolean).join("\n\n").slice(0, 100000);
}

export async function syncStandardSite(posts, blog, { describe }) {
  try {
    const did = await resolveHandle(HANDLE);
    const pds = await resolvePds(did);
    const publications = await listRecords(pds, did, PUBLICATION);
    let publication = publications.find((r) => trimSlash(r.value.url) === PUBLICATION_URL);
    const documents = publication
      ? (await listRecords(pds, did, DOCUMENT)).filter((r) => trimSlash(r.value.site) === publication.uri)
      : [];

    if (!PASSWORD) {
      if (publication) console.log(`AT Protocol: read-only (no BLUESKY_APP_PASSWORD), found ${documents.length} post records.`);
      return publication ? result(publication.uri, documents) : null;
    }

    const session = await json(`${pds}/xrpc/com.atproto.server.createSession`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: HANDLE, password: PASSWORD }),
    });
    const auth = { Authorization: `Bearer ${session.accessJwt}` };
    const call = (method, body) =>
      json(`${pds}/xrpc/com.atproto.repo.${method}`, {
        method: "POST",
        headers: { ...auth, "Content-Type": "application/json" },
        body: JSON.stringify({ repo: did, ...body }),
      });
    const uploadBlob = async (bytes) =>
      bytes
        ? (await json(`${pds}/xrpc/com.atproto.repo.uploadBlob`, {
            method: "POST",
            headers: { ...auth, "Content-Type": "image/jpeg" },
            body: bytes,
          })).blob
        : undefined;
    // Writes `value` unless the record already says exactly that; returns the record's URI.
    const upsert = async (collection, existing, value) => {
      if (existing && stable(existing.value) === stable(value)) return existing.uri;
      if (existing) {
        await call("putRecord", { collection, rkey: rkeyOf(existing.uri), record: value });
        return existing.uri;
      }
      return (await call("createRecord", { collection, record: value })).uri;
    };
    const changes = { created: 0, updated: 0, deleted: 0 };
    const count = (existing, before, after) => {
      if (!existing) changes.created += 1;
      else if (stable(before) !== stable(after)) changes.updated += 1;
    };

    const icon = await uploadBlob(await imageBytes(await readFile(new URL("../public/logo512.png", import.meta.url))));
    const pubValue = compact({
      $type: PUBLICATION,
      url: PUBLICATION_URL,
      name: blog.title,
      description: blog.description,
      icon,
      preferences: { showInDiscover: true },
    });
    const pubUri = await upsert(PUBLICATION, publication, pubValue);

    const byPath = new Map(documents.map((r) => [r.value.path, r]));
    const kept = new Set();
    for (const post of posts) {
      const path = `/${post.slug}`;
      const existing = byPath.get(path);
      let cover;
      try {
        cover = post.cover ? await uploadBlob(await imageBytes(post.cover)) : undefined;
      } catch (err) {
        console.warn(`AT Protocol: skipping the cover image of "${post.title}": ${err.message}`);
      }
      const value = compact({
        $type: DOCUMENT,
        site: pubUri,
        path,
        title: post.title,
        description: describe(post),
        publishedAt: post.publishedAt || post.updatedAt,
        updatedAt: post.updatedAt,
        tags: (post.tags || []).map((t) => t.replace(/^#/, "").slice(0, 128)).filter(Boolean).slice(0, 10),
        textContent: textContent(post),
        coverImage: cover,
        bskyPostRef: await bskyPostRef(post.blueskyPost).catch(() => undefined),
      });
      count(existing, existing?.value, value);
      const uri = await upsert(DOCUMENT, existing, value);
      kept.add(uri);
      byPath.set(path, { uri, value });
    }

    // Posts that were unpublished, deleted or moved to a new slug.
    const remaining = [];
    for (const record of byPath.values()) {
      if (kept.has(record.uri)) remaining.push(record);
      else {
        await call("deleteRecord", { collection: DOCUMENT, rkey: rkeyOf(record.uri) });
        changes.deleted += 1;
      }
    }
    console.log(
      `AT Protocol: synced ${posts.length} post records (${changes.created} new, ${changes.updated} updated, ${changes.deleted} removed).`,
    );
    return result(pubUri, remaining);
  } catch (err) {
    console.warn(`AT Protocol sync skipped: ${err.message}`);
    return null;
  }
}

const result = (publicationUri, documents) => ({
  publicationUri,
  documents: new Map(documents.map((r) => [r.value.path.replace(/^\//, ""), r.uri])),
});
