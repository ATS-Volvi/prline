# Allocate — Skill-Based Contract Associate Allocation

Pilot application for PepsiCo Kolkata plant. Supervisors allocate contract associates to machines based on verified skill profiles, with complete audit trail.

## Stack

- **Frontend**: React 19, TanStack Router, Tailwind CSS v4, shadcn/ui
- **Backend**: TanStack Start (TypeScript), Lovable Cloud (managed Postgres + Auth + edge runtime)
- **Database**: PostgreSQL with row-level security, audit triggers, allocation validation triggers
- **Excel I/O**: SheetJS (`xlsx`)

## Pilot scope shipped

| Module | Path | Roles |
|---|---|---|
| Dashboard | `/` | All |
| Shift Allocation Board | `/allocation` | Plant Admin · Supervisor · Plant Manager |
| Associates list & profile | `/associates`, `/associates/:id` | All |
| Bulk Skill Upload (Excel) | `/upload` | Plant Admin · HR Coordinator |
| Reports (shift summary, training due) | `/reports` | All |
| Admin (master data + users) | `/admin` | Plant Admin |

## Roles

`PLANT_ADMIN` · `HR_COORDINATOR` · `SUPERVISOR` · `PLANT_MANAGER`

Roles are stored in `public.user_roles` (separate from profiles to prevent privilege escalation). The `has_role()` function gates RLS policies. New users sign up with **no** role — a Plant Admin must grant one via **Admin → Users & roles**.

### Bootstrap

1. Create your account via the sign-up tab on `/auth`.
2. Open Cloud → Tables → `user_roles` and insert a row: `user_id` = your auth user id, `role` = `PLANT_ADMIN`.
3. Sign out and back in. You can now grant roles to other users from the Admin screen.

## Database

The full schema is in the Cloud migration. Highlights:

- `departments`, `production_lines`, `machines`, `shifts`, `skill_categories`, `machine_skill_requirements`
- `associates`, `associate_skills`, `associate_availability`, `shift_allocations`
- `profiles`, `user_roles`, `audit_log`
- Enums for `app_role`, `skill_level`, `associate_category`, `associate_status`, `allocation_status`, `audit_action`
- `get_eligible_associates(date, shift_id, machine_id)` SQL function — eligibility engine
- `validate_shift_allocation` BEFORE INSERT/UPDATE trigger — enforces skill-match gate, availability gate, one-per-machine-per-shift, no-self-assignment, override-with-reason
- `audit_trigger()` on every mutable table — writes JSONB old/new snapshots + acting user

## Eligibility logic

`get_eligible_associates` returns associates who:
- are `ACTIVE` and not in `associate_availability` for the date/shift
- not already allocated on the date/shift
- hold every skill in `machine_skill_requirements` for the machine at or above min level, with valid (non-expired) certifications

Sorted: skill level DESC, prior deployments on machine DESC, name ASC. Returns `ELIGIBLE` or `ELIGIBLE_EXPIRING_SOON` (certs expiring within 30 days).

## Override flow

Overrides (status = `OVERRIDE`) bypass the skill and availability gates but require a non-empty `override_reason`. The DB enforces both. Override allocations are visible in the shift summary report.

## Audit

Every INSERT / UPDATE / DELETE on tracked tables writes to `audit_log` with old/new JSONB snapshots and `auth.uid()`. Read access is restricted to Plant Admin (no UI in the pilot — query via Cloud → Tables).

## Excel bulk upload

1. **Download template** at `/upload` — server-generated `.xlsx` listing all active skill codes on a reference sheet.
2. Fill columns: `employee_code | skill_code | skill_level | certified_on | expires_on | certified_by`.
3. Upload — every row is validated; commit only happens if all rows pass.

## Post-pilot roadmap (designed for, not built)

- Skill-gap heatmap (`/gap-analysis`)
- Override-log report UI
- Audit log UI
- Attendance integration
- Mobile app
- AI allocation suggestions
- Multi-plant rollout
- Realtime notifications

## Development

- Migrations: use Cloud's migration tool. Never edit `src/integrations/supabase/*` (auto-generated).
- Adding a new table: include `GRANT` to `authenticated` + `service_role`, enable RLS, and add policies. Add to the audit trigger list in a follow-up migration.
- Adding a new role-gated nav item: edit `src/components/AppShell.tsx` (`NAV` array).