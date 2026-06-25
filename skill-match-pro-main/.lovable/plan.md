# Skill-Based Associate Allocation — Pilot Build Plan

## Stack adaptation
The Lovable platform is TanStack Start (React 19 + Vite) with Lovable Cloud (managed Postgres + Auth + storage + edge runtime). I'll build on this rather than a separate Node/Express server — it gives you the same Postgres schema, JWT auth, RLS-enforced role checks, and audited mutations, with zero ops. All your business rules (skill-match gate, availability gate, expiry, uniqueness, override audit, soft delete) map cleanly.

- Frontend: React + Tailwind + shadcn (already in template)
- Backend: TanStack `createServerFn` for app calls, server routes for Excel up/down
- DB: Lovable Cloud Postgres with the exact schema you specified
- Auth: Lovable Cloud Auth + a `user_roles` table (separate from profiles — required for security; your `AppUser.role` column would be a privilege-escalation risk)
- Excel: SheetJS (`xlsx`) for upload + template; PDF deferred to post-pilot or done via print-to-PDF to keep pilot small
- Audit: Postgres triggers on every mutating table → guaranteed coverage, can't be bypassed from app code

## Pilot scope (this build)
1. Lovable Cloud enabled + full schema migration with constraints, indexes, RLS, audit triggers, seed data
2. Auth + role assignment (PLANT_ADMIN, HR_COORDINATOR, SUPERVISOR, PLANT_MANAGER)
3. Master data CRUD: departments, lines, machines (+ skill requirements), shifts, skills
4. Associate management + skill profiles + Excel bulk upload (all-or-nothing, server-generated template with dropdowns)
5. Availability marking
6. Shift Allocation Board with eligibility engine + override flow
7. Reports: shift summary, training-due
8. User management
9. Audit log via DB triggers (no UI this pilot)

Out of scope (stubs/deferred): PDF export, gap-analysis heatmap, override-log report UI, associate-history report UI, audit UI, offline banner polish. Schema supports all.

## Schema notes (deviations and why)
- Roles live in a separate `user_roles` table with an `app_role` enum and a `has_role()` SECURITY DEFINER function. `AppUser` becomes a thin profile linked to `auth.users`. This is non-negotiable for security; your spec's inline `role` column would allow any authenticated user to escalate.
- All your tables created verbatim (snake_case to match Postgres conventions). All FKs, UNIQUEs, CHECKs preserved.
- `CHECK` constraints added for enum-like text columns (`skill_level`, `category`, `status`, allocation `status`, audit `action`) to enforce values at DB level.
- `CHECK (status <> 'OVERRIDE' OR override_reason IS NOT NULL AND length(trim(override_reason)) > 0)` on `shift_allocation`.
- Self-assignment block enforced in the allocation server function (DB can't see the link between `allocated_by` user and `associate_id` without a join — function-level check + trigger).
- Skill-match gate enforced by a `BEFORE INSERT` trigger on `shift_allocation` that raises unless override.
- Audit trigger writes `old_values`/`new_values` JSONB + `auth.uid()` for every INSERT/UPDATE/DELETE on tracked tables.
- Soft delete enforced by RLS: no role gets DELETE on master/associate tables; UI calls UPDATE to set `is_active=false`.

## Eligibility engine
Single SQL function `get_eligible_associates(date, shift_id, machine_id)` returning ranked rows with `eligibility_status` (ELIGIBLE / ELIGIBLE_EXPIRING_SOON), skill levels, deployment count. Called from a server function. Sub-2s for 500 associates × 50 machines via indexes on `(associate_id, skill_id)`, `(allocation_date, shift_id)`, `(associate_id, unavailable_date)`.

## UI screens (pilot)
1. `/auth` — login (Lovable-managed)
2. `/` — role-aware dashboard with shortcuts
3. `/allocation` — Shift Allocation Board (date + shift picker, machines grouped by line, click → eligible side panel, confirm/override)
4. `/associates` + `/associates/:id` — list, profile, skill matrix, deployment history
5. `/upload` — Excel template download + validated upload preview
6. `/reports` — shift summary + training-due (filters + Excel export)
7. `/admin` — master data CRUD + machine-skill mapping + user management

All gated by role via `_authenticated` + per-page role checks; PLANT_MANAGER sees read-only variants.

## Design direction
Industrial/operational feel — high-contrast, dense data, generous tap targets (≥44px) for tablet floor use. Light theme default (plant lighting), PepsiCo-adjacent blue/red accent without trademark misuse. Status colors: green=confirmed, amber=override, red=unallocated/expired. No dark-mode toggle in pilot.

## Build order (approximate turns)
1. Enable Lovable Cloud
2. Migration: enums, all tables, constraints, indexes, roles infra, audit triggers, eligibility function, RLS, seed
3. Auth scaffolding + role helpers + `_authenticated` shell + nav
4. Master data admin screens
5. Associates + skill profile + bulk upload
6. Allocation board + eligibility panel + override
7. Reports + Excel export
8. User management + polish + README

This pilot will be ~15–20 files of app code on top of the schema. I'll ship it modularly so individual modules can be swapped after pilot feedback.

Approve and I'll start by enabling Lovable Cloud and applying the schema migration.