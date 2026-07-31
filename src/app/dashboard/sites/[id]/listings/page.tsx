import { notFound, redirect } from "next/navigation";
import { getSessionClaims } from "@/lib/auth";
import { getSite } from "@/server/sites/sites.service";
import { listMyListings } from "@/server/listings/listings.service";
import { toMarketplaceListing } from "@/server/listings/listing-view";
import { getPrisma } from "@/lib/db";
import { symbolOf } from "@/shared/currency";
import { defaultCurrencyOf } from "@/templates/registry";
import { ListingsManager } from "@/components/dashboard/listings-manager";

export default async function SiteListingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const claims = await getSessionClaims();
  if (!claims) redirect("/login");

  let site;
  try {
    site = await getSite(claims, id); // exists + canView, or throws
  } catch {
    notFound();
  }

  const [rows, settings] = await Promise.all([
    listMyListings(claims, id),
    getPrisma().siteSettings.findUnique({ where: { siteId: id }, select: { currency: true } }),
  ]);
  const currency = symbolOf(settings?.currency ?? defaultCurrencyOf(site.templateKey));
  const initial = rows.map((r) => ({ ...toMarketplaceListing(r), published: r.published }));

  return (
    <ListingsManager siteId={id} businessName={site.businessName} currency={currency} initial={initial} />
  );
}
