import { redirect } from "next/navigation";
import { getSessionClaims } from "@/lib/auth";
import { RegisterForm } from "./register-form";

// Already signed in? Skip registration and go to the dashboard.
export default async function RegisterPage() {
  if (await getSessionClaims()) redirect("/dashboard");
  return <RegisterForm />;
}
