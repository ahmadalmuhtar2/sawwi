"use client";

/**
 * BarbershopFiveStar — Sawwi template
 * A five-star barbershop, phone-first, Arabic RTL.
 *
 *   الخدمات   services + the session ritual + hygiene standard
 *   الحلاقون  the team + booking etiquette
 *   العناية   aftercare + return intervals
 *   الحجز     service / barber / day → WhatsApp request (shop confirms the time)
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THE POINT OF THIS FILE: static vs. editable content is a TYPE-LEVEL split.
 *
 *   HOUSE_CONTENT  — written once, true of ANY five-star shop (the ritual,
 *                    hygiene standard, booking etiquette, aftercare rules,
 *                    return intervals). Ships as a frozen default. A reseller
 *                    never retypes it, and it is what makes a generic shop
 *                    read as premium.
 *   ShopContent    — the only thing each shop fills in: services + prices,
 *                    barbers, hours, address, phone, photos.
 *
 * If you find yourself asking a shop owner to write "we sterilise between
 * clients", it belongs in HOUSE_CONTENT, not in their onboarding form.
 * ─────────────────────────────────────────────────────────────────────────
 */

import * as React from "react";
import { EditableText, EditableImage, useEdit, useEditList, useEditStrings } from "@/components/templates/inline-edit";
import {
  WhatsAppIcon,
  PhoneIcon,
  SocialLinks,
  useOpenNow,
  groupHours,
  type HoursRow,
} from "@/components/templates/site-chrome";

/** Barbershop palette for the shared social chips (dark ground, bone text). */
const SOCIAL_CHIP = "size-8 rounded-full border border-bone/15 text-bone/75 hover:border-oxblood/60 hover:text-bone";

/* ────────────────────────────── types ────────────────────────────── */

export type Page = "services" | "team" | "care" | "book";

export interface Service {
  /** group id — must match a ServiceGroup */
  group: string;
  name: string;
  latin?: string;
  desc?: string;
  price: string;
  duration: string;
  /** small oxblood label: "الأكثر طلبًا", "توفير" … */
  mark?: string;
  /** what the session includes, shown in the detail sheet */
  includes?: string[];
  photo?: string;
}

export interface ServiceGroup {
  id: string;
  label: string;
}

export interface Barber {
  name: string;
  role: string;
  bio?: string;
  years: number;
  /** false → shown in oxblood as fully booked */
  availableToday?: boolean;
  photo?: string;
}

export interface BookingDay {
  label: string;
  date?: string;
}

export interface ShopContent {
  name: string;
  /** optional uploaded logo (storage URL); shows in the header when set. */
  logo?: string;
  tagline?: string;
  heroLine?: string;
  heroBlurb?: string;
  heroPhoto?: string;
  /** digits only — REQUIRED */
  whatsapp: string;
  phone?: string;
  address?: string;
  socials?: { instagram?: string; facebook?: string; tiktok?: string };
  lastAppointment?: string;
  /** the status line under the brand name, e.g. "مفتوح · آخر موعد ٩:٣٠" */
  headerNote?: string;
  /** editable overrides for the team (الحلاقون) section heading + intro */
  teamKicker?: string;
  teamTitle?: string;
  teamIntro?: string;
  stats?: Array<{ value: string; label: string }>;
}

/** The universal half — override only if a shop genuinely differs. */
export interface HouseContent {
  ritual: Array<{ title: string; body: string }>;
  /** editable overrides for the ritual section heading */
  ritualKicker?: string;
  ritualTitle?: string;
  /** editable override for the hygiene section heading */
  hygieneKicker?: string;
  hygiene: string[];
  /** editable override for the etiquette section heading */
  etiquetteKicker?: string;
  etiquette: string[];
  /** editable overrides for the aftercare (العناية) section heading + intro */
  careKicker?: string;
  careTitle?: string;
  careIntro?: string;
  aftercare: Array<{ title: string; body: string }>;
  /** editable overrides for the intervals (متى تعود) section heading + note */
  intervalsKicker?: string;
  intervalsNote?: string;
  intervals: Array<{ style: string; every: string }>;
}

export interface BarbershopFiveStarProps {
  shop: ShopContent;
  services: Service[];
  groups?: ServiceGroup[];
  barbers: Barber[];
  hours: HoursRow[];
  days?: BookingDay[];
  /** override any part of the universal copy */
  house?: Partial<HouseContent>;
  currency?: string;
  className?: string;
}

/* ─────────────────── HOUSE CONTENT · universal, frozen ─────────────────── */

export const HOUSE_CONTENT: HouseContent = {
  ritual: [
    { title: "استقبال ومشورة", body: "دقيقتان نسألك فيهما عن شكل الشعر الذي تريده وكيف تصفّفه يوميًا — قبل أن نلمس المقص." },
    { title: "غسيل وتدليك فروة", body: "شامبو دافئ وتدليك قصير للفروة يفتح المسام ويجعل القصّ أدقّ." },
    { title: "القصّ", body: "بالمقص أولًا للشكل العام، ثم الماكينة للتدرّج. نتوقّف ونريك النتيجة في المرآة قبل النهاية." },
    { title: "منشفة ساخنة وموسى", body: "منشفة ساخنة بزيت اللافندر ثم تحديد الرقبة والسوالف بالموسى." },
    { title: "تصفيف وشرح", body: "نصفّف الشعر ونخبرك بالمنتج الذي استخدمناه وكيف تكرّره في البيت." },
  ],
  hygiene: [
    "شفرة جديدة تُفتَح أمامك لكل زبون، وتُرمى بعد الجلسة مباشرة.",
    "المقصّات والماكينات تُعقَّم بالأشعة فوق البنفسجية بين كل زبون والذي يليه.",
    "منشفة نظيفة وياقة ورقية لكل جلسة — لا شيء يُعاد استخدامه.",
    "الكرسي ومسند الرأس يُمسحان بمطهّر بعد كل زبون.",
  ],
  etiquette: [
    "احضر قبل موعدك بخمس دقائق — الكرسي يكون جاهزًا في وقته تمامًا.",
    "التأخّر أكثر من عشر دقائق يعني إعادة الجدولة، لأن الموعد التالي محجوز.",
    "للإلغاء، أخبرنا قبل ساعتين على الأقل حتى نعطي الوقت لغيرك.",
    "أحضر صورة إن كنت تريد قصّة بعينها — الوصف بالكلام يختلف من شخص لآخر.",
  ],
  aftercare: [
    { title: "لا تغسل شعرك أول ٢٤ ساعة", body: "بعد الحلاقة بالموسى تحديدًا، اترك البشرة ترتاح قبل الماء الساخن والصابون." },
    { title: "جفّف بالمنشفة بالربت لا بالفرك", body: "الفرك يكسر الشعرة ويفكّ التدرّج الذي صنعناه." },
    { title: "استخدم كمية بحجم حبة الحمّص", body: "أكثر من ذلك يثقّل الشعر ويجعله دهنيًا بعد ساعات." },
    { title: "مشّط الشعر وهو رطب لا جاف", body: "الشعر الجاف يتقصّف عند التمشيط، خصوصًا بعد التدرّج." },
    { title: "غيّر وسادتك القطنية بالحرير", body: "القطن يسحب رطوبة الشعر ليلًا ويترك الفوضى صباحًا." },
  ],
  intervals: [
    { style: "تدرّج قصير (فايد)", every: "كل أسبوعين" },
    { style: "قصّة كلاسيكية", every: "كل ٣–٤ أسابيع" },
    { style: "شعر متوسّط الطول", every: "كل ٦ أسابيع" },
    { style: "تحديد الذقن", every: "كل ١٠ أيام" },
  ],
};

export const defaultGroups: ServiceGroup[] = [
  { id: "hair", label: "الشعر" },
  { id: "beard", label: "الذقن" },
  { id: "combo", label: "باقات" },
  { id: "extra", label: "إضافات" },
];

export const defaultDays: BookingDay[] = [
  { label: "اليوم", date: "٢٦/٧" },
  { label: "غدًا", date: "٢٧/٧" },
  { label: "الاثنين", date: "٢٨/٧" },
  { label: "الثلاثاء", date: "٢٩/٧" },
  { label: "الأربعاء", date: "٣٠/٧" },
];

/* ───────────────────────────── helpers ───────────────────────────── */

const AR = "٠١٢٣٤٥٦٧٨٩";
export const arNum = (n: number) => String(n).padStart(2, "0").replace(/\d/g, (d) => AR[Number(d)]);
export const arInt = (n: number | string) => String(n).replace(/\d/g, (d) => AR[Number(d)]);

const waLink = (n: string, text: string) =>
  `https://wa.me/${n.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;


/** Arabic label. NEVER a mono face — JetBrains Mono has no Arabic coverage and
 *  positive tracking breaks the cursive joins. nowrap so pills never split. */
const K = "whitespace-nowrap font-sans text-[11.5px] font-semibold leading-[1.5] tracking-[0.07em]";
const K_SM = "whitespace-nowrap font-sans text-[11px] font-semibold leading-[1.5] tracking-[0.06em]";

const Check = ({ className = "size-3.5" }: { className?: string }) => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden className={className}>
    <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const Chevron = () => (
  <svg viewBox="0 0 16 16" fill="none" className="size-3.5 -scale-x-100" aria-hidden>
    <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Visible placeholder — steel/leather wash, so the layout reads before upload. */
function Photo({ src, alt, className = "" }: { src?: string; alt: string; className?: string }) {
  return (
    <span className={`relative block overflow-hidden bg-plate ${className}`}>
      <span aria-hidden className="absolute inset-0 bg-[repeating-linear-gradient(-38deg,rgba(250,246,240,.05)_0_1px,transparent_1px_9px)]" />
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} loading="lazy" className="absolute inset-0 size-full object-cover" />
      )}
    </span>
  );
}

/** Section head with the static/editable tag the resellers read. */
function Head({
  kicker,
  title,
  kickerPath,
  titlePath,
}: {
  kicker: string;
  title?: string;
  /** when set, the kicker/title become inline-editable (builder only) */
  kickerPath?: string;
  titlePath?: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <span className="flex items-center gap-2.5">
        {kickerPath ? (
          <EditableText path={kickerPath} value={kicker} className={`${K} text-oxblood-200`} />
        ) : (
          <span className={`${K} text-oxblood-200`}>{kicker}</span>
        )}
      </span>
      {(title || titlePath) &&
        (titlePath ? (
          <EditableText
            path={titlePath}
            value={title ?? ""}
            placeholder="عنوان القسم"
            className="font-display text-[21px] font-extrabold leading-[1.42] text-bone"
          />
        ) : (
          <span className="font-display text-[21px] font-extrabold leading-[1.42] text-bone">{title}</span>
        ))}
    </div>
  );
}

/* ──────────────────────────── component ──────────────────────────── */

export default function BarbershopFiveStar({
  shop,
  services,
  groups = defaultGroups,
  barbers,
  hours,
  days = defaultDays,
  house,
  currency = "ل.س",
  className,
}: BarbershopFiveStarProps) {
  const H: HouseContent = { ...HOUSE_CONTENT, ...house };

  const openNow = useOpenNow(hours);
  const editApi = useEdit();
  const statEdit = useEditList("shop.stats", shop.stats ?? []);
  const svcEdit = useEditList("services", services);
  const groupEdit = useEditList("groups", groups);
  // Removing a category also drops its services, in one commit (atomic).
  const removeGroup = (index: number) => {
    const gid = groups[index]?.id;
    editApi?.setMany({
      groups: groups.filter((_, i) => i !== index),
      services: services.filter((s) => s.group !== gid),
    });
  };
  const teamEdit = useEditList("barbers", barbers);
  const ritualEdit = useEditList("house.ritual", H.ritual);
  const hygieneEdit = useEditStrings("house.hygiene", H.hygiene);
  const etiquetteEdit = useEditStrings("house.etiquette", H.etiquette);
  const aftercareEdit = useEditList("house.aftercare", H.aftercare);
  const intervalsEdit = useEditList("house.intervals", H.intervals);

  const [page, setPage] = React.useState<Page>("services");
  const [group, setGroup] = React.useState(groups[0]?.id);
  const [sheet, setSheet] = React.useState(-1);
  const [svc, setSvc] = React.useState(0);
  const [barber, setBarber] = React.useState(0);
  const [day, setDay] = React.useState(0);

  // The stored group can go stale when `groups` changes under live editing
  // (e.g. the onboarding preview swaps the whole category set) — fall back to the
  // first available group so services never filter against a vanished id.
  const activeGroup = groups.some((g) => g.id === group) ? group : groups[0]?.id;

  // index against the FULL list — filtering then indexing opens the wrong sheet
  const visible = services.map((s, i) => ({ s, i })).filter(({ s }) => s.group === activeGroup);
  const open = sheet >= 0 ? services[sheet] : null;

  const bookable = services;
  const picked = bookable[svc] ?? bookable[0];
  const barberNames = ["أي حلاق متاح", ...barbers.map((b) => b.name)];

  const go = (p: Page) => {
    setPage(p);
    setSheet(-1);
  };

  /** The sheet's CTA must carry the chosen service into booking, not drop it. */
  const bookFromSheet = () => {
    if (!open) return;
    const i = bookable.findIndex((b) => b.name === open.name);
    setSheet(-1);
    setPage("book");
    if (i >= 0) setSvc(i);
  };

  const confirm = () => {
    const body = [
      ["طلب موعد", `${picked.name} (${picked.duration})`],
      ["الحلاق", barberNames[barber]],
      ["اليوم", `${days[day].label} ${days[day].date ?? ""}`.trim()],
      ["السعر", `${picked.price} ${currency}`],
      ["", "ما هي الأوقات المتاحة في هذا اليوم؟"],
    ]
      .map(([k, v]) => (k ? `${k}: ${v}` : v))
      .join("\n");
    window.open(waLink(shop.whatsapp, body), "_blank", "noopener,noreferrer");
  };

  const chip = (on: boolean) =>
    on
      ? "border-transparent bg-oxblood text-white"
      : "border-bone/[0.22] bg-transparent text-bone/90";

  const TABS: Array<{ id: Page; label: string; icon: React.ReactNode }> = [
    { id: "services", label: "الخدمات", icon: <ScissorsIcon /> },
    { id: "team", label: "الحلاقون", icon: <TeamIcon /> },
    { id: "care", label: "العناية", icon: <CareIcon /> },
    { id: "book", label: "الحجز", icon: <CalIcon /> },
  ];

  return (
    <div
      dir="rtl"
      // A real, full-bleed website — the dark ground fills the viewport and the
      // page uses natural document scroll, so the sticky brand bar and bottom
      // tabs pin to the viewport and the fixed sheet covers the whole page.
      // overflow-x-CLIP (not hidden): clips sideways bleed WITHOUT making this a
      // scroll container, which would break the sticky header on mobile.
      className={`relative min-h-dvh w-full overflow-x-clip bg-ink font-sans text-bone ${className ?? ""}`}
    >
      {/* Content column — a single readable column on phones (max-w-107.5), and a
          full-width responsive website on desktop (lg:max-w-none). Each section
          re-centers its own content in an inner max-w container. */}
      <div className="mx-auto flex min-h-dvh w-full max-w-107.5 flex-col pb-16 lg:max-w-none lg:pb-0">
        {/* ── brand bar (holds the desktop top-nav) ── */}
      <div className="sticky top-0 z-50 border-b border-bone/[0.12] bg-ink/95 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-[22px] py-3 lg:px-10">
        <span
          aria-hidden
          className="w-2 shrink-0 self-stretch rounded-sm bg-[repeating-linear-gradient(-45deg,oklch(0.96_0.01_60)_0_8px,oklch(0.5_0.14_25)_8px_16px,oklch(0.3_0.014_45)_16px_24px)] bg-[length:100%_56px] animate-pole motion-reduce:animate-none"
        />
        {(shop.logo || editApi?.editing) && (
          <EditableImage path="shop.logo" className="size-10 shrink-0 self-center overflow-hidden rounded-md">
            <Photo src={shop.logo} alt={shop.name} className="size-10" />
          </EditableImage>
        )}
        <span className="flex flex-col gap-0.5">
          <EditableText
            path="shop.name"
            value={shop.name}
            className="font-display text-[15px] font-extrabold leading-[1.4] lg:text-lg"
          />
          <EditableText
            path="shop.headerNote"
            value={shop.headerNote ?? `مفتوح · آخر موعد ${shop.lastAppointment ?? "٩:٣٠"}`}
            placeholder="مفتوح · آخر موعد ٩:٣٠"
            className={`${K_SM} text-oxblood-200`}
          />
        </span>

        {/* right cluster — pushed to the end on every size. On desktop it also
            holds the top-nav; social icons show on mobile AND desktop. */}
        <div className="ms-auto flex items-center gap-2 lg:gap-3">
          {/* desktop top-nav — the four pages as horizontal links (mobile uses the
              bottom tab bar instead). Reuses the TABS labels/icons + go(). */}
          <nav className="hidden items-center gap-1 lg:flex">
            {TABS.map((t) => {
              const on = page === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  aria-current={on}
                  onClick={() => go(t.id)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold leading-none transition-colors ${
                    on ? "bg-oxblood/[0.14] text-oxblood-100" : "text-bone/70 hover:text-bone"
                  }`}
                >
                  <span className="size-4.5">{t.icon}</span>
                  {t.label}
                </button>
              );
            })}
          </nav>

          <SocialLinks socials={shop.socials} size="size-3.5" itemClassName={SOCIAL_CHIP} />

          <button
            type="button"
            onClick={() => go("book")}
            className="inline-flex h-9 items-center gap-[7px] whitespace-nowrap rounded-full border border-oxblood/45 bg-oxblood/[0.12] px-3.5 text-[12.5px] font-semibold text-oxblood-200"
          >
            <WhatsAppIcon className="size-3.5" />
            احجز
          </button>
        </div>
      </div>
      </div>

      {/* ══════════ الخدمات ══════════ */}
      {page === "services" && (
        <div className="flex flex-col animate-page motion-reduce:animate-none">
          <section className="relative overflow-hidden lg:py-16">
            <div className="lg:mx-auto lg:grid lg:w-full lg:max-w-6xl lg:grid-cols-2 lg:items-center lg:gap-12 lg:px-10">
              <div className="relative lg:order-2 lg:overflow-hidden lg:rounded">
                <EditableImage path="shop.heroPhoto">
                  <Photo src={shop.heroPhoto} alt={shop.name} className="h-[240px] w-full lg:h-auto lg:aspect-4/5" />
                </EditableImage>
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,oklch(0.115_0.006_45)_3%,oklch(0.115_0.006_45/.72)_42%,transparent_78%)] lg:hidden"
                />
              </div>
              <div className="relative -mt-5 flex flex-col gap-4 px-[22px] pb-6 lg:order-1 lg:mt-0 lg:px-0 lg:pb-0">
                <EditableText
                  path="shop.tagline"
                  value={shop.tagline ?? "حلاقة رجالية · بالموعد"}
                  className={`${K} text-oxblood-200`}
                />
                <EditableText
                  path="shop.heroLine"
                  value={shop.heroLine ?? "كرسيٌّ واحد، وكامل انتباهنا"}
                  multiline
                  className="max-w-[20ch] font-display text-[27px] font-extrabold leading-[1.42] -tracking-[0.025em] text-balance lg:max-w-[16ch] lg:text-5xl"
                />
                <span aria-hidden className="h-0.5 w-16 bg-oxblood lg:w-20" />
                <EditableText
                  path="shop.heroBlurb"
                  value={shop.heroBlurb ?? "لا ننادي رقمًا ولا نستعجل أحدًا. كل جلسة لها وقتها المحجوز، وتنتهي حين تكون تامّة."}
                  multiline
                  className="max-w-[44ch] text-sm leading-[1.85] text-bone/[0.82] lg:text-base lg:leading-[1.9]"
                />
                {(shop.stats?.length || statEdit.editing) && (
                  <div className="flex flex-wrap items-start gap-5 border-t border-bone/[0.14] pt-3.5 lg:gap-10 lg:pt-6">
                    {(shop.stats ?? []).map((s, i) => (
                      <span key={i} className="relative flex flex-col gap-[3px]">
                        <EditableText
                          value={s.value}
                          onCommit={(t) => statEdit.setField(i, "value", t)}
                          className="font-serif text-2xl leading-none text-oxblood-200 lg:text-4xl"
                        />
                        <EditableText
                          value={s.label}
                          onCommit={(t) => statEdit.setField(i, "label", t)}
                          className={`${K_SM} text-bone/70`}
                        />
                        {statEdit.editing && (
                          <button
                            type="button"
                            onClick={() => statEdit.remove(i)}
                            aria-label="حذف الرقم"
                            className="absolute -end-2.5 -top-2.5 inline-flex size-5 cursor-pointer items-center justify-center rounded-full bg-oxblood text-[11px] leading-none text-white shadow"
                          >
                            ✕
                          </button>
                        )}
                      </span>
                    ))}
                    {statEdit.editing && (
                      <button
                        type="button"
                        onClick={() => statEdit.add({ value: "٠", label: "رقم جديد" })}
                        className="inline-flex cursor-pointer flex-col items-center gap-0.5 rounded-md border border-dashed border-bone/40 px-3.5 py-1.5 text-bone/70 hover:border-oxblood/60 hover:text-bone"
                      >
                        <span className="text-lg leading-none">＋</span>
                        <span className={K_SM}>رقم</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* HOUSE — the ritual */}
          {(H.ritual.length > 0 || ritualEdit.editing) && (
          <section className="border-y border-bone/10 bg-ink-800 px-[22px] py-[26px] lg:px-10 lg:py-16">
            <div className="mx-auto w-full max-w-6xl">
            <Head
              kicker={H.ritualKicker ?? "طقوس الجلسة"}
              kickerPath="house.ritualKicker"
              title={H.ritualTitle ?? "ما يحدث حين تجلس"}
              titlePath="house.ritualTitle"
            />
            <div className="flex flex-col pt-4 lg:grid lg:grid-cols-2 lg:gap-x-12 lg:pt-8">
              {H.ritual.map((r, i) => (
                <div key={i} className="relative flex items-start gap-[15px] border-b border-bone/10 py-[15px]">
                  <span className="min-w-[22px] shrink-0 pt-0.5 font-serif text-[15px] tracking-[0.04em] text-oxblood-300">
                    {arNum(i + 1)}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <EditableText value={r.title} onCommit={(t) => ritualEdit.setField(i, "title", t)} className="font-display text-[14.5px] font-bold" />
                    <EditableText value={r.body} multiline onCommit={(t) => ritualEdit.setField(i, "body", t)} className="text-[12.5px] leading-[1.75] text-bone/[0.76] text-pretty" />
                  </span>
                  {ritualEdit.editing && (
                    <button
                      type="button"
                      onClick={() => ritualEdit.remove(i)}
                      aria-label="حذف الخطوة"
                      className="absolute -end-1 top-3 z-10 inline-flex size-5 cursor-pointer items-center justify-center rounded-full bg-oxblood text-[11px] text-white shadow"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              {ritualEdit.editing && (
                <button
                  type="button"
                  onClick={() => ritualEdit.add({ title: "خطوة جديدة", body: "وصف الخطوة…" })}
                  className="mt-2 inline-flex cursor-pointer items-center justify-center gap-2 rounded border border-dashed border-bone/30 py-3 text-sm font-semibold text-bone/70 transition-colors hover:border-oxblood/50 hover:text-bone"
                >
                  <span className="text-lg leading-none">＋</span> إضافة خطوة
                </button>
              )}
            </div>
            </div>
          </section>
          )}

          {/* SHOP — services */}
          <section>
            <div className="sticky top-[61px] z-40 border-b border-bone/[0.12] bg-ink/95 px-[22px] pb-3 pt-3.5 backdrop-blur-md lg:px-10 lg:pb-4 lg:pt-5">
              <div className="mx-auto w-full max-w-6xl">
              <div className="mb-3 flex items-baseline gap-3">
                <span className="font-display text-[19px] font-extrabold lg:text-2xl">الخدمات</span>
              </div>
              <div className="flex gap-[7px] overflow-x-auto overscroll-x-contain scroll-smooth pb-0.5 [-webkit-overflow-scrolling:touch]">
                {groups.map((g, gi) =>
                  groupEdit.editing ? (
                    <span
                      key={g.id}
                      onClick={() => setGroup(g.id)}
                      title="انقر للاختيار · انقر مرتين لإعادة التسمية"
                      className={`group/tab relative inline-flex h-11 shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-full border ps-[18px] pe-3 text-[13.5px] font-semibold leading-none transition-shadow ${chip(activeGroup === g.id)} ${activeGroup === g.id ? "ring-2 ring-oxblood/60 ring-offset-2 ring-offset-ink" : ""}`}
                    >
                      <EditableText
                        value={g.label}
                        placeholder="القسم"
                        keepLatinDigits
                        onCommit={(t) => groupEdit.setField(gi, "label", t)}
                      />
                      {groups.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeGroup(gi); }}
                          aria-label="حذف القسم"
                          title="حذف القسم"
                          className="inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full bg-oxblood/85 text-[11px] leading-none text-white shadow transition-colors hover:bg-oxblood"
                        >
                          ✕
                        </button>
                      )}
                    </span>
                  ) : (
                    <button
                      key={g.id}
                      type="button"
                      aria-pressed={activeGroup === g.id}
                      onClick={() => setGroup(g.id)}
                      className={`inline-flex h-9 shrink-0 items-center whitespace-nowrap rounded-full border px-[15px] text-[13px] font-semibold leading-none ${chip(activeGroup === g.id)}`}
                    >
                      {g.label}
                    </button>
                  ),
                )}
                {groupEdit.editing && (
                  <button
                    type="button"
                    onClick={() => {
                      const id = "c" + Math.random().toString(36).slice(2, 8);
                      groupEdit.add({ id, label: "قسم جديد" });
                      setGroup(id); // select it so its (empty) services show for editing
                    }}
                    aria-label="إضافة قسم"
                    className="inline-flex h-11 shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full border border-dashed border-bone/35 px-4 text-[13.5px] font-semibold leading-none text-bone/70 transition-colors hover:border-oxblood/60 hover:text-bone"
                  >
                    <span className="text-base leading-none">＋</span> قسم
                  </button>
                )}
              </div>
              </div>
            </div>

            <div className="px-[22px] pb-[26px] pt-1 lg:px-10 lg:pb-16 lg:pt-4">
              <div className="mx-auto flex w-full max-w-6xl flex-col lg:grid lg:grid-cols-2 lg:gap-4 xl:grid-cols-3">
              {visible.map(({ s, i }, n) => {
                const cardClass =
                  "flex items-start gap-3.5 border-b border-bone/10 py-[18px] text-start text-current animate-rise motion-reduce:animate-none lg:rounded lg:border lg:border-bone/11 lg:bg-bone/5 lg:p-4 lg:transition-colors lg:hover:border-oxblood/40";
                const inner = (
                  <>
                    <EditableImage onChange={(url) => svcEdit.setField(i, "photo", url)} className="size-20 shrink-0 rounded-[3px]">
                      <Photo src={s.photo} alt={s.name} className="size-20 shrink-0 rounded-[3px]" />
                    </EditableImage>
                    <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <span className="flex flex-wrap items-baseline gap-[9px]">
                        <EditableText value={s.name} onCommit={(t) => svcEdit.setField(i, "name", t)} className="font-display text-[15.5px] font-bold" />
                        <EditableText value={s.mark ?? ""} placeholder="وسم" onCommit={(t) => svcEdit.setField(i, "mark", t)} className={`${K_SM} text-oxblood-200`} />
                      </span>
                      <EditableText value={s.latin ?? ""} placeholder="بالإنجليزية" keepLatinDigits onCommit={(t) => svcEdit.setField(i, "latin", t)} className="font-serif text-xs italic text-bone/70" />
                      <EditableText value={s.desc ?? ""} placeholder="أضف وصفًا…" multiline onCommit={(t) => svcEdit.setField(i, "desc", t)} className="text-[12.5px] leading-[1.7] text-bone/[0.76] text-pretty" />
                      <span className="flex items-center gap-3 pt-[3px]">
                        <EditableText value={s.price} onCommit={(t) => svcEdit.setField(i, "price", t)} className="font-serif text-lg text-oxblood-100" />
                        <EditableText value={s.duration} onCommit={(t) => svcEdit.setField(i, "duration", t)} className={`${K_SM} text-bone/[0.66]`} />
                        {!svcEdit.editing && (
                          <span className="ms-auto text-bone/60">
                            <Chevron />
                          </span>
                        )}
                      </span>
                    </span>
                  </>
                );
                return svcEdit.editing ? (
                  <div key={`svc-${i}`} className={`relative ${cardClass}`}>
                    {inner}
                    <button
                      type="button"
                      onClick={() => svcEdit.remove(i)}
                      aria-label="حذف الخدمة"
                      className="absolute -end-2 -top-2 z-10 inline-flex size-6 cursor-pointer items-center justify-center rounded-full bg-oxblood text-xs text-white shadow"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button key={`svc-${i}`} type="button" onClick={() => setSheet(i)} style={{ animationDelay: `${n * 55}ms` }} className={cardClass}>
                    {inner}
                  </button>
                );
              })}
              {svcEdit.editing && (
                <button
                  type="button"
                  onClick={() => svcEdit.add({ group: activeGroup, name: "خدمة جديدة", price: "٠", duration: "٣٠ دقيقة", desc: "", mark: "", latin: "" })}
                  className="flex cursor-pointer items-center justify-center gap-2 rounded border border-dashed border-bone/30 py-4 text-sm font-semibold text-bone/70 transition-colors hover:border-oxblood/50 hover:text-bone lg:p-4"
                >
                  <span className="text-lg leading-none">＋</span> إضافة خدمة
                </button>
              )}
              </div>
            </div>
          </section>

          {/* HOUSE — hygiene */}
          {(H.hygiene.length > 0 || hygieneEdit.editing) && (
            <section className="border-t border-bone/10 px-[22px] pb-7 pt-6 lg:px-10 lg:py-16">
              <div className="mx-auto flex w-full max-w-6xl flex-col gap-3.5 rounded border border-bone/[0.12] bg-bone/[0.05] p-[18px] lg:p-8">
                <Head kicker={H.hygieneKicker ?? "معيار التعقيم"} kickerPath="house.hygieneKicker" />
                <div className="flex flex-col gap-[11px] lg:grid lg:grid-cols-2 lg:gap-x-10 lg:gap-y-4">
                  {H.hygiene.map((t, i) => (
                    <span key={`hygiene-${i}`} className="group/hy relative flex items-start gap-[11px] text-[13px] leading-[1.75] text-bone/[0.82]">
                      <span className="shrink-0 pt-0.5 text-[oklch(0.7_0.12_145)]">
                        <Check />
                      </span>
                      <EditableText
                        value={t}
                        placeholder="معيار جديد…"
                        multiline
                        onCommit={(v) => hygieneEdit.setAt(i, v)}
                        className="text-pretty"
                      />
                      {hygieneEdit.editing && (
                        <button
                          type="button"
                          onClick={() => hygieneEdit.remove(i)}
                          aria-label="حذف المعيار"
                          className="absolute -end-1 -top-1 z-10 inline-flex size-5 cursor-pointer items-center justify-center rounded-full bg-oxblood text-[11px] text-white opacity-0 shadow transition-opacity group-hover/hy:opacity-100"
                        >
                          ✕
                        </button>
                      )}
                    </span>
                  ))}
                  {hygieneEdit.editing && (
                    <button
                      type="button"
                      onClick={() => hygieneEdit.add("معيار جديد")}
                      className="flex cursor-pointer items-center justify-center gap-2 rounded border border-dashed border-bone/30 p-2.5 text-[13px] font-semibold text-bone/70 transition-colors hover:border-oxblood/50 hover:text-bone"
                    >
                      <span className="text-base leading-none">＋</span> إضافة معيار
                    </button>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>
      )}

      {/* ══════════ الحلاقون ══════════ */}
      {page === "team" && (
        <div className="flex flex-col animate-page motion-reduce:animate-none">
          <section className="px-[22px] py-[26px] lg:px-10 lg:py-16">
            <div className="mx-auto w-full max-w-6xl">
            <Head
              kicker={shop.teamKicker ?? "من سيجلس معك"}
              kickerPath="shop.teamKicker"
              title={shop.teamTitle ?? "الحلاقون"}
              titlePath="shop.teamTitle"
            />
            <EditableText
              path="shop.teamIntro"
              value={shop.teamIntro ?? "تحجز مع شخصٍ بعينه، لا مع الصالون. من اعتاد على حلاقٍ يبقى معه."}
              placeholder="نبذة قصيرة عن الفريق…"
              multiline
              className="mt-4 block max-w-[60ch] text-[13.5px] leading-[1.85] text-bone/80 text-pretty"
            />
            <div className="flex flex-col gap-3 pt-4 sm:grid sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:pt-8">
              {barbers.map((b, i) => (
                <div
                  key={`barber-${i}`}
                  style={{ animationDelay: `${i * 70}ms` }}
                  className="relative flex gap-3.5 rounded border border-bone/[0.11] bg-bone/[0.05] p-3.5 animate-rise motion-reduce:animate-none"
                >
                  <EditableImage onChange={(url) => teamEdit.setField(i, "photo", url)} className="h-[100px] w-[84px] shrink-0 rounded-[3px]">
                    <Photo src={b.photo} alt={b.name} className="h-[100px] w-[84px] shrink-0 rounded-[3px]" />
                  </EditableImage>
                  <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <EditableText value={b.name} onCommit={(t) => teamEdit.setField(i, "name", t)} className="font-display text-base font-bold" />
                    <EditableText value={b.role} placeholder="الدور" onCommit={(t) => teamEdit.setField(i, "role", t)} className="text-[12.5px] font-medium text-oxblood-200" />
                    <EditableText value={b.bio ?? ""} placeholder="نبذة قصيرة…" multiline onCommit={(t) => teamEdit.setField(i, "bio", t)} className="text-[12.5px] leading-[1.7] text-bone/[0.76] text-pretty" />
                  </span>
                  {teamEdit.editing && (
                    <button
                      type="button"
                      onClick={() => teamEdit.remove(i)}
                      aria-label="حذف الحلاق"
                      className="absolute -end-2 -top-2 z-10 inline-flex size-6 cursor-pointer items-center justify-center rounded-full bg-oxblood text-xs text-white shadow"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              {teamEdit.editing && (
                <button
                  type="button"
                  onClick={() => teamEdit.add({ name: "حلاق جديد", role: "حلاق", years: 1, availableToday: true, photo: "", bio: "" })}
                  className="flex cursor-pointer items-center justify-center gap-2 rounded border border-dashed border-bone/30 p-4 text-sm font-semibold text-bone/70 transition-colors hover:border-oxblood/50 hover:text-bone"
                >
                  <span className="text-lg leading-none">＋</span> إضافة حلاق
                </button>
              )}
            </div>
            </div>
          </section>

          {/* HOUSE — etiquette */}
          {(H.etiquette.length > 0 || etiquetteEdit.editing) && (
            <section className="border-t border-bone/10 bg-ink-800 px-[22px] pb-7 pt-6 lg:px-10 lg:py-16">
              <div className="mx-auto w-full max-w-6xl">
              <Head kicker={H.etiquetteKicker ?? "آداب الحجز"} kickerPath="house.etiquetteKicker" />
              <div className="mt-3.5 flex flex-col lg:mt-6 lg:grid lg:grid-cols-2 lg:gap-x-12">
                {H.etiquette.map((t, i) => (
                  <span key={`etiquette-${i}`} className="group/et relative flex items-baseline gap-[13px] border-b border-bone/10 py-[13px]">
                    <span className="min-w-5 shrink-0 font-serif text-[13px] text-oxblood-300">{arNum(i + 1)}</span>
                    <EditableText
                      value={t}
                      placeholder="أدب جديد…"
                      multiline
                      onCommit={(v) => etiquetteEdit.setAt(i, v)}
                      className="text-[13px] leading-[1.75] text-bone/[0.82] text-pretty"
                    />
                    {etiquetteEdit.editing && (
                      <button
                        type="button"
                        onClick={() => etiquetteEdit.remove(i)}
                        aria-label="حذف البند"
                        className="absolute -end-1 top-2 z-10 inline-flex size-5 cursor-pointer items-center justify-center rounded-full bg-oxblood text-[11px] text-white opacity-0 shadow transition-opacity group-hover/et:opacity-100"
                      >
                        ✕
                      </button>
                    )}
                  </span>
                ))}
              </div>
              {etiquetteEdit.editing && (
                <button
                  type="button"
                  onClick={() => etiquetteEdit.add("أدب جديد")}
                  className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded border border-dashed border-bone/30 px-4 py-2.5 text-[13px] font-semibold text-bone/70 transition-colors hover:border-oxblood/50 hover:text-bone"
                >
                  <span className="text-base leading-none">＋</span> إضافة بند
                </button>
              )}
              </div>
            </section>
          )}
        </div>
      )}

      {/* ══════════ العناية ══════════ */}
      {page === "care" && (
        <div className="flex flex-col animate-page motion-reduce:animate-none">
          <section className="px-[22px] py-[26px] lg:px-10 lg:py-16">
            <div className="mx-auto w-full max-w-6xl">
            <Head
              kicker={H.careKicker ?? "بعد أن تخرج"}
              kickerPath="house.careKicker"
              title={H.careTitle ?? "كيف تحافظ على القصّة"}
              titlePath="house.careTitle"
            />
            <EditableText
              path="house.careIntro"
              value={H.careIntro ?? "نصف النتيجة تعتمد على ما تفعله في البيت. هذه القواعد تصلح لأي قصّة تقريبًا."}
              placeholder="نبذة قصيرة…"
              multiline
              className="mt-4 block max-w-[60ch] text-[13.5px] leading-[1.85] text-bone/80 text-pretty"
            />
            <div className="flex flex-col gap-2.5 pt-4 sm:grid sm:grid-cols-2 sm:gap-3 lg:gap-4 lg:pt-8">
              {H.aftercare.map((c, i) => (
                <div
                  key={`aftercare-${i}`}
                  style={{ animationDelay: `${i * 55}ms` }}
                  className="group/ac relative flex items-start gap-[13px] rounded border border-bone/10 bg-bone/[0.05] p-3.5 animate-rise motion-reduce:animate-none"
                >
                  <span className="inline-flex size-[30px] shrink-0 items-center justify-center rounded-full bg-oxblood/[0.16] font-serif text-sm text-oxblood-100">
                    {arNum(i + 1)}
                  </span>
                  <span className="flex min-w-0 flex-col gap-1">
                    <EditableText value={c.title} placeholder="العنوان" onCommit={(t) => aftercareEdit.setField(i, "title", t)} className="font-display text-sm font-bold" />
                    <EditableText value={c.body} placeholder="الوصف…" multiline onCommit={(t) => aftercareEdit.setField(i, "body", t)} className="text-[12.5px] leading-[1.75] text-bone/[0.76] text-pretty" />
                  </span>
                  {aftercareEdit.editing && (
                    <button
                      type="button"
                      onClick={() => aftercareEdit.remove(i)}
                      aria-label="حذف القاعدة"
                      className="absolute -end-2 -top-2 z-10 inline-flex size-6 cursor-pointer items-center justify-center rounded-full bg-oxblood text-xs text-white opacity-0 shadow transition-opacity group-hover/ac:opacity-100"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              {aftercareEdit.editing && (
                <button
                  type="button"
                  onClick={() => aftercareEdit.add({ title: "قاعدة جديدة", body: "الوصف…" })}
                  className="flex cursor-pointer items-center justify-center gap-2 rounded border border-dashed border-bone/30 p-3.5 text-[13px] font-semibold text-bone/70 transition-colors hover:border-oxblood/50 hover:text-bone"
                >
                  <span className="text-base leading-none">＋</span> إضافة قاعدة
                </button>
              )}
            </div>
            </div>
          </section>

          {(H.intervals.length > 0 || intervalsEdit.editing) && (
            <section className="border-t border-bone/10 bg-ink-800 px-[22px] pb-7 pt-6 lg:px-10 lg:py-16">
              <div className="mx-auto w-full max-w-3xl">
              <Head kicker={H.intervalsKicker ?? "متى تعود"} kickerPath="house.intervalsKicker" />
              <div className="mt-3.5 flex flex-col lg:mt-6">
                {H.intervals.map((iv, i) => (
                  <span key={`interval-${i}`} className="group/iv relative flex items-baseline gap-3 border-b border-bone/10 py-[13px]">
                    <EditableText value={iv.style} placeholder="النوع" onCommit={(t) => intervalsEdit.setField(i, "style", t)} className="min-w-[108px] text-[13.5px] text-bone/[0.86]" />
                    <span aria-hidden className="min-w-5 flex-[1_0_20px] border-b border-dotted border-bone/[0.22]" />
                    <EditableText value={iv.every} placeholder="كل …" onCommit={(t) => intervalsEdit.setField(i, "every", t)} className="whitespace-nowrap font-serif text-[15px] text-oxblood-100" />
                    {intervalsEdit.editing && (
                      <button
                        type="button"
                        onClick={() => intervalsEdit.remove(i)}
                        aria-label="حذف الصف"
                        className="absolute -end-1 top-2 z-10 inline-flex size-5 cursor-pointer items-center justify-center rounded-full bg-oxblood text-[11px] text-white opacity-0 shadow transition-opacity group-hover/iv:opacity-100"
                      >
                        ✕
                      </button>
                    )}
                  </span>
                ))}
                {intervalsEdit.editing && (
                  <button
                    type="button"
                    onClick={() => intervalsEdit.add({ style: "نوع جديد", every: "كل أسبوعين" })}
                    className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded border border-dashed border-bone/30 px-4 py-2.5 text-[13px] font-semibold text-bone/70 transition-colors hover:border-oxblood/50 hover:text-bone"
                  >
                    <span className="text-base leading-none">＋</span> إضافة صف
                  </button>
                )}
              </div>
              <EditableText
                path="house.intervalsNote"
                value={H.intervalsNote ?? "هذه أرقام إرشادية — حلاقك يخبرك بالمدّة الأنسب لشعرك تحديدًا."}
                placeholder="ملاحظة…"
                multiline
                className="mt-3 block text-[12.5px] leading-[1.75] text-bone/70"
              />
              </div>
            </section>
          )}
        </div>
      )}

      {/* ══════════ الحجز ══════════ */}
      {page === "book" && (
        <div className="flex flex-col animate-page motion-reduce:animate-none">
          <section className="px-[22px] py-[26px] lg:px-10 lg:py-16">
            <div className="mx-auto w-full max-w-5xl">
            <div className="flex flex-col gap-4.5 lg:flex-row lg:items-start lg:gap-10">
            <div className="flex flex-col gap-4.5 lg:min-w-0 lg:flex-1">
            <span className="flex flex-col gap-[7px]">
              <span className={`${K} text-oxblood-200`}>بالموعد فقط</span>
              <span className="font-display text-[22px] font-extrabold leading-[1.42] lg:text-4xl">احجز كرسيّك</span>
            </span>

            <Picker label="الخدمة">
              {bookable.map((b, i) => (
                <button
                  key={`bk-barber-${i}`}
                  type="button"
                  aria-pressed={svc === i}
                  onClick={() => setSvc(i)}
                  className={`inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-full border px-[15px] text-[13px] font-semibold leading-none ${chip(svc === i)}`}
                >
                  {b.name}
                  <span className="font-serif text-[12.5px] leading-none opacity-65">{b.price}</span>
                </button>
              ))}
            </Picker>

            <Picker label="الحلاق">
              {barberNames.map((n, i) => (
                <button
                  key={`bk-name-${i}`}
                  type="button"
                  aria-pressed={barber === i}
                  onClick={() => setBarber(i)}
                  className={`h-10 whitespace-nowrap rounded-full border px-[15px] text-[13px] font-semibold leading-none ${chip(barber === i)}`}
                >
                  {n}
                </button>
              ))}
            </Picker>

            <Picker label="اليوم">
              {days.map((d, i) => (
                <button
                  key={`day-${i}`}
                  type="button"
                  aria-pressed={day === i}
                  onClick={() => setDay(i)}
                  className={`flex min-w-[68px] flex-col items-center gap-[3px] rounded-[3px] border px-3 py-2.5 ${chip(day === i)}`}
                >
                  <span className="whitespace-nowrap text-[13px] font-semibold">{d.label}</span>
                  {d.date && <span className="font-serif text-xs opacity-65">{d.date}</span>}
                </button>
              ))}
            </Picker>

            <span className="flex items-start gap-2.5 rounded-[3px] border border-bone/[0.13] bg-bone/[0.05] p-3.5 text-[12.5px] leading-[1.7] text-bone/[0.78]">
              <Check className="mt-0.5 size-4 shrink-0 text-oxblood-200" />
              اختر اليوم فقط — يؤكّد لك الحلاق الوقت المتاح عبر واتساب خلال دقائق.
            </span>
            </div>

            <div className="flex flex-col gap-4.5 lg:sticky lg:top-24 lg:w-80 lg:shrink-0">
            <div className="flex flex-col gap-[13px] rounded border border-bone/[0.13] bg-bone/[0.05] p-[18px]">
              <span className={`${K_SM} text-bone/70`}>ملخّص الحجز</span>
              <Row k="الخدمة" v={picked.name} bold />
              <Row k="الحلاق" v={barberNames[barber]} />
              <Row k="اليوم" v={`${days[day].label} ${days[day].date ?? ""}`.trim()} serif />
              <Row k="الوقت" v="يؤكّده الحلاق" />
              <span className="flex items-baseline justify-between gap-3">
                <span className="text-[13px] text-bone/[0.76]">السعر</span>
                <span className="font-serif text-[22px] text-oxblood-100">
                  {picked.price} {currency}
                </span>
              </span>
            </div>

            <button
              type="button"
              onClick={confirm}
              className="inline-flex h-[52px] cursor-pointer items-center justify-center gap-2.5 rounded-[3px] border-0 bg-oxblood font-display text-[15px] font-bold text-white"
            >
              <WhatsAppIcon />
              اطلب موعدًا على واتساب
            </button>
            <span className="text-[12.5px] leading-[1.75] text-bone/70">
              نتّفق على الوقت المتاح برسالة خلال دقائق. التأخّر أكثر من عشر دقائق يعني إعادة الجدولة — الكرسي التالي محجوز.
            </span>
            </div>
            </div>
            </div>
          </section>

          <footer className="border-t border-bone/[0.14] bg-ink-900 px-[22px] pb-7 pt-6 lg:px-10 lg:py-14">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-4.5 lg:grid lg:grid-cols-3 lg:items-start lg:gap-10">
            <div className="flex items-baseline justify-between gap-3.5 lg:flex-col lg:items-start lg:gap-3">
              <span className="flex flex-col gap-1">
                <EditableText path="shop.name" value={shop.name} className="font-display text-lg font-extrabold" />
              </span>
              {openNow !== null && (
                <span
                  className={`inline-flex items-center gap-[7px] text-[12.5px] ${
                    openNow ? "text-[oklch(0.82_0.09_145)]" : "text-oxblood-200"
                  }`}
                >
                  <span
                    className={`size-[7px] rounded-full bg-current ${openNow ? "animate-pulse-soft motion-reduce:animate-none" : ""}`}
                  />
                  {openNow ? "مفتوح الآن" : "مغلق الآن"}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-[9px]">
              {groupHours(hours).map((g, i) => (
                <span key={`hours-${i}`} className="flex items-baseline gap-2.5 text-[13px] text-bone/80">
                  <span className="whitespace-nowrap">{g.label}</span>
                  <span aria-hidden className="min-w-4 flex-[1_0_16px] border-b border-dotted border-bone/[0.22]" />
                  <span className={`whitespace-nowrap font-serif ${g.time === "مغلق" ? "text-oxblood-200" : "text-bone/90"}`}>{g.time}</span>
                </span>
              ))}
            </div>
            {(shop.address || shop.phone || shop.whatsapp) && (
              <div className="flex flex-col gap-[11px] border-t border-bone/[0.12] pt-3.5 lg:border-t-0 lg:pt-0">
                {shop.address && (
                  <span className="flex items-start gap-2.5 text-[13px] leading-[1.65] text-bone/80">
                    <span aria-hidden className="text-oxblood-200">◉</span>
                    <EditableText path="shop.address" value={shop.address} multiline className="text-pretty" />
                  </span>
                )}
                {shop.whatsapp && (
                  <a
                    href={waLink(shop.whatsapp, "مرحبًا، أودّ حجز موعد.")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 text-bone/80 transition-colors hover:text-bone"
                  >
                    <WhatsAppIcon className="size-4 text-oxblood-200" />
                    <span dir="ltr" className="font-mono text-[12.5px]">{shop.whatsapp}</span>
                  </a>
                )}
                {shop.phone && (
                  <a
                    href={`tel:${shop.phone.replace(/\s/g, "")}`}
                    className="flex items-center gap-2.5 text-bone/80 transition-colors hover:text-bone"
                  >
                    <PhoneIcon className="size-4 text-oxblood-200" />
                    <span dir="ltr" className="font-mono text-[12.5px]">{shop.phone}</span>
                  </a>
                )}
                <SocialLinks socials={shop.socials} className="pt-1" itemClassName={SOCIAL_CHIP} />
              </div>
            )}
            </div>
          </footer>
        </div>
      )}

      {/* ── bottom tabs (mobile only): FIXED to the screen bottom like a native
             app tab bar (centered to the phone column). On desktop the top-nav in
             the brand bar replaces it. Content below gets pb-16 to clear it. ── */}
      <nav className="fixed inset-x-0 bottom-0 z-60 mx-auto flex w-full max-w-107.5 items-stretch border-t border-bone/[0.14] bg-ink-900/95 backdrop-blur-lg lg:hidden">
        {TABS.map((t) => {
          const on = page === t.id;
          return (
            <button
              key={t.id}
              type="button"
              aria-current={on}
              onClick={() => go(t.id)}
              className={`relative flex flex-1 flex-col items-center justify-center gap-[5px] border-0 bg-transparent px-1 pb-[13px] pt-[11px] transition-colors ${
                on ? "text-oxblood-100" : "text-bone/[0.68]"
              }`}
            >
              {on && <span aria-hidden className="absolute inset-x-[24%] top-0 h-0.5 bg-oxblood-200" />}
              {t.icon}
              <span className={`whitespace-nowrap text-[11px] ${on ? "font-semibold" : "font-normal"}`}>
                {t.label}
              </span>
            </button>
          );
        })}
      </nav>
      </div>

      {/* ── service sheet: fixed, covers the whole page ── */}
      {open && (
        <div
          onClick={() => setSheet(-1)}
          className="fixed inset-0 z-[80] flex items-end justify-center bg-[rgba(12,8,6,.7)] backdrop-blur-[4px] animate-fade motion-reduce:animate-none lg:items-center lg:p-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[78vh] w-full max-w-[392px] overflow-y-auto rounded-t-[14px] border-t border-oxblood/35 bg-ink-700 animate-sheet motion-reduce:animate-none lg:max-h-[86vh] lg:max-w-md lg:rounded-[14px] lg:border"
          >
            <div className="relative">
              <Photo src={open.photo} alt={open.name} className="h-[200px] w-full" />
              <button
                type="button"
                onClick={() => setSheet(-1)}
                aria-label="إغلاق"
                className="absolute end-3 top-3 z-[3] inline-flex size-9 items-center justify-center rounded-full border-0 bg-[rgba(12,8,6,.6)] text-bone backdrop-blur-[6px]"
              >
                <svg viewBox="0 0 16 16" fill="none" className="size-[15px]">
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="flex flex-col gap-[15px] px-[22px] pb-[26px] pt-5">
              <div className="flex flex-col gap-1.5">
                <span className="font-display text-[21px] font-extrabold leading-[1.42]">{open.name}</span>
                {open.latin && <span className="font-serif text-[13px] italic text-bone/[0.74]">{open.latin}</span>}
              </div>
              {open.desc && (
                <span className="text-sm leading-[1.85] text-bone/[0.84] text-pretty">{open.desc}</span>
              )}
              {open.includes?.length ? (
                <div className="flex flex-col gap-2.5 border-t border-bone/[0.12] pt-3.5">
                  <span className={`${K_SM} text-bone/70`}>تشمل الجلسة</span>
                  {open.includes.map((t, i) => (
                    <span key={`inc-${i}`} className="flex items-start gap-2.5 text-[13px] leading-[1.75] text-bone/[0.82]">
                      <span className="shrink-0 pt-0.5 text-oxblood-200">
                        <Check className="size-[13px]" />
                      </span>
                      {t}
                    </span>
                  ))}
                </div>
              ) : null}
              <div className="flex items-center justify-between gap-3.5 border-t border-bone/[0.12] pt-4">
                <span className="flex flex-col gap-1">
                  <span className="font-serif text-[26px] leading-none text-oxblood-100">
                    {open.price} {currency}
                  </span>
                  <span className={`${K_SM} text-bone/[0.68]`}>{open.duration}</span>
                </span>
                <button
                  type="button"
                  onClick={bookFromSheet}
                  className="inline-flex h-[46px] items-center whitespace-nowrap rounded-[3px] border-0 bg-oxblood px-5 font-display text-sm font-bold text-white"
                >
                  احجز هذه الخدمة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── small local parts ───────────────────────── */

function Picker({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="flex flex-col gap-[9px]">
      <span className={`${K_SM} text-bone/70`}>{label}</span>
      <div className="flex flex-wrap gap-2">{children}</div>
    </span>
  );
}

function Row({ k, v, bold, serif }: { k: string; v: string; bold?: boolean; serif?: boolean }) {
  return (
    <span className="flex items-baseline justify-between gap-3 border-b border-bone/[0.12] pb-[11px]">
      <span className="text-[13px] text-bone/[0.76]">{k}</span>
      <span
        className={`text-end ${bold ? "font-display text-sm font-bold" : serif ? "font-serif text-[15px]" : "text-[13.5px]"}`}
      >
        {v}
      </span>
    </span>
  );
}


const ScissorsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden>
    <path d="M8 8l12 12M20 4L9.5 14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="6" cy="6" r="2.4" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="6" cy="18" r="2.4" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);
const TeamIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden>
    <circle cx="9" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M3 20c0-3.4 2.7-5.6 6-5.6s6 2.2 6 5.6M16 5.5a3.2 3.2 0 0 1 0 6M17 14.6c2.4.5 4 2.4 4 5.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
const CareIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden>
    <path d="M12 21s-7-4.6-7-9.6A4.4 4.4 0 0 1 12 8a4.4 4.4 0 0 1 7 3.4c0 5-7 9.6-7 9.6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
);
const CalIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden>
    <path d="M4 6.5h16v14H4zM4 10h16M8.5 3v4M15.5 3v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
