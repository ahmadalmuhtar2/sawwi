import { redirect } from "next/navigation";
import { getSessionClaims } from "@/lib/auth";
import { Logo } from "@/components/logo";
import { OnboardingForm } from "@/components/dashboard/onboarding-form";

export default async function OnboardingPage() {
  const claims = await getSessionClaims();
  if (!claims) redirect("/login");
  if (claims.workspace) redirect("/dashboard");
  if (claims.siteAccess.length > 0) redirect("/dashboard");

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-bg px-4 py-10">
      <Logo className="mb-8 h-10 w-auto" />
      <div className="w-full max-w-md">
        <OnboardingForm />
      </div>
    </div>
  );
}
