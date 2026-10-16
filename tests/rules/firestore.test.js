// Security rules tests, run against the Firestore emulator: `npm run test:rules`.
import { readFileSync } from "node:fs";
import { after, before, beforeEach, describe, test } from "node:test";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import { deleteDoc, doc, getDoc, setDoc } from "firebase/firestore";

const COLLECTIONS = ["projects", "work", "publications", "skills", "pages", "settings"];
const ADMIN_UID = "jared";

let env;

before(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-jaredstock",
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
  });
});

after(() => env.cleanup());

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, "admins", ADMIN_UID), {});
    for (const name of COLLECTIONS) await setDoc(doc(db, name, "existing"), { title: "x" });
    await setDoc(doc(db, "secrets", "s"), { value: 1 });
  });
});

const visitor = () => env.unauthenticatedContext().firestore();
const stranger = () => env.authenticatedContext("someone-who-signed-up").firestore();
const admin = () => env.authenticatedContext(ADMIN_UID).firestore();

describe("site content", () => {
  for (const name of COLLECTIONS) {
    test(`${name}: anyone can read`, async () => {
      await assertSucceeds(getDoc(doc(visitor(), name, "existing")));
    });

    test(`${name}: visitors cannot write`, async () => {
      await assertFails(setDoc(doc(visitor(), name, "new"), { title: "x" }));
    });

    test(`${name}: a signed-in non-admin cannot write or delete`, async () => {
      await assertFails(setDoc(doc(stranger(), name, "new"), { title: "x" }));
      await assertFails(setDoc(doc(stranger(), name, "existing"), { title: "hacked" }));
      await assertFails(deleteDoc(doc(stranger(), name, "existing")));
    });

    test(`${name}: the admin can write and delete`, async () => {
      await assertSucceeds(setDoc(doc(admin(), name, "new"), { title: "x" }));
      await assertSucceeds(deleteDoc(doc(admin(), name, "existing")));
    });
  }
});

describe("admins list", () => {
  test("a user can read only their own admin entry", async () => {
    await assertSucceeds(getDoc(doc(admin(), "admins", ADMIN_UID)));
    await assertFails(getDoc(doc(stranger(), "admins", ADMIN_UID)));
    await assertFails(getDoc(doc(visitor(), "admins", ADMIN_UID)));
  });

  test("nobody can make themselves an admin", async () => {
    await assertFails(setDoc(doc(stranger(), "admins", "someone-who-signed-up"), {}));
    await assertFails(setDoc(doc(admin(), "admins", "another"), {}));
  });
});

describe("everything else", () => {
  test("other collections are closed", async () => {
    await assertFails(getDoc(doc(visitor(), "secrets", "s")));
    await assertFails(getDoc(doc(admin(), "secrets", "s")));
    await assertFails(setDoc(doc(admin(), "secrets", "s"), { value: 2 }));
  });
});
