import { notFound, redirect } from "next/navigation";
import { getSessionClaims } from "@/lib/auth";
import { getSite } from "@/server/sites/sites.service";
import { listSiteMessages } from "@/server/messages/messages.service";
import { resolveSiteAccess } from "@/server/access/access.rules";
import { MessagesInbox, type Message } from "@/components/dashboard/messages-inbox";

export default async function SiteMessagesPage({
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

  const perms = resolveSiteAccess(claims, site);
  const { messages, unread } = await listSiteMessages(claims, id, "all");

  // Serialize dates for the client component (Date → ISO string).
  const initialMessages: Message[] = messages.map((m) => ({
    id: m.id,
    name: m.name,
    contact: m.contact,
    body: m.body,
    status: m.status,
    createdAt: m.createdAt.toISOString(),
  }));

  return (
    <MessagesInbox
      siteId={id}
      businessName={site.businessName}
      initial={{ messages: initialMessages, unread }}
      canManage={perms.canEditSettings}
    />
  );
}
