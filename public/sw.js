/* Sawwi service worker — installability + Web Push. Intentionally minimal: no
   offline caching (the dashboard needs the network), just the lifecycle hooks
   plus push handling. Any edit to this file forces an update on next load. */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// A no-op fetch handler — its presence is part of the installability criteria.
self.addEventListener("fetch", () => {});

// A push arrived → show a notification. Payload is JSON: { title, body, url, tag }.
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: event.data && event.data.text ? event.data.text() : "سوّي" };
  }
  const title = data.title || "سوّي";
  const options = {
    body: data.body || "",
    icon: "/brand/logo.svg",
    badge: "/brand/favicon.svg",
    tag: data.tag || undefined,
    data: { url: data.url || "/dashboard" },
    dir: "rtl",
    lang: "ar",
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Tapping the notification focuses an open dashboard tab, or opens one.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/dashboard";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});
