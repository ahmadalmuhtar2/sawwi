"use client";

import * as React from "react";
import { CheckCircle2, Info, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/cn";

type ToastType = "success" | "info" | "error";
interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

const ToastCtx = React.createContext<{
  toast: (message: string, type?: ToastType) => void;
} | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx.toast;
}

// Icons inherit the toast's text color (white) via currentColor.
const ICONS = {
  success: <CheckCircle2 className="size-5" />,
  info: <Info className="size-5" />,
  error: <AlertTriangle className="size-5" />,
};

// The whole toast is colored by type — solid fill + white text.
const STYLES: Record<ToastType, string> = {
  success: "bg-green-600 border-green-700 text-white",
  info: "bg-neutral-800 border-neutral-900 text-white dark:bg-neutral-700 dark:border-neutral-600",
  error: "bg-red-600 border-red-700 text-white",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const toast = React.useCallback((message: string, type: ToastType = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  const dismiss = (id: number) => setToasts((t) => t.filter((x) => x.id !== id));

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 start-4 z-[60] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)]">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "flex items-start gap-3 rounded-lg border shadow-md px-4 py-3 animate-in",
              STYLES[t.type],
            )}
          >
            {ICONS[t.type]}
            <p className="flex-1 text-sm leading-relaxed">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="text-white/70 hover:text-white cursor-pointer"
              aria-label="إغلاق"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
