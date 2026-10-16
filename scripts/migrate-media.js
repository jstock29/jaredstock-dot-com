// Copies externally hosted media (e.g. the old S3 bucket) referenced by projects and
// publications into Firebase Storage, then rewrites the docs to point at the new URLs.
//
//   ADMIN_EMAIL=… ADMIN_PASSWORD=… node scripts/migrate-media.js [--dry-run]
import "dotenv/config";
import { app, db } from "../src/firebase.js";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { signInAdmin } from "./admin-auth.js";

const DRY_RUN = process.argv.includes("--dry-run");
const isExternal = (url) =>
  typeof url === "string" && /^https?:\/\//.test(url) && !url.includes("firebasestorage.googleapis.com");

const slugify = (text = "") =>
  text.toString().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const storage = getStorage(app);
const migrated = new Map();

async function copyToStorage(url, folder) {
  if (migrated.has(url)) return migrated.get(url);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} fetching ${url}`);
  const contentType = res.headers.get("content-type") || "application/octet-stream";
  if (!/^(image|video)\//.test(contentType)) throw new Error(`Skipping ${url}: ${contentType} is not image/video`);
  const name = decodeURIComponent(new URL(url).pathname.split("/").pop()).toLowerCase().replace(/[^a-z0-9.]+/g, "-");
  const bytes = new Uint8Array(await res.arrayBuffer());
  const storageRef = ref(storage, `${folder}/${name}`);
  await uploadBytes(storageRef, bytes, { contentType, cacheControl: "public, max-age=31536000, immutable" });
  const newUrl = await getDownloadURL(storageRef);
  migrated.set(url, newUrl);
  return newUrl;
}

// Walks a doc and replaces every external media URL under the media keys.
const MEDIA_KEYS = new Set(["image", "src", "poster"]);

async function rewrite(value, folder, changes) {
  if (Array.isArray(value)) {
    return Promise.all(value.map((v) => rewrite(v, folder, changes)));
  }
  if (value && typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (MEDIA_KEYS.has(k) && isExternal(v)) {
        try {
          out[k] = DRY_RUN ? v : await copyToStorage(v, folder);
          changes.push(`${v} -> ${out[k]}`);
        } catch (err) {
          console.warn(`  ! ${err.message}`);
          out[k] = v;
        }
      } else {
        out[k] = await rewrite(v, folder, changes);
      }
    }
    return out;
  }
  return value;
}

async function migrate(colName) {
  const snapshot = await getDocs(collection(db, colName));
  for (const d of snapshot.docs) {
    const data = d.data();
    const folder = `${colName}/${data.slug || slugify(data.title)}`;
    const changes = [];
    const next = await rewrite(data, folder, changes);
    if (changes.length === 0) continue;
    console.log(`${colName}/${d.id} (${data.title})`);
    changes.forEach((c) => console.log(`  ${c}`));
    if (!DRY_RUN) await updateDoc(doc(db, colName, d.id), next);
  }
}

async function main() {
  await signInAdmin();
  await migrate("projects");
  await migrate("publications");
  console.log(DRY_RUN ? "Dry run complete; nothing written." : "Migration complete.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
