// Build a wa.me deep link from a phone number or a pasted WhatsApp/wa.me link.
export function whatsappLink(numberOrLink?: string | null, message?: string): string {
  if (!numberOrLink) return "#";
  const v = numberOrLink.trim();
  // A direct WhatsApp link — use it as-is (the user pasted their own).
  if (/^https?:\/\//i.test(v)) return v;
  if (/^wa\.me\//i.test(v)) return `https://${v}`;
  // Otherwise treat as a phone number and build the wa.me link.
  const clean = v.replace(/[^0-9]/g, "");
  const q = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${clean}${q}`;
}
