import Link from "next/link";
import { Logo } from "@/components/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-bg px-4 py-10">
      <Link href="/" className="mb-8">
        <Logo className="h-11 w-auto" />
      </Link>
      <div className="w-full max-w-md">{children}</div>
      <p className="mt-8 text-xs text-faint">© سوّي — منصّة مواقع الأعمال</p>
    </div>
  );
}
