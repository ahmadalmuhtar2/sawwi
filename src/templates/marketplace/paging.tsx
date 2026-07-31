"use client";

// Progressive "load more" paging, shared by every list in the marketplace (buyer
// browse grids, a seller's public page, and the admin/seller management lists).
// Client-side by design: the lists are already loaded in full (few-hundred scale),
// so we just reveal them in batches. Because slicing happens AFTER the caller's
// sort, featured (مميّز) listings always land in the first batch.

import * as React from "react";

const AR = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
const toAr = (v: number) => String(v).replace(/[0-9]/g, (d) => AR[+d]);

/** Reveal `items` in pages of `size`. Resets to the first page whenever the
 *  source list changes (new filter/sort/fetch), so you never sit scrolled past a
 *  now-shorter list. */
export function usePaged<T>(items: T[], size: number) {
  const [count, setCount] = React.useState(size);
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset paging when the source list changes
    setCount(size);
  }, [items, size]);
  const visible = items.slice(0, count);
  const remaining = items.length - visible.length;
  return { visible, remaining, hasMore: remaining > 0, showMore: () => setCount((c) => c + size) };
}

/** The mk-styled «عرض المزيد» button, showing how many rows remain. */
export function LoadMore({ remaining, onClick, className = "" }: { remaining: number; onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "mx-auto inline-flex h-11 items-center gap-2 rounded-[10px] border border-mk-line bg-mk-surface px-5 text-[14px] font-semibold text-mk-ink transition hover:bg-mk-track " +
        className
      }
    >
      عرض المزيد
      <span className="text-[12px] text-mk-faint">({toAr(remaining)})</span>
    </button>
  );
}
