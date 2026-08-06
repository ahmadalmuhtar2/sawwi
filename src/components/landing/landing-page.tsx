"use client";

// The marketing landing page. Ported from the standalone design into React:
// scoped styles (./landing.css), self-hosted fonts, theme-aware (light/dark via
// a toggle synced to the `sawwi_theme` cookie), and the "free preview" form wired
// to the public leads API (POST /api/public/leads → notifies admins).

import * as React from "react";
import Link from "next/link";
import { Sun, Moon } from "lucide-react";
import { api, ApiClientError } from "@/lib/api-client";
import "./landing.css";

type Theme = "light" | "dark";

const MarkSvg = () => (
  <svg viewBox="0 0 100 100" aria-hidden>
    <rect x="19" y="69.5" width="62" height="11.5" rx="5.75" fill="#fff" />
    <rect x="26" y="38" width="13.05" height="40" rx="6.5" fill="#fff" />
    <rect x="43.45" y="42.5" width="13.05" height="35.5" rx="6.5" fill="#fff" />
    <rect x="60.9" y="47" width="13.05" height="31" rx="6.5" fill="#fff" />
  </svg>
);

// The section chips scrolled in the marquee.
const CHIPS = [
  "الواجهة", "من نحن", "الخدمات", "قائمة الأسعار", "المعرض", "آراء العملاء",
  "الفريق", "ساعات العمل", "الخريطة والعنوان", "واتساب", "الأسئلة الشائعة",
  "شريط إعلان", "تواصل",
];

export function LandingPage({ initialTheme = "dark" }: { initialTheme?: Theme }) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [theme, setTheme] = React.useState<Theme>(initialTheme);

  // form state
  const [biz, setBiz] = React.useState("");
  const [wa, setWa] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [err, setErr] = React.useState<{ biz?: boolean; wa?: boolean; email?: boolean }>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  function toggleTheme() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    // 1-year cookie so the choice survives reloads and is shared with the app.
    document.cookie = `sawwi_theme=${next};path=/;max-age=31536000;samesite=lax`;
  }

  // Sticky-nav shadow + scroll-reveal + smooth anchor scroll. One effect over the
  // landing subtree (scoped via rootRef) — nothing global.
  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const nav = root.querySelector<HTMLElement>("nav");
    const onScroll = () => nav?.classList.toggle("on", window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("on");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.12 },
    );
    root.querySelectorAll(".rv").forEach((el) => io.observe(el));

    // Smooth-scroll same-page anchors without setting global scroll-behavior.
    const onClick = (ev: MouseEvent) => {
      const a = (ev.target as HTMLElement).closest('a[href^="#"]');
      const id = a?.getAttribute("href")?.slice(1);
      if (!id) return;
      const target = root.querySelector(`#${CSS.escape(id)}`);
      if (target) {
        ev.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    root.addEventListener("click", onClick);

    return () => {
      window.removeEventListener("scroll", onScroll);
      io.disconnect();
      root.removeEventListener("click", onClick);
    };
  }, []);

  async function submit() {
    const bizBad = !biz.trim();
    const digits = wa.replace(/\D/g, "").replace(/^0+/, "").replace(/^963/, "");
    const waBad = digits.length !== 9;
    const emailBad = email.trim() !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    setErr({ biz: bizBad, wa: waBad, email: emailBad });
    setFormError(null);
    if (bizBad || waBad || emailBad) return;

    setSubmitting(true);
    try {
      await api.post("/api/public/leads", {
        businessName: biz.trim(),
        whatsapp: digits,
        email: email.trim(),
      });
      setDone(true);
    } catch (e) {
      setFormError(e instanceof ApiClientError ? e.message : "تعذّر الإرسال، حاول مجددًا");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="lp" ref={rootRef} data-theme={theme} dir="rtl" lang="ar">
      {/* announcement */}
      <div className="ann">
        <a href="#contact">
          <b>جديد</b> معاينة مجانية لموقعك خلال ٢٤ ساعة — بدون دفع ←
        </a>
      </div>

      {/* nav */}
      <nav>
        <div className="navin">
          <div className="brand">
            <span className="mark">
              <MarkSvg />
            </span>
            سوّي
          </div>
          <div className="nl">
            <a href="#tpl">القوالب</a>
            <a href="#feat">المزايا</a>
            <a href="#sec">الأقسام</a>
            <a href="#contact">تواصل</a>
          </div>
          <button
            type="button"
            className="tt"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "الوضع الفاتح" : "الوضع الداكن"}
            title={theme === "dark" ? "الوضع الفاتح" : "الوضع الداكن"}
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          <Link className="btn g" href="/login">
            دخول
          </Link>
          <a className="btn" href="#contact">
            ابدأ مجانًا
          </a>
        </div>
      </nav>

      {/* hero */}
      <div className="hero">
        <div className="glow" />
        <div className="wrap">
          <h1>
            مواقع جاهزة
            <br />
            <span>للأعمال المحلية.</span>
          </h1>
          <p className="lede">
            اختر قالبًا لمجالك، املأ معلوماتك، وانشر. لا سحب وإفلات، ولا صفحة بيضاء تخيفك.
          </p>
          <div className="hctas">
            <a className="btn lg" href="#contact">
              ابدأ مجانًا
            </a>
            <a className="btn lg g" href="#tpl">
              شوف القوالب
            </a>
          </div>

        </div>
      </div>

      <div className="strip">
        <p>مبني للسوق السوري — نطاق فرعي فوري، تواصل واتساب، ودفع نقدي أو عبر شام كاش.</p>
      </div>

      {/* features */}
      <section id="feat">
        <div className="wrap">
          <div className="rv">
            <div className="eyeb">المزايا</div>
            <h2>
              كل شي جاهز. <span>ما بيلزمك مصمم.</span>
            </h2>
            <p className="sub">القوالب مقفولة البنية عن قصد — عشان مهما عبّيت، يطلع الموقع مرتّب.</p>
          </div>
          <div className="bento rv">
            <div className="cell">
              <div className="ic">◧</div>
              <h3>تعديل مباشر على الموقع</h3>
              <p>دبل كليك على أي نص أو صورة وعدّلها بمكانها. ما في لوحة تحكم منفصلة.</p>
            </div>
            <div className="cell">
              <div className="ic">↺</div>
              <h3>سجل نسخ ورجوع</h3>
              <p>كل نشر بينحفظ. غلطت؟ ارجع لأي نسخة سابقة بضغطة.</p>
            </div>
            <div className="cell">
              <div className="ic">◐</div>
              <h3>ألوان وأنماط لكل قسم</h3>
              <p>بدّل شكل أي قسم ولونه من خيارات مدروسة — بدون ما تكسر التصميم.</p>
            </div>
            <div className="cell wide">
              <div className="ic">✆</div>
              <h3>واتساب هو زر الشراء</h3>
              <p>
                ما في بوابات دفع بسوريا، فما منتظاهر. كل قالب بيوصل الزبون على واتساب مباشرة — والدفع
                بينحسب يدويًا من لوحة الإدارة مع تتبّع الاشتراك.
              </p>
            </div>
            <div className="cell">
              <div className="ic">⤢</div>
              <h3>نطاق فرعي فورًا</h3>
              <p>
                <span className="mono">اسمك.sawwi.online</span> جاهز لحظة النشر.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* templates */}
      <section id="tpl">
        <div className="wrap">
          <div className="navband rv">
            <div>
              <div className="eyeb">القوالب</div>
              <h2>
                القوالب كلها <span>بحجمها الحقيقي.</span>
              </h2>
              <p className="sub">
                افتح أي قالب على صفحة كاملة، تصفّحه من فوق لتحت، وشوف كيف بيطلع على الموبايل.
              </p>
            </div>
            <Link className="btn lg" href="/templates">
              استعرض كل القوالب ←
            </Link>
          </div>
        </div>
      </section>

      {/* sections library */}
      <section id="sec">
        <div className="wrap rv">
          <div className="eyeb">مكتبة الأقسام</div>
          <h2>
            ١٣ نوع قسم. <span>رتّبها كيف ما بدّك.</span>
          </h2>
        </div>
        <div className="mqw">
          <div className="mq">
            {[...CHIPS, ...CHIPS].map((c, i) => (
              <span className="ch" key={`a${i}`}>
                {c}
              </span>
            ))}
          </div>
          <div className="mq r">
            {[...CHIPS].reverse().concat([...CHIPS].reverse()).map((c, i) => (
              <span className="ch" key={`b${i}`}>
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* stat */}
      <div className="stat">
        <div className="wrap rv">
          <div className="big mono">24h</div>
          <p>من طلبك لمعاينة موقعك جاهزة — مجانًا وقبل ما تدفع شي.</p>
        </div>
      </div>

      {/* contact */}
      <section id="contact">
        <div className="wrap cg">
          <div className="rv">
            <div className="eyeb">تواصل</div>
            <h2>خلّينا نجهّز موقعك.</h2>
            <p className="sub">
              اترك رقم واتساب ومنبني لك معاينة حيّة لموقعك. ما بتدفع شي إلا لما يعجبك.
            </p>
            <div className="pts">
              <div className="pt">
                <span className="tk">✓</span>معاينة مجانية قبل أي التزام
              </div>
              <div className="pt">
                <span className="tk">✓</span>تعديلات غير محدودة
              </div>
              <div className="pt">
                <span className="tk">✓</span>ما منرسل رسائل دعائية
              </div>
            </div>
          </div>
          <div className="card">
            {!done ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void submit();
                }}
              >
                <h3>ابدأ مجانًا</h3>
                <div className="f">
                  <div className="lab">
                    <b>اسم النشاط التجاري</b>
                    <i className="r">مطلوب</i>
                  </div>
                  <input
                    value={biz}
                    onChange={(e) => {
                      setBiz(e.target.value);
                      setErr((p) => ({ ...p, biz: false }));
                    }}
                    className={err.biz ? "bad" : undefined}
                    placeholder="مثال: صالون تاج"
                  />
                  <div className={`er${err.biz ? " show" : ""}`}>اكتب اسم نشاطك التجاري.</div>
                </div>
                <div className="f">
                  <div className="lab">
                    <b>رقم واتساب</b>
                    <i className="r">مطلوب</i>
                  </div>
                  <div className="ph">
                    <input
                      value={wa}
                      onChange={(e) => {
                        setWa(e.target.value);
                        setErr((p) => ({ ...p, wa: false }));
                      }}
                      className={err.wa ? "bad" : undefined}
                      inputMode="tel"
                      placeholder="9XX XXX XXX"
                    />
                    <span className="pfx">+963</span>
                  </div>
                  <div className={`er${err.wa ? " show" : ""}`}>
                    رقم واتساب لازم يكون ٩ أرقام بعد ٩٦٣.
                  </div>
                </div>
                <div className="f">
                  <div className="lab">
                    <b>البريد الإلكتروني</b>
                    <i>اختياري</i>
                  </div>
                  <input
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErr((p) => ({ ...p, email: false }));
                    }}
                    className={err.email ? "bad" : undefined}
                    inputMode="email"
                    placeholder="name@example.com"
                  />
                  <div className={`er${err.email ? " show" : ""}`}>تأكد من صيغة البريد.</div>
                </div>
                <button type="submit" className="btn" disabled={submitting}>
                  {submitting ? "جارٍ الإرسال…" : "أرسل واحصل على معاينة"}
                </button>
                {formError && <div className="er show">{formError}</div>}
                <p className="note">بالضغط، أنت توافق على تواصلنا معك عبر واتساب.</p>
              </form>
            ) : (
              <div className="done show">
                <div className="k">✓</div>
                <h3>وصلنا طلبك</h3>
                <p>منتواصل معك على واتساب خلال ٢٤ ساعة بمعاينة موقعك.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* footer */}
      <footer>
        <div className="wrap">
          <div className="fg">
            <div>
              <div className="brand">
                <span className="mark">
                  <MarkSvg />
                </span>
                سوّي
              </div>
              <p style={{ color: "var(--fg3)", fontSize: 14, marginTop: 12 }}>
                منصّة مواقع الأعمال المحلية
              </p>
            </div>
            <div>
              <h4>المنتج</h4>
              <a href="#tpl">القوالب</a>
              <a href="#sec">الأقسام</a>
              <a href="#feat">المزايا</a>
            </div>
            <div>
              <h4>الحساب</h4>
              <a href="#contact">إنشاء حساب</a>
              <Link href="/login">دخول</Link>
            </div>
            <div>
              <h4>تواصل</h4>
              <a href="#contact">واتساب</a>
              <a href="#contact">راسلنا</a>
            </div>
          </div>
          <div className="fb">
            <span>© سوّي ٢٠٢٦</span>
            <span className="mono">sawwi.online</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
