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

const ICONS = {
  success: <CheckCircle2 className="size-5 text-accent" />,
  info: <Info className="size-5 text-ink" />,
  error: <AlertTriangle className="size-5 text-danger" />,
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
              "flex items-start gap-3 bg-surface border border-line rounded-lg shadow-md px-4 py-3 animate-in",
            )}
          >
            {ICONS[t.type]}
            <p className="flex-1 text-sm text-ink leading-relaxed">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="text-faint hover:text-ink cursor-pointer"
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
