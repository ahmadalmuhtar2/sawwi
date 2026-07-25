"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function VerifyEmailPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read URL param client-side once
    setEmail(new URLSearchParams(window.location.search).get("email") ?? "");
  }, []);

  async function resend() {
    if (!email) return;
    setLoading(true);
    // Always show a neutral "sent" outcome, regardless of whether the email is
    // new, unverified, or already registered — never reveal which (enumeration
    // protection, matching Better Auth's sign-up behavior).
    try {
      await authClient.sendVerificationEmail({ email, callbackURL: "/verified" });
    } catch {
      /* swallow — the message stays neutral either way */
    }
    setLoading(false);
    setSent(true);
  }

  return (
    <Card className="p-7 text-center">
      <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-accent-100 text-accent">
        <MailCheck className="size-7" />
      </div>
      <h1 className="text-xl font-extrabold text-ink">أكّد بريدك الإلكتروني</h1>
      <p className="mt-2 text-sm text-muted leading-relaxed">
        أرسلنا رابط التأكيد إلى
        {email ? <span className="font-medium text-ink" dir="ltr"> {email} </span> : " بريدك "}
        — افتح الرسالة واضغط الرابط لتفعيل حسابك.
      </p>

      <div className="mt-6 space-y-3">
        <Button onClick={resend} loading={loading} variant="secondary" className="w-full">
          {sent ? "أُعيد الإرسال ✓" : "إعادة إرسال الرابط"}
        </Button>
        <Link href="/login" className="block text-sm text-accent hover:underline">
          العودة لتسجيل الدخول
        </Link>
      </div>
    </Card>
  );
}
