import { useEffect, useState } from "react";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

// Everything on the site that isn't a list lives in one doc: settings/site.
// These defaults are what the site showed before it was editable, so a missing
// doc or a missing field renders exactly like the old hardcoded site.
export const DEFAULT_SETTINGS = {
  name: "jared stock",
  links: {
    github: "https://github.com/jstock29",
    linkedin: "https://www.linkedin.com/in/jaredstock/",
    email: "jstock529@gmail.com",
  },
  about: {
    heading: "i'm jared. i make things on the internet.",
    body:
      "I'm a technologist everywhere and senior developer at [Thoughtworks](https://www.thoughtworks.com/). " +
      "I love podcasts, running in Central Park, reading too much sci-fi, my cat, and hiking to stand on " +
      "top of tall things. I can also tell you where to find the best bagel in New York.",
    photo: "https://jareds-file-sharing.s3.amazonaws.com/jared_on_stuff.jpeg",
  },
  resumeUrl: "https://jareds-file-sharing.s3.amazonaws.com/Jared+Stock+Resume.pdf",
  sections: {
    about: { title: "about", show: true },
    work: { title: "experience", show: true },
    projects: { title: "projects", show: true },
    publications: { title: "publications", show: true },
  },
  footer: { name: "Jared Stock", location: "NYC" },
  // The blog at /blog. Jared named it; the description is his to write.
  blog: { title: "Minimum Viable", description: "" },
};

export const SECTION_KEYS = ["about", "work", "projects", "publications"];

const isObject = (v) => v && typeof v === "object" && !Array.isArray(v);

// Deep-merges saved settings over the defaults. Only missing fields fall back: a field the
// admin cleared on purpose (say, the LinkedIn link) stays blank.
export function mergeSettings(saved = {}, defaults = DEFAULT_SETTINGS) {
  const out = { ...defaults };
  for (const [key, value] of Object.entries(saved || {})) {
    if (isObject(defaults[key])) out[key] = mergeSettings(value, defaults[key]);
    else if (value !== null && value !== undefined) out[key] = value;
  }
  return out;
}

let cache = null;

export function getSettings({ fresh = false } = {}) {
  if (!cache || fresh) {
    const pending = getDoc(doc(db, "settings", "site"))
      .then((snap) => mergeSettings(snap.exists() ? snap.data() : {}))
      .catch(() => DEFAULT_SETTINGS);
    cache = pending;
  }
  return cache;
}

// null until loaded (or the defaults if Firestore is unreachable), so pages never
// flash the old copy before the saved copy arrives.
export function useSettings() {
  const [settings, setSettings] = useState(null);
  useEffect(() => {
    let cancelled = false;
    getSettings().then((s) => !cancelled && setSettings(s));
    return () => {
      cancelled = true;
    };
  }, []);
  return settings;
}
