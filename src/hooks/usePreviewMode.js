import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";

// Drafts are only fetched for a signed-in admin who asked for ?preview=1.
export function usePreviewMode() {
  const [searchParams] = useSearchParams();
  const wantsPreview = searchParams.get("preview") === "1";
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    if (!wantsPreview) return;
    return onAuthStateChanged(auth, setUser);
  }, [wantsPreview]);

  if (!wantsPreview) return { ready: true, preview: false };
  return { ready: user !== undefined, preview: Boolean(user) };
}
