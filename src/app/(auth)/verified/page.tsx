"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const REDIRECT_MS = 3000;

export default function VerifiedPage() {
  const router = useRouter();
  const [seconds, setSeconds] = useState(REDIRECT_MS / 1000);

  useEffect(() => {
    // Auto-forward to the dashboard (the user is already signed in via
    // autoSignInAfterVerification), with a visible countdown.
    const tick = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    const go = setTimeout(() => router.replace("/dashboard"), REDIRECT_MS);
    return () => {
      clearInterval(tick);
      clearTimeout(go);
    };
  }, [router]);

  return (
    <Card className="p-7 text-center">
      <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-accent-100 text-accent">
        <CheckCircle2 className="size-9" />
      </div>
      <h1 className="text-xl font-extrabold text-ink">تم تأكيد بريدك الإلكتروني ✓</h1>
      <p className="mt-2 text-sm text-muted leading-relaxed">
        أصبح حسابك مفعّلًا. سنأخذك إلى لوحة التحكم خلال {seconds} ثانية…
      </p>

      <div className="mt-6">
        <Link href="/dashboard">
          <Button size="lg" className="w-full">
            الذهاب إلى لوحة التحكم الآن
          </Button>
        </Link>
      </div>
    </Card>
  );
}
