"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/** Immediate non-blocking feedback when App Router takes time to change pages. */
export function NavigationFeedback() {
  const pathname = usePathname();
  const [destination, setDestination] = useState<string | null>(null);
  const pending = destination !== null && destination !== pathname;

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!(event.target instanceof Element)) return;
      const link = event.target.closest("a[href]");
      if (!link || link.hasAttribute("download") || link.getAttribute("target") === "_blank") return;
      if (link.getAttribute("aria-disabled") === "true") return;
      const href = link.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      setDestination(url.pathname);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    if (!pending) return;
    const timeout = window.setTimeout(() => setDestination(null), 12000);
    return () => window.clearTimeout(timeout);
  }, [pending, destination]);

  if (!pending) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[250]" role="status" aria-live="polite">
      <div className="h-[3px] w-full overflow-hidden bg-accent-soft">
        <div className="h-full w-2/3 animate-pulse rounded-r-full bg-accent" />
      </div>
      <span className="sr-only">Apertura pagina in corso</span>
    </div>
  );
}
