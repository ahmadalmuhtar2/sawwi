# Sawwi — Business & Subscription Model

**Status:** agreed spec (2026-07-29). Authoritative for roles, provisioning, billing,
and expiry. Overrides older role/billing notes in the PRD where they conflict.

Most of this is already present in the data model (`prisma/schema.prisma`) and the
access core (`src/server/access/access.rules.ts`). This doc records the agreed
behavior and the deltas still to build.

---

## 1. Personas

| Persona | Backed by | Scope |
|---|---|---|
| **Admin** | `User.platformRole = admin` | Everything. Runs the CRM; provisions resellers & direct accounts; controls payment status; settles commissions. |
| **Reseller** | Owner of a `Workspace` with `kind = reseller` | **One** workspace holding **many** client sites. Sells to businesses, collects payment offline, extends expiry, earns margin. |
| **Business owner / team** | `SiteAccess` grant only (no workspace) | Exactly **one** site, edit-only. Never sees workspace, billing management, other sites, templates, or "new site". |
| **Direct owner** | Owner of a `Workspace` with `kind = direct` | Admin-provisioned. **One** free site. Expiry mirrors `User.endDate ?? never`. No billing chrome. |

There is **no public self-serve signup.** Everyone arrives by admin provisioning or by invite.

---

## 2. Provisioning & registration flows

### Set-password screen (shared by all invite paths)
- Reached via a **token**. The token resolves **server-side** to the invited email.
- The email is **pre-filled and rendered disabled/greyed-out** — display-only confirmation.
- Account binding is **always by token**, never by the field value (a tampered field can't retarget another account).
- Mechanism: existing `/api/auth/reset-and-login` (set password + logged in).

### ① Admin provisions a reseller or direct account
1. Admin (CRM) creates the user by email → picks `kind` → sets `commissionPct` (reseller) or optional `endDate` (direct).
2. System creates **user + workspace** (with `kind`) and emails the set-password link.
3. First login routing:
   - **Reseller** → portfolio dashboard.
   - **Direct** → "pick a template" → creates **their own** single site (capped at 1).

### ② Reseller invites a business owner (per site)
1. On a site: "Invite owner" → email + **builder toggle** (default OFF) → creates a `SiteAccess` grant with a token.
2. Owner clicks email → set-password (or attach if they already have an account) → lands **directly in that one site**, edit-only. **No workspace created.**

### ③ Returning users
`/login` unchanged → **persona routing**: reseller → portfolio; owner/direct → their single site.

### Removed / changed
- **Remove** public `/register` self-serve and the self-serve `/onboarding` "create workspace" step.
- **`createWorkspace`** stops being caller-driven "unlimited per user" → only admin creates workspaces, with `kind` + caps.

---

## 3. Access matrix

Enforced **server-side** in `resolveSiteAccess`; UI gating is cosmetic on top, never the security boundary.

| Capability | Admin | Reseller (own ws) | Business owner (SiteAccess) | Direct owner |
|---|---|---|---|---|
| Edit site content/settings | ✅ | ✅ | ✅ | ✅ |
| Use visual builder + publish | ✅ | ✅ | ✅ **iff `builderAccess`** | ✅ |
| See templates gallery / create site | ✅ | ✅ | ❌ | ✅ (capped at 1) |
| See workspace switcher / create workspace | ✅ | ❌ (has exactly one) | ❌ | ❌ |
| Manage billing (record payment, set expiry) | ✅ | ✅ (own sites) | ❌ | ❌ |
| **View** own expiry (banner + الاشتراك tab) | ✅ | ✅ | ✅ **(new read-only perm)** | ✅ |
| CRM / cross-tenant view | ✅ | ❌ | ❌ | ❌ |

### Caps (enforced at server creation endpoints)
- **Direct** workspace: hard **1 site**.
- **Reseller** workspace: unlimited sites, exactly **1 workspace** per reseller.
- **Business owner**: no workspace, no site creation.

---

## 4. Billing & money flow

- Reseller collects payment **offline** (cash / mobile money) and keeps their margin.
- On recording a payment, a `CommissionEntry` for Sawwi accrues **`owed`** (= amount × `workspace.commissionPct`).
- Admin marks commissions **`settled`** when the reseller pays Sawwi.
- **Business owners never see a pay-Sawwi CTA** — they pay their reseller offline.

### Payment status (admin-controlled) — NEW
`PaymentRecord` gains a status the admin drives, independent of commission state:

```
pending · paid · checked · stopped · refunded
```

Admin can transition freely, filter/sort/search on it in the CRM.

---

## 5. Expiry & serving

- **Hard cutoff, no grace.** Public serving rule: **served iff `published` AND `now < expiry`.**
  At `now ≥ expiry` the public site immediately shows the **Sawwi-branded holding page**
  ("temporarily unavailable"). `SubscriptionStatus.grace` is left unused.
- **Owner can always log in and edit** regardless of expiry.
- **Reminders** fire *before* expiry — owner banner at **14 / 7 / 1 days** (dedup via
  `Subscription.lastReminderDay`, already present).
- **Extend:** reseller records a payment and picks a **new expiry date** (or presets
  +1mo / +3mo / +1yr) → `Subscription.expiry` updated → reminder dedup reset.
- **Direct tier:** effective expiry = `User.endDate ?? never`; same holding page on lapse.

### Business-owner expiry visibility (NEW read path)
Site-scoped owners currently have `canManageBilling = false` and **no read path**. Add a
view-only permission that surfaces:
- an **expiry banner** (soon / expired) in their dashboard, and
- a read-only **الاشتراك** tab: expiry date + status + **"contact your provider"** →
  the reseller's WhatsApp (see §7 schema).

---

## 6. Admin CRM

- Server-side **filter / sort / search / paginate** over users, workspaces, sites,
  subscriptions, payments, commissions.
- **Payment status control** (§4) + **commission settle**.
- Actions: extend expiry, set `User.endDate`, suspend, change roles, mark commission settled.
- KPIs: active sites, expiring-soon, commissions owed, revenue by reseller.

---

## 7. Schema deltas (Phase 0)

- `Workspace.kind : enum(reseller | direct)` — drives caps, nav, expiry source.
- `Workspace.contactName : String?`, `Workspace.contactWhatsapp : String?` — the
  "contact your provider" target shown to business owners.
- `User.endDate : DateTime?` — direct-tier hard expiry.
- `PaymentRecord.status : enum(pending | paid | checked | stopped | refunded)` (default `pending`).
- `SiteAccess.token : String? @unique` — invite-accept link (mirrors `WorkspaceInvite`).
- New read-only billing-view permission in `SitePermissions` (`canViewBilling`).

All migrations are applied to the **local/dev DB only**. Production schema changes reach
prod exclusively via the normal deploy pipeline the owner approves (CI/Railway) — never
from a developer machine, never against the prod connection string.

---

## 8. Build phases

0. **Data model** — §7 deltas + migration (local dev only).
1. **Access & shell gating** — persona-stripped dashboard, route guards, login routing.
2. **Reseller billing UX** — record payment → pick new expiry → extend + commission; earnings view.
3. **Expiry enforcement** — hard-cutoff in the public serving path + holding page; owner banner + الاشتراك tab.
4. **Admin CRM** — tables, filters, KPIs, payment-status + commission actions.
5. **Direct tier** — admin provisioning + owner self-creates 1 site + `endDate` → expiry sync.

---

## 9. Security notes

- Access is **always** derived from server-side session claims, never client-supplied ids.
- Hiding UI is never the boundary — every gated action has a server guard.
- Invite/set-password: **email is token-bound**, the disabled field is cosmetic.
