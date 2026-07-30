import { notFound, redirect } from "next/navigation";
import { getSessionClaims } from "@/lib/auth";
import { getSite } from "@/server/sites/sites.service";
import { resolveSiteAccess } from "@/server/access/access.rules";
import { listSnapshots } from "@/server/publishing/publishing.service";
import { getPrisma } from "@/lib/db";
import { PublishHistory } from "@/components/dashboard/publish-history";

export default async function PublishHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const claims = await getSessionClaims();
  if (!claims) redirect("/login");
  let site;
  try {
    site = await getSite(claims, id);
  } catch {
    notFound();
  }
  // Read-only for viewers without publish rights (e.g. an invited business owner
  // without builder access). Rollback is also blocked server-side.
  const canRollback = resolveSiteAccess(claims, site).canPublish;

  const snapshots = await listSnapshots(claims, id);

  // Resolve author display names in one query (snapshots only carry authorId).
  const authorIds = [
    ...new Set(snapshots.map((s) => s.authorId).filter((x): x is string => x !== null)),
  ];
  const authors = await getPrisma().user.findMany({
    where: { id: { in: authorIds } },
    select: { id: true, name: true, email: true },
  });
  const nameById = new Map(authors.map((a) => [a.id, a.name || a.email]));

  return (
    <PublishHistory
      siteId={id}
      canRollback={canRollback}
      items={snapshots.map((s) => ({
        id: s.id,
        version: s.version,
        author: (s.authorId && nameById.get(s.authorId)) || "—",
        createdAt: s.createdAt.toISOString(),
      }))}
    />
  );
}
