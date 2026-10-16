import { auth } from "../src/firebase.js";
import { signInWithEmailAndPassword } from "firebase/auth";

// Writes need an admin once firestore.rules / storage.rules are deployed.
export async function signInAdmin() {
  const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.warn("ADMIN_EMAIL / ADMIN_PASSWORD not set; continuing unauthenticated.");
    return null;
  }
  const { user } = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
  console.log(`Signed in as ${user.email}`);
  return user;
}
