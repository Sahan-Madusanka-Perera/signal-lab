import { useEffect } from "react";

const SITE = "SignalLab";

/**
 * Sets the document title for a route, and restores the site title on unmount.
 * Without this every page shares one title, so browser tabs, history entries
 * and bookmarks of a shared lesson link are indistinguishable.
 */
export function useDocumentTitle(title: string | null) {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE}` : `${SITE} · Data communication and networking, drawn out`;
  }, [title]);
}
