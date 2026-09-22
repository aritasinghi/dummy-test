# Task: Role-Based Access Setup + EFI Admin Landing Page Changes

## Context

The IFE project has three roles: **EFI_ADMIN**, **ISSUER_ADMIN**, and **PUBLIC**.
Ping/CIAM integration is planned for a later phase. For now, build the role
infrastructure with a temporary mock auth provider so navigation, routing, and
page access are already fully role-aware. When Ping is integrated later, only
the auth provider implementation should need to change — no component, route,
or navigation logic should require rework.

---

## Frontend Tasks

### 1. Role Constants & Config
- Create a single source of truth for roles: `EFI_ADMIN`, `ISSUER_ADMIN`, `PUBLIC`
  (e.g. a `roles.ts`/`roles.js` constants file — not magic strings scattered
  across components).
- Create a **route-to-role config** mapping each route/page to the role(s)
  allowed to access it.
- Create a **nav-item-to-role config** (label, path, icon, `allowedRoles`)
  driving what appears in navigation per role.

### 2. Auth Abstraction
- Build a `useAuth()` hook as the single source of truth for
  `{ user, roles, isAuthenticated }`.
- Implement a **temporary mock auth provider** (env variable or a dev-only
  role switcher UI) so all three roles can be tested end-to-end before Ping
  exists.
- Isolate the mock provider in **one file** so swapping in real Ping auth
  later is a single-file change. No component should ever import mock logic
  directly — everything goes through `useAuth()`.

### 3. Route Guarding
- Build a `ProtectedRoute` / `RoleGuard` component that checks
  `useAuth().roles` against the route's required roles from config.
- Redirect unauthorized users appropriately (e.g. to a "not authorized" page
  or the Public landing page).

### 4. Navigation
- Nav component reads from the nav config and filters items based on the
  current user's roles. No hardcoded per-role nav components or inline role
  checks inside the nav component itself.

### 5. EFI Admin Landing Page Changes
- [ ] *Fill in specific landing page changes here — e.g. card layout updates,
      permanent-subscription icon, client dropdown, organization selection
      entry point, statistical reports links, etc. Reference Figma screens
      if available.*
- Landing page sections/cards specific to `EFI_ADMIN` must only render for
  that role, using the same nav/route config pattern above — not separate
  hardcoded conditional logic.

---

## Backend Tasks

### 1. Role Model
- Define role enum/constants matching the frontend: `EFI_ADMIN`,
  `ISSUER_ADMIN`, `PUBLIC`.
- Add role to the user/session context model (even if currently
  mocked/hardcoded pending Ping integration).

### 2. Endpoint Authorization
- Secure EFI Admin–specific endpoints (organization management,
  contract/subscription CRUD, event log, statistical reports) to require the
  `EFI_ADMIN` role.
- Use Spring Security method-level or endpoint-level role checks
  (`@PreAuthorize` or equivalent) — centralized, not scattered manual `if`
  checks across controllers.
- Return proper `403 Forbidden` responses for role mismatches; no silent
  failures or generic 500s.

### 3. Mock Auth for Now
- Since Ping/CIAM isn't wired in yet, implement a temporary mechanism to
  simulate roles server-side (e.g. header-based role injection for
  dev/test only), clearly flagged/commented as temporary.
- Structure this so swapping in real Ping JWT/OAuth validation later only
  changes the token validation/role extraction layer — endpoint-level
  authorization logic (`@PreAuthorize` annotations, etc.) should not need
  to change.

### 4. API Contract for Landing Page
- [ ] *Fill in specifics — e.g. new/updated endpoints needed for EFI Admin
      landing page cards, organization list, subscription summary counts,
      etc.*

---

## Cross-Cutting Requirements

- Follow existing `AGENTS.md` code quality standards: lint clean (zero
  warnings), build passing, tests passing, vulnerability/dependency scan run
  before this is considered done.
- **Do not touch** `application-stg.yaml`, `application-prod.yaml`, or any
  staging/production config files as part of this work.
- **Translations**: any new UI text added for the EFI Admin landing page
  changes must be added to the translation files/keys — no hardcoded
  user-facing strings.
- Self-review the diff, run the build, run lint, run tests, and run a
  vulnerability scan before presenting this work as complete. State clearly
  which of these steps were run and their results.

---

## Acceptance Criteria

- [ ] All three roles (`EFI_ADMIN`, `ISSUER_ADMIN`, `PUBLIC`) can be simulated
      via the mock auth provider and tested end-to-end.
- [ ] Navigation correctly shows/hides items based on active role.
- [ ] Attempting to access a route not permitted for the current role
      redirects/blocks correctly.
- [ ] EFI Admin landing page changes are implemented and gated to the
      `EFI_ADMIN` role only.
- [ ] Backend endpoints for EFI Admin functionality reject non-`EFI_ADMIN`
      roles with `403`.
- [ ] No staging/production config files were modified.
- [ ] All new user-facing text is translated, not hardcoded.
- [ ] Lint, build, tests, and vulnerability scan all pass cleanly.
