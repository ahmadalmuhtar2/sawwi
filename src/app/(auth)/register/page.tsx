import { redirect } from "next/navigation";
import { getSessionClaims } from "@/lib/auth";

// Public self-serve registration is DISABLED in the business model: resellers
// and direct owners are admin-provisioned, and business owners arrive by invite
// (see docs/BUSINESS_MODEL.md). Signed-in users go to the dashboard; everyone
// else is sent to login. The old RegisterForm is kept in-tree but unreferenced.
export default async function RegisterPage() {
  if (await getSessionClaims()) redirect("/dashboard");
  redirect("/login");
}
