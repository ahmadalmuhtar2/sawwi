"use client";

// Fires once per page load on a served site to report a visit. The endpoint
// dedupes per browser session (cookie), so pinging on every load is harmless —
// only the first load of a new session actually counts. Renders nothing.

import * as React from "react";

export function VisitBeacon({ slug }: { slug: string }) {
  React.useEffect(() => {
    fetch("/api/public/visits", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug }),
      keepalive: true,
    }).catch(() => {});
  }, [slug]);
  return null;
}
