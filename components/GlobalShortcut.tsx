"use client";
import { useEffect } from "react";

export default function GlobalShortcut() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const isShortcut =
        (isMac && e.metaKey && e.shiftKey && e.key.toLowerCase() === "f") ||
        (!isMac && e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "f");
      if (isShortcut) {
        e.preventDefault();
        window.dispatchEvent(new Event("focus-wiki-search"));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  return null;
}
