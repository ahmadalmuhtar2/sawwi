"use client";

// Sidebar PWA controls: "install as app" + "enable notifications". Registers the
// service worker, captures the install prompt, and manages the Web Push
// subscription. The install item HIDES once the app is running as an installed
// PWA (display-mode: standalone) — per the requirement. Rendered in the dashboard
// sidebar (desktop rail + mobile drawer).

import { useCallback, useEffect, useState } from "react";
import { Download, Bell, BellRing, BellOff } from "lucide-react";
import { cn } from "@/lib/cn";
import { api } from "@/lib/api-client";
import { useToast } from "@/components/ui/toast";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type PushState = "unsupported" | "default" | "enabled" | "denied" | "busy";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

// VAPID keys are base64url; the browser wants a Uint8Array applicationServerKey.
function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

const isIOS = () =>
  typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);

export function PwaControls({ collapsed = false }: { collapsed?: boolean }) {
  const toast = useToast();
  const [standalone, setStandalone] = useState(false);
  const [installEvt, setInstallEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [push, setPush] = useState<PushState>("default");

  // Register the service worker + resolve the current push state on mount. The
  // synchronous setState calls read browser-only APIs (matchMedia, Notification,
  // serviceWorker) that don't exist during SSR, so they MUST run here rather than
  // in a useState initializer — starting from the SSR defaults avoids a hydration
  // mismatch, then this effect reconciles to the real values on the client.
  /* eslint-disable react-hooks/set-state-in-effect -- browser-only init on mount (see above) */
  useEffect(() => {
    setStandalone(isStandalone());
    if (!("serviceWorker" in navigator)) {
      setPush("unsupported");
      return;
    }
    navigator.serviceWorker.register("/sw.js").catch(() => {});

    const pushSupported = "PushManager" in window && "Notification" in window;
    if (!pushSupported) {
      setPush("unsupported");
    } else if (Notification.permission === "denied") {
      setPush("denied");
    } else {
      // Reflect an existing subscription as "enabled".
      navigator.serviceWorker.ready
        .then((reg) => reg.pushManager.getSubscription())
        .then((sub) => setPush(sub ? "enabled" : "default"))
        .catch(() => {});
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => { setInstallEvt(null); setStandalone(true); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const install = useCallback(async () => {
    if (installEvt) {
      await installEvt.prompt();
      const { outcome } = await installEvt.userChoice;
      if (outcome === "accepted") setInstallEvt(null);
      return;
    }
    // iOS has no install event — guide the user to the Share → Add to Home Screen.
    if (isIOS()) toast("للتثبيت: زر المشاركة ← «إضافة إلى الشاشة الرئيسية»");
  }, [installEvt, toast]);

  const enableNotifications = useCallback(async () => {
    if (push === "enabled") {
      // Turn OFF.
      setPush("busy");
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await api.del(`/api/push/subscribe?endpoint=${encodeURIComponent(sub.endpoint)}`).catch(() => {});
          await sub.unsubscribe().catch(() => {});
        }
        setPush("default");
        toast("تم إيقاف الإشعارات");
      } catch {
        setPush("enabled");
        toast("تعذّر إيقاف الإشعارات", "error");
      }
      return;
    }
    if (!VAPID_PUBLIC_KEY) {
      toast("الإشعارات غير مهيّأة على الخادم بعد", "error");
      return;
    }
    setPush("busy");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setPush(permission === "denied" ? "denied" : "default");
        if (permission === "denied") toast("تم حظر الإشعارات من المتصفح", "error");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });
      const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
      await api.post("/api/push/subscribe", {
        endpoint: json.endpoint,
        keys: { p256dh: json.keys?.p256dh, auth: json.keys?.auth },
      });
      setPush("enabled");
      toast("تم تفعيل الإشعارات ✓");
    } catch {
      setPush("default");
      toast("تعذّر تفعيل الإشعارات", "error");
    }
  }, [push, toast]);

  const showInstall = !standalone && (installEvt !== null || isIOS());
  if (push === "unsupported" && !showInstall) return null;

  const itemCls = cn(
    "flex w-full items-center gap-3 rounded-md py-2.5 text-sm font-medium transition cursor-pointer text-muted hover:bg-black/[0.03] hover:text-ink dark:hover:bg-white/5",
    collapsed ? "justify-center px-0" : "px-3",
  );

  const notifLabel =
    push === "enabled" ? "الإشعارات مفعّلة"
    : push === "denied" ? "الإشعارات محظورة"
    : push === "busy" ? "لحظة…"
    : "تفعيل الإشعارات";

  return (
    <div className="space-y-1">
      {showInstall && (
        <button type="button" onClick={install} title={collapsed ? "تثبيت التطبيق" : undefined} className={itemCls}>
          <Download className="size-[18px]" />
          {!collapsed && "تثبيت التطبيق"}
        </button>
      )}
      {push !== "unsupported" && (
        <button
          type="button"
          onClick={enableNotifications}
          disabled={push === "busy" || push === "denied"}
          title={collapsed ? notifLabel : undefined}
          className={cn(itemCls, (push === "busy" || push === "denied") && "opacity-60 cursor-not-allowed")}
        >
          {push === "enabled" ? <BellRing className="size-[18px] text-accent" /> : push === "denied" ? <BellOff className="size-[18px]" /> : <Bell className="size-[18px]" />}
          {!collapsed && notifLabel}
        </button>
      )}
    </div>
  );
}
