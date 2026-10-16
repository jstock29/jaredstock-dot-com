// Storage security rules tests, run against the Storage and Firestore emulators: `npm run test:rules`.
// The admin check reads Firestore, so both emulators run together.
import { readFileSync } from "node:fs";
import { after, before, beforeEach, describe, test } from "node:test";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getBytes } from "firebase/storage";

const ADMIN_UID = "jared";
const MB = 1024 * 1024;

let env;

before(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-jaredstock",
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
    storage: { rules: readFileSync("storage.rules", "utf8") },
  });
});

after(() => env.cleanup());

beforeEach(async () => {
  await env.clearFirestore();
  await env.clearStorage();
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), "admins", ADMIN_UID), {});
    await uploadBytes(ref(ctx.storage(), "projects/demo/existing.png"), new Uint8Array([1]), {
      contentType: "image/png",
    });
  });
});

const visitor = () => env.unauthenticatedContext().storage();
const stranger = () => env.authenticatedContext("someone-who-signed-up").storage();
const admin = () => env.authenticatedContext(ADMIN_UID).storage();

const upload = (storage, path, bytes, contentType) =>
  uploadBytes(ref(storage, path), new Uint8Array(bytes), { contentType });

describe("media uploads", () => {
  test("anyone can read uploaded media", async () => {
    await assertSucceeds(getBytes(ref(visitor(), "projects/demo/existing.png")));
  });

  test("visitors and signed-in non-admins cannot upload", async () => {
    await assertFails(upload(visitor(), "projects/demo/a.png", 10, "image/png"));
    await assertFails(upload(stranger(), "projects/demo/a.png", 10, "image/png"));
  });

  for (const folder of ["projects", "publications", "pages", "site"]) {
    test(`the admin can upload images and videos to ${folder}/`, async () => {
      await assertSucceeds(upload(admin(), `${folder}/x/a.gif`, 10, "image/gif"));
      await assertSucceeds(upload(admin(), `${folder}/x/a.mp4`, 10, "video/mp4"));
    });
  }

  test("the admin can upload a PDF to site/ only", async () => {
    await assertSucceeds(upload(admin(), "site/resume.pdf", 10, "application/pdf"));
    await assertFails(upload(admin(), "projects/x/resume.pdf", 10, "application/pdf"));
  });

  test("other file types and other folders are refused", async () => {
    await assertFails(upload(admin(), "projects/x/run.js", 10, "text/javascript"));
    await assertFails(upload(admin(), "elsewhere/a.png", 10, "image/png"));
  });

  test("size limits hold", async () => {
    await assertFails(upload(admin(), "projects/x/big.mp4", 50 * MB, "video/mp4"));
    await assertFails(upload(admin(), "site/big.pdf", 15 * MB, "application/pdf"));
  });
});
