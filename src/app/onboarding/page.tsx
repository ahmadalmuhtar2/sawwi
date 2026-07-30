import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionClaims } from "@/lib/auth";
import { Logo } from "@/components/logo";

// Self-serve workspace creation is DISABLED (accounts are admin-provisioned).
// A user only lands here if they have no workspace and no site grant — i.e. an
// account that hasn't been fully set up. We explain rather than offer creation.
export default async function OnboardingPage() {
  const claims = await getSessionClaims();
  if (!claims) redirect("/login");
  if (claims.workspace) redirect("/dashboard");
  if (claims.siteAccess.length > 0) redirect("/dashboard");

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-bg px-4 py-10">
      <Logo className="mb-8 h-10 w-auto" />
      <div className="w-full max-w-md rounded-xl border border-line bg-surface p-7 text-center">
        <h1 className="text-xl font-extrabold text-ink">الحساب قيد الإعداد</h1>
        <p className="mt-3 text-sm text-muted">
          لم يتم ربط حسابك بأي موقع بعد. يتم إنشاء الحسابات والمواقع عبر إدارة
          سوّي أو من خلال الموزّع الذي تتعامل معه. يرجى التواصل معهم لإكمال الإعداد.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm text-accent hover:underline"
        >
          العودة لتسجيل الدخول
        </Link>
      </div>
    </div>
  );
}
