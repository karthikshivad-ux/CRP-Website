# CRP — Connecting the Fish Trade

A modern, responsive corporate website built for **CRP**, a wholesale fish business based in Puthiyappa, Kozhikode, Kerala.

The website focuses on business communication, brand identity and CRP's harbour-based trade network rather than product listings.

## 🌐 Live Website

**[Visit CRP Website](https://crp-website-chi.vercel.app/)**

---

## About the Project

CRP is built around relationships, harbour networks and reliable market information.

The website presents CRP as a modern wholesale fish business while providing visitors with direct ways to connect through WhatsApp, phone and Google Maps.

The design uses a dark ocean-inspired visual identity with subtle maritime elements, motion effects and a responsive layout.

---

## ✨ Features

- Modern corporate landing page
- Fully responsive design
- CRP custom branding and logo
- Animated hero section
- Scroll-reveal animations
- Interactive hover effects
- Mobile navigation menu
- Direct WhatsApp integration
- Direct phone calling
- Google Maps location link
- GROWTH trade-network section
- Membership access placeholder
- SEO metadata
- Open Graph social sharing metadata
- Custom social preview banner
- Responsive mobile experience
- Production deployment with Vercel

---

## 🌊 GROWTH

**GROWTH** is CRP's dedicated WhatsApp trade network concept.

It is designed around the flow:

```text
HARBOURS
    ↓
LIVE UPDATES
    ↓
BUYERS

```

## CRP GROWTH Admin

The private admin console is available at `/growth-admin`; no admin link is shown on the public site. It uses Supabase email/password Auth. Only the comma-separated addresses in the server environment variable `GROWTH_ADMIN_EMAILS` may sign in. Add those users under Supabase Authentication before granting access, and keep `SUPABASE_SERVICE_ROLE_KEY` server-only.

Before deployment:

1. Run `supabase/migrations/202610160001_growth_admin.sql` in the Supabase SQL Editor.
2. Configure `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GROWTH_ADMIN_EMAILS`, and `PUBLIC_SITE_URL` in the local/Vercel server environment. Use `.env.example` as a name-only template; never expose the service-role key in browser code.
3. Add `/growth-admin?recovery=1` to the Supabase Auth redirect URL allowlist to enable password reset links.
4. Verify UPI transfers in the Payments page and enter the verified transaction reference. A verified payment starts or extends the member's plan and is included in monthly revenue.

The migration creates payment and membership-period history for new registrations. Existing members remain visible, but historical dates and transactions are not inferred or backfilled; review those with the member and enter them through a separate migration or reconciliation process if needed. Monthly revenue counts only verified payment records.
