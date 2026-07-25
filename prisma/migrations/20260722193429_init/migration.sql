-- CreateEnum
CREATE TYPE "PlatformRole" AS ENUM ('user', 'admin');

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('owner', 'member');

-- CreateEnum
CREATE TYPE "AccessLevel" AS ENUM ('editor', 'viewer');

-- CreateEnum
CREATE TYPE "SiteLanguage" AS ENUM ('ar', 'en');

-- CreateEnum
CREATE TYPE "SiteStatus" AS ENUM ('draft', 'published', 'suspended');

-- CreateEnum
CREATE TYPE "PageType" AS ENUM ('landing', 'about', 'contact', 'services', 'custom');

-- CreateEnum
CREATE TYPE "ColorScheme" AS ENUM ('primary', 'light', 'dark', 'accent');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'grace', 'suspended');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('cash', 'mobile_money', 'bank_transfer', 'other');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('SYP', 'USD', 'EUR');

-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('owed', 'settled');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "platformRole" "PlatformRole" NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspaces" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "city" TEXT,
    "commissionPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_members" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'member',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspace_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_invites" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedBy" TEXT,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspace_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sites" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "verticalKey" TEXT NOT NULL,
    "templateKey" TEXT,
    "language" "SiteLanguage" NOT NULL DEFAULT 'ar',
    "status" "SiteStatus" NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_access" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "userId" TEXT,
    "invitedEmail" TEXT NOT NULL,
    "level" "AccessLevel" NOT NULL DEFAULT 'editor',
    "invitedBy" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_settings" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "whatsappNumber" TEXT,
    "phone" TEXT,
    "socials" JSONB NOT NULL DEFAULT '{}',
    "googleMapsUrl" TEXT,
    "address" TEXT,
    "openingHours" JSONB NOT NULL DEFAULT '{}',
    "logoMediaId" TEXT,
    "loadingIconId" TEXT,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_themes" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "paletteKey" TEXT,
    "primaryColor" TEXT,
    "secondaryColor" TEXT,
    "bgColor" TEXT,
    "fontKey" TEXT NOT NULL DEFAULT 'readex',

    CONSTRAINT "site_themes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" TEXT,
    "duration" TEXT,
    "imageMediaId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_members" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "roleTitle" TEXT,
    "photoMediaId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "testimonials" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "testimonials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faq_items" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "faq_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pages" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "pageType" "PageType" NOT NULL DEFAULT 'landing',
    "title" TEXT NOT NULL,
    "seo" JSONB NOT NULL DEFAULT '{}',
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "section_instances" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "sectionType" TEXT NOT NULL,
    "variant" TEXT NOT NULL DEFAULT 'A',
    "colorScheme" "ColorScheme" NOT NULL DEFAULT 'primary',
    "order" INTEGER NOT NULL DEFAULT 0,
    "content" JSONB NOT NULL DEFAULT '{}',
    "dataSource" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "section_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "publish_snapshots" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,
    "authorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "publish_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_locks" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "lockedById" TEXT NOT NULL,
    "heartbeatAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_locks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'annual',
    "price" DOUBLE PRECISION,
    "currency" "Currency" NOT NULL DEFAULT 'SYP',
    "expiry" TIMESTAMP(3) NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_records" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'SYP',
    "method" "PaymentMethod" NOT NULL DEFAULT 'cash',
    "collectedBy" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commission_entries" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "pct" DOUBLE PRECISION NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "CommissionStatus" NOT NULL DEFAULT 'owed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settledAt" TIMESTAMP(3),

    CONSTRAINT "commission_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "workspace_members_userId_idx" ON "workspace_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_members_workspaceId_userId_key" ON "workspace_members"("workspaceId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_invites_token_key" ON "workspace_invites"("token");

-- CreateIndex
CREATE INDEX "workspace_invites_workspaceId_idx" ON "workspace_invites"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "sites_slug_key" ON "sites"("slug");

-- CreateIndex
CREATE INDEX "sites_workspaceId_idx" ON "sites"("workspaceId");

-- CreateIndex
CREATE INDEX "site_access_siteId_idx" ON "site_access"("siteId");

-- CreateIndex
CREATE INDEX "site_access_userId_idx" ON "site_access"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "site_settings_siteId_key" ON "site_settings"("siteId");

-- CreateIndex
CREATE UNIQUE INDEX "site_themes_siteId_key" ON "site_themes"("siteId");

-- CreateIndex
CREATE INDEX "services_siteId_idx" ON "services"("siteId");

-- CreateIndex
CREATE INDEX "team_members_siteId_idx" ON "team_members"("siteId");

-- CreateIndex
CREATE INDEX "testimonials_siteId_idx" ON "testimonials"("siteId");

-- CreateIndex
CREATE INDEX "faq_items_siteId_idx" ON "faq_items"("siteId");

-- CreateIndex
CREATE INDEX "pages_siteId_idx" ON "pages"("siteId");

-- CreateIndex
CREATE UNIQUE INDEX "pages_siteId_path_key" ON "pages"("siteId", "path");

-- CreateIndex
CREATE INDEX "section_instances_pageId_idx" ON "section_instances"("pageId");

-- CreateIndex
CREATE INDEX "publish_snapshots_siteId_idx" ON "publish_snapshots"("siteId");

-- CreateIndex
CREATE UNIQUE INDEX "publish_snapshots_siteId_version_key" ON "publish_snapshots"("siteId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "page_locks_pageId_key" ON "page_locks"("pageId");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_siteId_key" ON "subscriptions"("siteId");

-- CreateIndex
CREATE INDEX "payment_records_subscriptionId_idx" ON "payment_records"("subscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "commission_entries_paymentId_key" ON "commission_entries"("paymentId");

-- CreateIndex
CREATE INDEX "commission_entries_workspaceId_idx" ON "commission_entries"("workspaceId");

-- AddForeignKey
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_invites" ADD CONSTRAINT "workspace_invites_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sites" ADD CONSTRAINT "sites_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_access" ADD CONSTRAINT "site_access_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_access" ADD CONSTRAINT "site_access_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_themes" ADD CONSTRAINT "site_themes_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faq_items" ADD CONSTRAINT "faq_items_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pages" ADD CONSTRAINT "pages_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "section_instances" ADD CONSTRAINT "section_instances_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publish_snapshots" ADD CONSTRAINT "publish_snapshots_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_locks" ADD CONSTRAINT "page_locks_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "pages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_locks" ADD CONSTRAINT "page_locks_lockedById_fkey" FOREIGN KEY ("lockedById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_records" ADD CONSTRAINT "payment_records_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_entries" ADD CONSTRAINT "commission_entries_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commission_entries" ADD CONSTRAINT "commission_entries_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payment_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;
