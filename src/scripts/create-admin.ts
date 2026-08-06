// One-off: create (or promote) a platform ADMIN with a working password.
// Idempotent. Uses Better Auth's OWN password hasher (the same one the login
// path verifies against) so the account logs in immediately, and marks the user
// email-verified so there's no confirmation step.
//
// Run (point DATABASE_URL at the target DB):
//   ADMIN_EMAIL=… ADMIN_PASSWORD=… ADMIN_NAME=… DATABASE_URL=… tsx src/scripts/create-admin.ts

import { auth } from "@/lib/auth";
import { getPrisma } from "@/lib/db";

const prisma = getPrisma();

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "";
  const name = process.env.ADMIN_NAME ?? email;
  if (!email || !password) throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required");

  // Better Auth's configured password hasher (matches the login verifier).
  const ctx = await auth.$context;
  const hash = await ctx.password.hash(password);

  const user = await prisma.user.upsert({
    where: { email },
    // Confirmed + admin so it works directly.
    update: { emailVerified: true, platformRole: "admin", name },
    create: { email, name, emailVerified: true, platformRole: "admin" },
  });

  // Credential account holds the password (Better Auth: providerId "credential",
  // accountId == userId). Upsert so re-runs just reset the password.
  const cred = await prisma.account.findFirst({
    where: { userId: user.id, providerId: "credential" },
    select: { id: true },
  });
  if (cred) {
    await prisma.account.update({ where: { id: cred.id }, data: { password: hash } });
  } else {
    await prisma.account.create({
      data: { userId: user.id, providerId: "credential", accountId: user.id, password: hash },
    });
  }

  // A platform admin still needs a WORKSPACE (as owner) to create sites — the
  // /dashboard/sites/new guard bounces users with no active workspace. Give them
  // a reseller workspace (no site cap) if they don't already have a membership.
  const membership = await prisma.workspaceMember.findFirst({ where: { userId: user.id } });
  if (!membership) {
    const ws = await prisma.workspace.create({
      data: {
        name: process.env.WORKSPACE_NAME || name || email,
        kind: "reseller",
        members: { create: { userId: user.id, role: "owner" } },
      },
    });
    console.log(`  + created workspace ${ws.id} (reseller, owner)`);
  } else {
    console.log(`  · already a member of workspace ${membership.workspaceId}`);
  }

  console.log(`✓ admin ready: ${email} (id=${user.id}, verified, platformRole=admin)`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("✗ failed:", e);
    process.exit(1);
  });
