"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

// The dashboard shell wrapper (see dashboard/layout.tsx) carries data-theme.
const ROOT_ID = "sw-app";
export const THEME_KEY = "sawwi_theme";

type Theme = "light" | "dark";

function currentTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.getElementById(ROOT_ID)?.getAttribute("data-theme") === "dark"
    ? "dark"
    : "light";
}

/**
 * Reads/sets the product-chrome theme. The active value is applied by the inline
 * script in the layout before paint (no flash); this hook just mirrors it and
 * flips the attribute + persists the choice so it sticks across visits.
 */
export function useTheme() {
  // Start light to match SSR, then sync to the script-applied value on mount.
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read the value the pre-paint script already applied
    setTheme(currentTheme());
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.getElementById(ROOT_ID)?.setAttribute("data-theme", next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // private mode / storage disabled — the toggle still works for the session
    }
  }

  return { theme, toggle, isDark: theme === "dark" };
}

/** Theme switch as a dropdown row (used inside the profile menu). */
export function ThemeMenuItem() {
  const { isDark, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      role="menuitem"
      className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-ink transition hover:bg-black/[0.04] dark:hover:bg-white/6 cursor-pointer"
    >
      {isDark ? (
        <Sun className="size-4 text-muted" />
      ) : (
        <Moon className="size-4 text-muted" />
      )}
      {isDark ? "الوضع الفاتح" : "الوضع الداكن"}
    </button>
  );
}

// Runs before paint (injected in the layout) to set the theme with no flash:
// honors a saved choice, else follows the OS preference.
export const THEME_INIT_SCRIPT = `(function(){try{var e=document.getElementById("${ROOT_ID}");if(!e)return;var t=localStorage.getItem("${THEME_KEY}");if(t!=="dark"&&t!=="light"){t=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}e.setAttribute("data-theme",t);}catch(_){}})();`;
