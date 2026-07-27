import { redirect } from "next/navigation";
import { getSessionClaims } from "@/lib/auth";
import { LoginForm } from "./login-form";

/** Only honour SAME-SITE relative destinations — never a protocol-relative or
 *  absolute URL — so `?next=` can't be abused as an open redirect. */
function safeNext(v?: string): string | undefined {
  if (!v || !v.startsWith("/") || v.startsWith("//") || v.startsWith("/\\")) return undefined;
  return v;
}

// Already signed in? Skip the form. Uses real session validation (not just the
// cookie), so a stale cookie falls through to the form instead of looping.
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; expired?: string }>;
}) {
  const sp = await searchParams;
  const next = safeNext(sp.next);
  if (await getSessionClaims()) redirect(next ?? "/dashboard");
  return <LoginForm next={next} expired={sp.expired === "1"} />;
}
