import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "سوّي — أنشئ موقع عملك في دقائق",
  description:
    "منصّة عربية لبناء مواقع الأعمال المحلية: اختر قالبًا، رتّب الأقسام، واملأ بياناتك — بدون تصميم من الصفر.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" className="h-full antialiased">
      {/* suppressHydrationWarning: browser extensions (e.g. ColorZilla's
          `cz-shortcut-listen`) inject attributes on <body> before hydration.
          This suppresses the resulting attribute mismatch on this element only. */}
      <body className="min-h-full" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
