"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackPageView } from "@/shared/api/analytics";

export function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.toString();

    void trackPageView({
      path: `${pathname}${query ? `?${query}` : ""}`,
      referrer: document.referrer || undefined
    }).catch(() => undefined);
  }, [pathname, searchParams]);

  return null;
}
