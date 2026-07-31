import * as React from "react";
import { cn } from "@/lib/cn";
import { InfoTip } from "./info-tip";

const inputBase =
  "w-full h-10 px-3 rounded-md bg-surface border border-line text-ink placeholder:text-faint focus-ring transition disabled:opacity-60 aria-[invalid=true]:border-danger aria-[invalid=true]:bg-danger-100/30";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(inputBase, className)} {...props} />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(inputBase, "h-auto min-h-24 py-2 leading-relaxed", className)}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(inputBase, "appearance-none pe-9 bg-no-repeat cursor-pointer", className)}
    style={{
      backgroundImage:
        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='M4 6l4 4 4-4'/%3E%3C/svg%3E\")",
      backgroundPosition: "left 0.75rem center",
    }}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";

export function Field({
  label,
  error,
  hint,
  info,
  htmlFor,
  children,
  className,
}: {
  label?: string;
  error?: string;
  hint?: string;
  /** Short description shown as an "i" tooltip beside the label. */
  info?: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <div className="flex items-center gap-1.5">
          <label htmlFor={htmlFor} className="block text-sm font-medium text-ink">
            {label}
          </label>
          {info && <InfoTip text={info} />}
        </div>
      )}
      {children}
      {error ? (
        <p className="text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-faint">{hint}</p>
      ) : null}
    </div>
  );
}
