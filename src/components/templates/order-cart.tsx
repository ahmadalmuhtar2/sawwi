"use client";

// Shared "order cart" for the menu templates. A visitor taps items to add them,
// the running quantity + total live here, and a bottom-drawer previews the whole
// order and (when the shop has a WhatsApp number) sends it as a ready message.
//
// Like site-chrome, this is COLOR-AGNOSTIC: the logic (useOrderCart) and the
// widgets (OrderCart, CartStepper) are shared, and each template passes its own
// `CartTheme` (a handful of palette class strings) so the cart matches its look.
//
// Prices come in as NUMBERS (parse the template's Arabic price strings with
// `priceNumber` before adding). Totals render with `formatArabicAmount` so the
// cart reads in the same Arabic-Indic digits + unit as every price on the page.

import * as React from "react";
import { whatsappLink } from "@/lib/whatsapp";
import { formatArabicAmount, toArabicDigits } from "@/shared/currency";
import { WhatsAppIcon } from "@/components/templates/site-chrome";

/* ───────────────────────────── state ───────────────────────────── */

export interface CartItemInput {
  /** stable unique id within the menu (use the item's index in the FULL list). */
  id: string;
  name: string;
  /** numeric unit price (parse the price string with `priceNumber` first). */
  price: number;
}

export interface CartLine extends CartItemInput {
  qty: number;
}

export interface CartApi {
  lines: CartLine[];
  count: number;
  total: number;
  qtyOf: (id: string) => number;
  add: (item: CartItemInput) => void;
  inc: (id: string) => void;
  dec: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
}

/** The order cart state. Lines keep insertion order; adding an existing id bumps
 *  its quantity (and refreshes name/price in case the content changed). */
export function useOrderCart(): CartApi {
  const [lines, setLines] = React.useState<CartLine[]>([]);

  const add = React.useCallback((item: CartItemInput) => {
    setLines((prev) => {
      const i = prev.findIndex((l) => l.id === item.id);
      if (i < 0) return [...prev, { ...item, qty: 1 }];
      return prev.map((l, idx) =>
        idx === i ? { ...l, qty: l.qty + 1, name: item.name, price: item.price } : l,
      );
    });
  }, []);
  const inc = React.useCallback(
    (id: string) => setLines((prev) => prev.map((l) => (l.id === id ? { ...l, qty: l.qty + 1 } : l))),
    [],
  );
  const dec = React.useCallback(
    (id: string) =>
      setLines((prev) =>
        prev.flatMap((l) => (l.id !== id ? [l] : l.qty <= 1 ? [] : [{ ...l, qty: l.qty - 1 }])),
      ),
    [],
  );
  const remove = React.useCallback(
    (id: string) => setLines((prev) => prev.filter((l) => l.id !== id)),
    [],
  );
  const clear = React.useCallback(() => setLines([]), []);
  const qtyOf = React.useCallback(
    (id: string) => lines.find((l) => l.id === id)?.qty ?? 0,
    [lines],
  );

  const count = lines.reduce((s, l) => s + l.qty, 0);
  const total = lines.reduce((s, l) => s + l.qty * l.price, 0);
  return { lines, count, total, qtyOf, add, inc, dec, remove, clear };
}

/* ───────────────────────────── theme ───────────────────────────── */

/** Palette hooks each template fills in so the shared cart matches its look.
 *  Every value is a complete class string (colors + rounding + borders). */
export interface CartTheme {
  /** full-screen backdrop behind the drawer */
  scrim: string;
  /** drawer panel: bg + base text + rounding + border */
  panel: string;
  /** floating cart bar: bg + text + rounding + shadow */
  bar: string;
  /** primary action button (send / add): bg + text + rounding */
  cta: string;
  /** the +/- stepper buttons: border + text + rounding */
  step: string;
  /** row/section divider border color, e.g. "border-cream/15" */
  divider: string;
  /** secondary text color, e.g. "text-cream/70" */
  muted: string;
}

/* ─────────────────────────── widgets ─────────────────────────── */

const BagIcon = ({ className = "size-4" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
    <path d="M6 8h12l-1 12H7L6 8z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M9 8V6.5a3 3 0 0 1 6 0V8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

/** Add-to-order control for one item: an "أضف" button that becomes a −/qty/＋
 *  stepper once the item is in the cart. Drop it into an item's detail sheet. */
export function CartStepper({
  cart,
  item,
  theme,
  className = "",
  addLabel = "أضف للطلب",
}: {
  cart: CartApi;
  item: CartItemInput;
  theme: CartTheme;
  className?: string;
  addLabel?: string;
}) {
  const qty = cart.qtyOf(item.id);
  if (qty === 0) {
    return (
      <button
        type="button"
        onClick={() => cart.add(item)}
        className={`inline-flex h-[46px] cursor-pointer items-center justify-center gap-2 px-5 font-display text-sm font-bold ${theme.cta} ${className}`}
      >
        <BagIcon className="size-[17px]" />
        {addLabel}
      </button>
    );
  }
  return (
    <span className={`inline-flex h-[46px] items-center justify-center gap-2.5 ${className}`}>
      <button
        type="button"
        onClick={() => cart.dec(item.id)}
        aria-label="إنقاص"
        className={`inline-flex size-9 cursor-pointer items-center justify-center text-lg leading-none ${theme.step}`}
      >
        −
      </button>
      <span className="min-w-[2ch] text-center font-serif text-lg leading-none tabular-nums">
        {toArabicDigits(String(qty))}
      </span>
      <button
        type="button"
        onClick={() => cart.inc(item.id)}
        aria-label="زيادة"
        className={`inline-flex size-9 cursor-pointer items-center justify-center text-lg leading-none ${theme.step}`}
      >
        ＋
      </button>
    </span>
  );
}

/** The WhatsApp order message: an itemized list + total, in Arabic-Indic. */
function orderMessage(cart: CartApi, currency: string, shopName: string): string {
  const lines = cart.lines
    .map((l) => `• ${l.name} ×${toArabicDigits(String(l.qty))} = ${formatArabicAmount(l.qty * l.price)} ${currency}`)
    .join("\n");
  return `مرحبًا ${shopName}، أودّ الطلب:\n${lines}\n\nالمجموع: ${formatArabicAmount(cart.total)} ${currency}`;
}

/** The floating cart bar + the order drawer. Render it ONCE per template (only
 *  on the published/preview site — not in the builder). Hidden while empty. */
export function OrderCart({
  cart,
  currency,
  whatsapp,
  shopName,
  theme,
}: {
  cart: CartApi;
  currency: string;
  whatsapp?: string;
  shopName: string;
  theme: CartTheme;
}) {
  const [open, setOpen] = React.useState(false);
  // Reset the drawer when the cart empties, so re-adding an item shows the
  // floating bar (not the still-open drawer). Adjusting state during render is
  // React's recommended alternative to a setState-in-effect.
  if (open && cart.count === 0) setOpen(false);

  if (cart.count === 0) return null;

  const totalText = `${formatArabicAmount(cart.total)} ${currency}`;
  const waHref = whatsapp ? whatsappLink(whatsapp, orderMessage(cart, currency, shopName)) : null;

  return (
    <>
      {/* floating bar — above the mobile tab bar; bottom-end on desktop */}
      {!open && (
        <div className="fixed inset-x-0 bottom-[74px] z-[70] mx-auto flex w-full max-w-107.5 justify-center px-4 lg:inset-x-auto lg:bottom-6 lg:end-6 lg:mx-0 lg:w-auto lg:max-w-none lg:px-0">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className={`inline-flex h-12 w-full max-w-[420px] cursor-pointer items-center gap-3 px-4 font-display text-sm font-bold shadow-lg lg:w-auto ${theme.bar}`}
          >
            <span className="relative inline-flex">
              <BagIcon className="size-5" />
              <span className="absolute -end-2 -top-2 inline-flex min-w-[18px] items-center justify-center rounded-full bg-black/25 px-1 text-[11px] font-bold leading-[18px]">
                {toArabicDigits(String(cart.count))}
              </span>
            </span>
            عرض الطلب
            <span className="ms-auto font-serif text-base tabular-nums">{totalText}</span>
          </button>
        </div>
      )}

      {/* drawer */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className={`fixed inset-0 z-[85] flex items-end justify-center backdrop-blur-[4px] lg:items-center lg:p-6 ${theme.scrim}`}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`flex max-h-[80vh] w-full max-w-107.5 flex-col overflow-hidden lg:max-w-[440px] ${theme.panel}`}
          >
            <div className={`flex items-center justify-between gap-3 border-b px-[22px] py-4 ${theme.divider}`}>
              <span className="font-display text-lg font-extrabold">طلبك</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="إغلاق"
                className={`inline-flex size-8 cursor-pointer items-center justify-center ${theme.step}`}
              >
                <svg viewBox="0 0 16 16" fill="none" className="size-[15px]">
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-[22px]">
              {cart.lines.map((l) => (
                <div key={l.id} className={`flex items-center gap-3 border-b py-3.5 ${theme.divider}`}>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate font-display text-[14.5px] font-bold">{l.name}</span>
                    <span className={`font-serif text-xs ${theme.muted}`}>
                      {formatArabicAmount(l.price)} {currency}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => cart.dec(l.id)}
                      aria-label="إنقاص"
                      className={`inline-flex size-8 cursor-pointer items-center justify-center text-base leading-none ${theme.step}`}
                    >
                      −
                    </button>
                    <span className="min-w-[2ch] text-center font-serif text-base tabular-nums">
                      {toArabicDigits(String(l.qty))}
                    </span>
                    <button
                      type="button"
                      onClick={() => cart.inc(l.id)}
                      aria-label="زيادة"
                      className={`inline-flex size-8 cursor-pointer items-center justify-center text-base leading-none ${theme.step}`}
                    >
                      ＋
                    </button>
                  </span>
                  <span className="min-w-[72px] text-end font-serif text-[15px] tabular-nums">
                    {formatArabicAmount(l.qty * l.price)}
                  </span>
                </div>
              ))}
            </div>

            <div className={`flex flex-col gap-3 border-t px-[22px] py-4 ${theme.divider}`}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-display text-[15px] font-bold">المجموع</span>
                <span className="font-serif text-[22px] tabular-nums">{totalText}</span>
              </div>
              {waHref && (
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex h-[52px] items-center justify-center gap-2.5 font-display text-[15px] font-bold ${theme.cta}`}
                >
                  <WhatsAppIcon />
                  أرسل الطلب عبر واتساب
                </a>
              )}
              <button
                type="button"
                onClick={cart.clear}
                className={`inline-flex h-9 cursor-pointer items-center justify-center text-[13px] font-semibold ${theme.muted}`}
              >
                إفراغ الطلب
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
