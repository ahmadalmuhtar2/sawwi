import { redirect } from "next/navigation";
import { getSessionClaims } from "@/lib/auth";
import { LoginForm } from "./login-form";

// Already signed in? Skip the form. Uses real session validation (not just the
// cookie), so a stale cookie falls through to the form instead of looping.
export default async function LoginPage() {
  if (await getSessionClaims()) redirect("/dashboard");
  return <LoginForm />;
}
