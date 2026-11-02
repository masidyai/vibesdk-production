# Masidy Product Roadmap
> Living document — updated after every phase completes.
> Status: ✅ Done | 🔄 In Progress | ⏳ Pending | ❌ Blocked

---

## Vision
Masidy = the Vercel/v0 for AI-generated apps, running entirely on our Cloudflare infrastructure.
Users prompt → AI builds → deploys live at `app-name.masidy.dev` → optionally on their own custom domain.
No Cloudflare account needed by end users. Everything runs on Masidy's paid Cloudflare subscriptions.

---

## Infrastructure we own (already paid)
| Subscription | Powers |
|---|---|
| Workers for Platforms | Every user app runs as a dynamic Worker in our dispatch namespace |
| Workers Paid | Main Masidy backend (ThinkAgent, SpaceDO, API) |
| R2 Paid | Templates, file artifacts |
| Images Stream Basic | App preview thumbnails (not yet wired) |
| Advanced Certificate Manager | masidy.dev SSL + wildcard subdomains |
| Log Explorer | Worker observability |
| Zero Trust / Teams Free | Not yet used |
| Tunnels for Platforms | Not yet used |

---

## Phase 1 — Clean UX + Fix Broken Stubs
**Goal:** Remove Cloudflare confusion from end-users, fix broken features, polish settings/profile.
**Status:** 🔄 In Progress (1.5 avatar upload pending)
**Branch:** `feat/phase-1-ux-cleanup`

### Tasks
- [x] 1.1 Hide/replace Cloudflare AI Gateway section for regular users
  - The `CloudflareAccountSelector` component is currently shown to ALL users
  - Replace with a "Masidy Plan" info card showing their current plan + usage
  - Keep Cloudflare connect available but move it to an "Advanced" collapsed section for power users / self-hosters
  - File: `src/components/cloudflare-account-selector.tsx`, `src/routes/settings/index.tsx`

- [x] 1.2 Implement delete account properly
  - Currently: `toast.error('Account deletion is not yet implemented')`
  - Need: API endpoint to delete user + all their data (apps, sessions, API keys)
  - Files: `worker/api/controllers/auth/`, `worker/database/services/UserService.ts`

- [x] 1.3 Add password change for email users
  - Users who signed up with email have no way to change their password
  - Add "Change password" form in Security section (current password + new password)
  - Files: `src/routes/settings/index.tsx`, `worker/api/controllers/auth/`

- [x] 1.4 Fix profile page title remnant
  - `Profile - Build` still appears in one code branch in `profile.tsx`
  - File: `src/routes/profile.tsx` line ~148

- [ ] 1.5 Add avatar upload
  - Currently only shows initials or OAuth provider avatar
  - Add image upload to R2, store URL in user profile
  - Files: `src/routes/profile.tsx`, `worker/api/controllers/`, R2 bucket

- [x] 1.6 Show public profile URL
  - Users don't know their public profile link
  - Add a copyable `masidy.dev/u/username` link on the profile page

---

## Phase 2 — Stable Deployments + Subdomains
**Goal:** Apps deployed by users live at a stable `app-name.masidy.dev` URL, not just ephemeral previews.
**Status:** ✅ Complete

### Tasks
- [x] 2.1 Enable `ENABLE_USER_ACCOUNT_DEPLOY` flag
  - Currently off. Turning on allows `target: 'platform'` deploys using Masidy credentials
  - Workers for Platforms dispatch namespace: `vibesdk-default-namespace` (already configured)
  - File: `worker/app.ts`, `wrangler.jsonc` vars

- [x] 2.2 Wildcard subdomain routing
  - Route `*.masidy.dev` → main Worker → read subdomain → resolve to correct user app
  - Advanced Certificate Manager already covers wildcard SSL ✅
  - Need: subdomain → app_id mapping in D1, routing middleware in worker
  - Files: `worker/index.ts`, `worker/app.ts`, new `worker/api/middleware/subdomain.ts`

- [x] 2.3 App slug/name system
  - Each app gets a unique slug (e.g. `todo-app-123`) used as subdomain
  - Auto-generated from app title, user can rename
  - Add `slug` column to `apps` D1 table → new migration
  - Files: `worker/database/schema.ts`, `src/routes/app/index.tsx`

- [x] 2.4 "Publish" button in chat
  - Currently deploy is a preview. Add explicit "Publish to masidy.dev" action
  - On publish: bundles current files, deploys to dispatch namespace, sets stable URL
  - Files: `src/routes/chat/chat.tsx`, `worker/agents/think/`

- [ ] 2.5 Deployed apps dashboard
  - Show live URL, deployment status, last deployed time on app detail page
  - Files: `src/routes/app/index.tsx`

---

## Phase 3 — Usage Dashboard
**Goal:** Users see exactly how many AI builds / calls they've used and what's remaining.
**Status:** ⏳ Pending
**Branch:** `feat/phase-3-usage-dashboard`

### Tasks
- [ ] 3.1 Usage API endpoint
  - `GET /api/usage/me` returns builds used, AI tokens consumed, reset date
  - Track per-user build count in D1 (increment on each generation start)
  - Files: `worker/api/routes/index.ts`, `worker/database/schema.ts`

- [ ] 3.2 Usage card in settings
  - Show: plan name, builds used / builds allowed, resets on date, upgrade CTA
  - Replace the Cloudflare section for regular users
  - File: `src/routes/settings/index.tsx`, new `src/components/usage-card.tsx`

- [ ] 3.3 Usage in sidebar
  - Small usage indicator at the bottom of sidebar (e.g. "12 / 30 builds")
  - File: `src/components/layout/app-sidebar.tsx`

- [ ] 3.4 Usage in profile stats
  - Add "Builds this month" to the 4 stat cards on profile page
  - File: `src/routes/profile.tsx`

---

## Phase 4 — Billing + Plans (Stripe)
**Goal:** Free tier → paid plans, Stripe checkout, subscription management.
**Status:** ⏳ Pending
**Branch:** `feat/phase-4-billing`

### Tasks
- [ ] 4.1 Define plan tiers
  ```
  Free:    10 builds/month, platform deploy only, masidy.dev subdomain
  Pro:     100 builds/month, custom domain, priority AI
  Team:    Unlimited builds, team workspaces, custom domain
  ```

- [ ] 4.2 Stripe integration
  - Add Stripe secret key to secrets
  - Webhook endpoint: `POST /api/webhooks/stripe`
  - Handle: checkout.session.completed, customer.subscription.updated/deleted
  - Files: new `worker/services/stripe/`, `worker/api/routes/index.ts`

- [ ] 4.3 Plan/subscription in D1
  - Add `subscription` table: user_id, plan, stripe_customer_id, stripe_subscription_id, status, current_period_end
  - New migration
  - Files: `worker/database/schema.ts`

- [ ] 4.4 Upgrade flow UI
  - Pricing page at `/pricing`
  - Upgrade CTA in settings when on free tier
  - Stripe Checkout redirect → return to `/settings?upgraded=true`
  - Files: new `src/routes/pricing.tsx`, `src/routes/settings/index.tsx`

- [ ] 4.5 Plan enforcement
  - Gate build starts by checking plan + usage count
  - Show upgrade dialog when free tier exhausted (replace Cloudflare connect dialog)
  - Files: `worker/agents/core/`, `src/utils/usage-limit-checker.tsx`

- [ ] 4.6 Billing portal
  - "Manage subscription" → Stripe Customer Portal link
  - Show in settings: plan name, next billing date, cancel option
  - File: `src/routes/settings/index.tsx`

---

## Phase 5 — Custom Domains
**Goal:** Pro/Team users can map their own domain to their deployed app.
**Status:** ⏳ Pending
**Branch:** `feat/phase-5-custom-domains`

### Tasks
- [ ] 5.1 Custom domain model in D1
  - Add `custom_domains` table: app_id, domain, verified, cloudflare_hostname_id
  - Files: `worker/database/schema.ts`

- [ ] 5.2 Domain verification flow
  - User adds domain → we give them a CNAME record to add
  - Poll Cloudflare API to check DNS propagation
  - Files: new `worker/services/custom-domains.ts`, `worker/api/controllers/`

- [ ] 5.3 Custom domain routing
  - Worker reads `Host` header → looks up custom_domains table → routes to correct app
  - Files: `worker/app.ts`, `worker/index.ts`

- [ ] 5.4 Custom domain UI in app settings
  - Add "Custom Domain" section to app detail page
  - Show DNS instructions, verification status, remove domain
  - File: `src/routes/app/index.tsx`

- [ ] 5.5 SSL provisioning
  - Use Cloudflare Hostname-level SSL API to provision cert for custom domain
  - Advanced Certificate Manager subscription already covers this ✅

---

## Phase 6 — Polish + Images/Stream
**Goal:** Use remaining subscriptions, improve media handling.
**Status:** ⏳ Pending

### Tasks
- [ ] 6.1 Wire Images subscription for app thumbnails
  - Auto-screenshot deployed apps, store via Cloudflare Images
  - Show thumbnail on app cards in discover/profile

- [ ] 6.2 App preview video (Stream)
  - Record a short clip of the app on deploy, show on app detail page

- [ ] 6.3 Zero Trust / Teams
  - Internal admin panel protected by Cloudflare Access

---

## Completed ✅

### Rebrand to Masidy
- ✅ All "Build" / "vibesdk" brand text replaced with "Masidy"
- ✅ MasidyLogo SVG component (lime dot + in-glyph, transparent)
- ✅ Brand colors: orange → lime green (#7FFF00)
- ✅ Page titles updated across all routes
- ✅ Settings: "VibeSDK API keys" → "Masidy API keys"

### Health Fixes
- ✅ Migration naming collision fixed (0006→0008_puzzling_bloodstrike)
- ✅ HeaderProvider split into own file (React fast-refresh warning fixed)
- ✅ remoteBindings: false in vite config (test runner fix)
- ✅ Container image tag fixed (wrangler.jsonc: f7347c5c)
- ✅ SDK dist built (index.js + index.d.ts)
- ✅ All 39/39 test suites passing in WSL

### Infrastructure
- ✅ masidy.dev domain live, custom domain routing configured
- ✅ Workers for Platforms dispatch namespace: vibesdk-default-namespace
- ✅ D1 database with 9 migrations applied
- ✅ R2 bucket: vibesdk-templates with 10 template zips
- ✅ AI Gateway: vibesdk-gateway

---

## Notes & Decisions
- Users do NOT need a Cloudflare account — everything runs on Masidy infrastructure
- `ENABLE_USER_ACCOUNT_DEPLOY` should eventually allow users to deploy to THEIR own CF account (v0→own Vercel equivalent) — Phase 5+ concern
- Stripe is the billing provider — already decided
- Free tier: 10 builds/month (TBD — adjust after beta)
- App subdomain format: `{app-slug}.masidy.dev`