# Marketplace template — the business model

Two questions this template has to answer: **how Sawwi makes money selling it**,
and **how the site owner makes money running it**. Both are designed in, not
bolted on.

## Who the owner is

The marketplace template is **owner-managed, single-tenant** (decided, not a
default): the site owner is a **car dealership (معرض)** or a **real-estate office
(مكتب عقاري)** listing *their own* inventory. It is **not** a public multi-seller
classifieds where strangers post ads — that would need seller accounts, payments,
and moderation, and it doesn't fit Sawwi's one-business-per-site subscription
model. Visitors **browse and enquire**; they never publish.

## How Sawwi makes money (platform revenue)

It rides the **existing subscription/commission model** — zero new billing
plumbing:

- A dealership/agency subscribes annually, sold either **direct** or through a
  **reseller** (who earns the usual commission). Same `Subscription` /
  `CommissionEntry` machinery as every other site.
- It is a **premium template**: live inventory + filters + a lead inbox is worth
  more than a static brochure site, so it justifies the subscription and is a
  strong reseller pitch into a **large, cash-rich vertical** (cars & property are
  among the highest-value local markets).
- Growth lever: every published listing is SEO surface and word-of-mouth for "the
  site that dealer built with us" — cheap reseller lead-gen.

## How the site owner makes money (their ROI)

The site is a **lead-generation showroom**. The owner earns **off-platform** (car
sales, rental/sale commissions); the template's job is to **maximize qualified
leads** and give **merchandising control**. The concrete levers, all built:

1. **Leads = the money.** Every listing has **«أرسل رسالة»** (enquiry →
   `SiteMessage` + owner notification, reusing the messages feature) and
   **«إظهار رقم الهاتف»** + a top-bar WhatsApp button. Contact is one tap from
   any car/flat.
2. **مميّز (featured).** The owner surfaces high-margin or priority stock at the
   top of the results with a badge. For a plain dealer it's merchandising; for an
   owner who lists on behalf of others it's a **paid-boost** primitive.
3. **status (متاح / محجوز / مُباع).** Keeps the showroom **credible** (no dead
   listings) and creates **urgency**; «مُباع» badges are social proof of a busy
   dealer. It's also the primitive a broker needs to **charge per active
   listing**.
4. **"Every field is a filter."** The stepper's listing-strength meter pushes the
   owner to fill optional fields, which puts each listing in front of buyers
   searching for exactly those specs — more, better-qualified leads.

## Where this can grow (not built yet)

The `featured` + `status` primitives are deliberately the hooks a richer model
would use:

- **Sub-broker mode:** let the owner charge sellers to list, charge for «مميّز»
  placement, or take a commission on a «مُباع» — turning the single-tenant site
  into a small brokerage without changing the physical schema.
- **Tiered caps:** tie the per-site listing cap or featured-slot count to the
  subscription plan (the cap already exists in the service; wiring it to the plan
  is a small step).

See also: [`docs/TEMPLATE_GUIDE.md`](TEMPLATE_GUIDE.md) (template contract) and
the `Listing` model in [`prisma/schema.prisma`](../prisma/schema.prisma).
