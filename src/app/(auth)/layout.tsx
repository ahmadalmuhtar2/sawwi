import Link from "next/link";
import { cookies } from "next/headers";
import { Logo } from "@/components/logo";
import { ThemeInit } from "@/components/dashboard/theme-toggle";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  // Dark is the platform default; only an explicit `light` cookie opts out. The
  // #sw-app wrapper carries data-theme so the product tokens resolve the theme
  // (auth pages otherwise render on the light :root base).
  const saved = (await cookies()).get("sawwi_theme")?.value;
  const theme = saved === "light" ? "light" : "dark";

  return (
    <div id="sw-app" data-theme={theme} style={{ display: "contents" }} suppressHydrationWarning>
      <ThemeInit />
      <div className="min-h-dvh flex flex-col items-center justify-center bg-bg px-4 py-10">
        <Link href="/" className="mb-8">
          <Logo className="h-11 w-auto" />
        </Link>
        <div className="w-full max-w-md">{children}</div>
        <p className="mt-8 text-xs text-faint">© سوّي — منصّة مواقع الأعمال</p>
      </div>
    </div>
  );
}
