import { initializeApp } from "firebase/app";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectAuthEmulator, getAuth } from "firebase/auth";

// Vite inlines import.meta.env in the browser; the Node scripts read process.env instead.
const env = (name) =>
  import.meta.env?.[name] || (typeof process !== "undefined" ? process.env[name] : undefined);

const firebaseConfig = {
  apiKey: env("VITE_FIREBASE_API_KEY"),
  authDomain: env("VITE_FIREBASE_AUTH_DOMAIN"),
  projectId: "driven-binder-500400-c2",
  storageBucket: env("VITE_FIREBASE_STORAGE_BUCKET") || "driven-binder-500400-c2.firebasestorage.app",
  messagingSenderId: env("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  appId: env("VITE_FIREBASE_APP_ID"),
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// VITE_FIREBASE_EMULATORS=true points the app at `npm run emulators` instead of production.
// (Storage is only used by the admin, which connects its own emulator; see MediaField.)
export const usingEmulators = env("VITE_FIREBASE_EMULATORS") === "true";
if (usingEmulators) {
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
}
