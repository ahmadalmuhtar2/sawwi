// The new Syrian flag (2025): green / white / black with three red stars. The 🇸🇾
// emoji still renders the OLD flag, so we draw it explicitly. Shared by the phone
// input and any template that shows a Syria dial-code prefix.

// A single 5-point star (unit, centered, pointing up).
const STAR =
  "M0,-1 L0.2245,-0.309 L0.951,-0.309 L0.363,0.118 L0.588,0.809 L0,0.382 L-0.588,0.809 L-0.363,0.118 L-0.951,-0.309 L-0.2245,-0.309 Z";

export function SyrianFlag({ className = "h-3.5 w-5" }: { className?: string } = {}) {
  return (
    <svg viewBox="0 0 30 20" className={`shrink-0 rounded-[2px] ${className}`} aria-hidden>
      <rect width="30" height="20" fill="#fff" />
      <rect width="30" height="6.667" fill="#007A3D" />
      <rect y="13.333" width="30" height="6.667" fill="#000" />
      <g fill="#CE1126">
        <path d={STAR} transform="translate(10 10) scale(2)" />
        <path d={STAR} transform="translate(15 10) scale(2)" />
        <path d={STAR} transform="translate(20 10) scale(2)" />
      </g>
    </svg>
  );
}
