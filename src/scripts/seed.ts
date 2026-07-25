// Idempotent seed: creates a verified demo agency owner + an admin, a workspace,
// and a published barbershop demo site. Run: pnpm db:seed
//
// Credentials (dev only):
//   owner@sawwi.local / Sawwi12345!   (agency owner)
//   admin@sawwi.local / Sawwi12345!   (platform admin)

import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/db";
import { applyTemplate } from "@/server/templates/templates.service";
import { publishingRepository } from "@/server/publishing/publishing.repository";
import type { PlatformRole } from "@/shared/domain";

const prisma = getPrisma();

async function ensureUser(
  email: string,
  password: string,
  name: string,
  role: PlatformRole,
) {
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    try {
      await auth.api.signUpEmail({ body: { email, password, name } });
    } catch {
      /* already exists */
    }
    user = await prisma.user.findUnique({ where: { email } });
  }
  if (!user) throw new Error(`could not create ${email}`);
  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, platformRole: role },
  });
  return user;
}

async function main() {
  await ensureUser("admin@sawwi.local", "Sawwi12345!", "مشرف سوّي", "admin");
  const owner = await ensureUser("owner@sawwi.local", "Sawwi12345!", "صاحب الوكالة", "user");

  // Workspace
  let membership = await prisma.workspaceMember.findFirst({ where: { userId: owner.id } });
  if (!membership) {
    const ws = await prisma.workspace.create({
      data: {
        name: "وكالة النور",
        members: { create: { userId: owner.id, role: "owner" } },
      },
    });
    membership = await prisma.workspaceMember.findFirst({ where: { workspaceId: ws.id } });
  }
  const workspaceId = membership!.workspaceId;

  // Demo site (published)
  let site = await prisma.site.findUnique({ where: { slug: "diwan" } });
  if (!site) {
    site = await prisma.site.create({
      data: {
        workspaceId,
        slug: "diwan",
        businessName: "صالون الديوان للحلاقة",
        verticalKey: "barbershop",
        templateKey: "barbershop",
        language: "ar",
        status: "published",
      },
    });
    await applyTemplate(site.id, "barbershop");
    await prisma.subscription.create({
      data: {
        siteId: site.id,
        expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        status: "active",
      },
    });
  }

  // The public renderer serves snapshots, not drafts — ensure the demo has one
  // (idempotent: also backfills a snapshot for a site seeded before this change).
  if ((await publishingRepository.latestVersion(site.id)) === null) {
    const payload = await publishingRepository.buildPayload(site.id);
    if (payload) await publishingRepository.createSnapshot(site.id, 1, payload, owner.id);
  }

  console.log("✓ Seeded.");
  console.log("  owner@sawwi.local / Sawwi12345!  (agency)");
  console.log("  admin@sawwi.local / Sawwi12345!  (admin)");
  console.log("  demo site: http://diwan.localhost:3000");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
