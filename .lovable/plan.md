
This request is enormous — realistically 3–6 weeks of senior engineering work. I'll ship it in reviewable phases rather than one unshippable mega-commit. Every phase is real Supabase-backed code (no mocks, no placeholders) and leaves the app in a working state.

Before I start, I need a few decisions from you (answer inline, or say "you decide"):

1. **Admin access** — who becomes admin? Options:
   a) You provide an email; I hardcode it as the first admin via migration.
   b) First signed-up user auto-promoted.
   c) You'll grant via SQL yourself.

2. **Phase order** — I recommend the order below. OK to proceed, or reprioritize?

3. **Image storage** — create a public `product-images` Supabase Storage bucket with client-side compression + WebP conversion? (Server-side sharp/resize is not available on the Cloudflare Worker runtime.)

4. **Scope trims I'll make unless you object:**
   - No native barcode scanner (field only).
   - Keyboard shortcuts: minimal set (⌘K search, N new, / focus search).
   - Audit log = single `audit_logs` table + viewer; not per-field diffs.
   - Analytics = SQL aggregates on real tables (no separate events pipeline yet — "Most Viewed" needs a view-tracking table; I'll add it in Analytics phase).

## Phased plan

### Phase 1 — Schema & RBAC foundation
- Extend `app_role` enum: `admin`, `editor`, `moderator`, `viewer`, `user`.
- Migrations:
  - `products`: add slug, sub_category_id, gender, product_type, ingredients, benefits, how_to_use, image_gallery (text[]), thumbnail, tags (text[]), sku, barcode, weight, size, variants (jsonb), discount_pct (generated), lowest_price, highest_price, avg_price, stock_status, availability, featured, trending, new_arrival, best_seller, product_url, archived_at. Indexes on slug, sku, barcode, brand_id, category_id, tags (GIN), name (trigram).
  - `subcategories` table.
  - `product_listings`: add mrp, discount, coupon_code, cashback, seller, delivery, last_updated.
  - `coupons` table (code, marketplace, discount, expiry, active).
  - `audit_logs` (actor, action, entity, entity_id, diff jsonb, created_at).
  - `product_views` (user_id nullable, product_id, viewed_at) for "Most Viewed".
- Storage bucket `product-images` (public) + RLS policies (admin/editor write, anyone read).
- Admin-role gates via `has_role(uid, 'admin')` etc.

### Phase 2 — Admin shell + Dashboard
- `/_authenticated/admin` layout with sidebar nav (Dashboard, Products, Brands, Categories, Marketplaces, Coupons, Notifications, Users, Price Tracking, Analytics, Settings), gated by `has_role >= editor`.
- Dashboard: real KPI cards (total products/brands/categories/tracked, top discounts) via server functions.
- Command palette (⌘K).

### Phase 3 — Products CRUD
- List page: server-side paginated table, column sort, filters (category/brand/marketplace/price/rating/stock/gender/discount/tags), full-text search, row selection, bulk delete/archive/update.
- Add/Edit form: all fields above, tabbed (Basics / Media / Pricing / Marketplace Listings / SEO / Flags).
- Duplicate + Archive actions.
- Image gallery uploader: drag-drop, multi-file, client-side compress + WebP, thumbnail derived, stored in bucket.

### Phase 4 — CSV Import/Export
- Import wizard: upload → auto column-mapping → preview (first 20 rows) → validation (zod) → chunked insert (500/batch) via server fn → report (created/updated/skipped/errors) + downloadable error CSV. Tested up to 10k rows.
- Export: All / Filtered / Brands / Categories / Price History / Users / Tracking, streamed CSV via server route.

### Phase 5 — Brands, Categories, Subcategories, Marketplaces, Coupons
- CRUD pages, same table pattern.
- Seed the 9 marketplaces (Amazon, Flipkart, Nykaa, Purplle, Myntra, Tira, Blinkit, Zepto, BigBasket) if missing.

### Phase 6 — Price Tracking & History
- Price Tracking page: every tracked product, current vs target, alert status.
- Manual "record price" action per listing → inserts into `price_history` → existing trigger fires drop notifications.
- Product detail admin view: full history chart + timeline + lowest/highest/avg.

### Phase 7 — Users & Notifications admin
- Users page: list auth users (via `supabaseAdmin`), assign roles, view activity.
- Notifications page: broadcast, view sent, per-user history.

### Phase 8 — Analytics
- Most viewed (from `product_views`), most saved (`wishlist_items` counts), top discounts, most tracked, fastest price-drop.

### Phase 9 — Settings, Audit Logs, polish
- Settings: profile, role management shortcuts, feature toggles.
- Audit log viewer.
- Loading skeletons everywhere, empty states, success toasts, responsive pass.

## Technical notes
- All list queries paginated server-side; no `.select('*')` without limits.
- All writes go through `createServerFn` with `requireSupabaseAuth` + role check.
- RLS: existing `has_role` pattern; add editor/moderator/viewer policies.
- No sharp/Node-only libs — image processing via `canvas` in browser.
- Reuse existing shadcn components; no new UI kit.

---

**Reply with:**
- answers to Q1–Q4, and
- "go" to start Phase 1,

or tell me which phases to skip / reorder. I will NOT try to cram all 9 phases into one turn — that produces broken code.
