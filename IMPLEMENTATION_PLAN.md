# Backend → Frontend Implementation Plan

> **STATUS: SHIPPED.** All feature modules built (`lib/features/*`), every view wired to a
> cached context, `AppProviders` mounted in the dashboard layout, role-awareness added.
> `tsc --noEmit` clean and `next build` green (20 routes). See "Delivered" at the bottom.


End-to-end wiring of the Léo backend API into the Next.js frontend using the
`lib/features/<feature>/` pattern, with a **Context provider per feature for caching**.

> Constraint: **the backend is read-only** — we do not modify anything under `apps/backend`.
> Constraint: this is a non-standard **Next.js 16.2.6** fork — read `node_modules/next/dist/docs/`
> before writing route/server code (per `AGENTS.md`).

## Decisions (locked)
- **Caching:** Lazy + shared. All feature providers mount once in the dashboard layout,
  but each only fetches on first `ensureLoaded()` call from a page. State is cached across
  navigation; mutations call `refresh()` or patch local state.
- **Refactor scope:** Refactor existing ad-hoc fetches (centres in layout, `AnalyticsCards`,
  dossiers) onto the new cached providers for consistency.

## How the frontend talks to the backend
Browser → same-origin `/api/leo/*` (via `lib/api.ts`) → Next route handler
`app/api/leo/[...path]/route.ts` attaches `mct_token` cookie as `Authorization: Bearer` →
backend `/api/*`. No direct browser→backend calls. Auth user comes from `useAuth`
(`GET /api/auth/me`); role (`operateur` write / `direction` read-only) gates write UI.

## Canonical feature template (6 files)
```
lib/features/<feature>/
  types.ts               DTOs + State + Status ("idle"|"loading"|"loaded"|"error")
  api.ts                 calls via api.get/post/patch/del to /api/leo/*
  <feature>Reducer.ts    discriminated-union actions + initial*State
  use<Feature>.ts        reducer+api orchestration, mountedRef, ensureLoaded() cache-guard
  <Feature>Provider.tsx  Context = the cache; lazy load; exposes state + actions + refresh
  index.ts               barrel export
```
Cache guard added to every hook:
```ts
const ensureLoaded = useCallback(async () => {
  if (state.status === "loaded" || state.status === "loading") return;
  await refresh();
}, [state.status, refresh]);
```

## Page → feature → endpoint map
| Page | Feature | Backend endpoints |
|---|---|---|
| `/` dashboard | `dashboard` (exists) | `GET /dashboard` |
| `/dossiers` | `dossiers` (new) | `GET /dossiers`, `GET /dossiers/:id`, `POST /dossiers/:id/advance-stage` |
| `/validations` | `pieces` (new) | `GET /pieces`, `/pieces/stats`, `/pieces/:id`, `:id/move`, `:id/rename`, `:id/verify` |
| `/carte` | `centres` (reuse) | `GET /centres` |
| `/conversations` | `conversations` (new) | `GET /conversations`, `GET /centres/:id/messages` |
| `/alertes` | `alerts` (new) | `GET /alerts`, `POST /alerts/:id/resolve` |
| `/rappels` | `reminders` (new) | `GET/POST/PATCH /reminders`, `:id/stop`, `DELETE /reminders/:id` |
| `/assistant` | `assistant` (new) | `POST /rag/ask`, `POST /ai/interpret` |
| `/drive` | `drive` (new) | `GET /drive/folders`, `GET /drive/files` |
| `/drive-config` | `folders` (new) | `GET/POST/PATCH /folders`, `PUT /folders/routing` |
| `/utilisateurs` | `users` (new) | `POST /admin/users` — ⚠️ no list endpoint |
| `/simulateur` | `simulate` (new) | `POST /simulate/odoo`, `/whatsapp/message`, `/whatsapp/document` |
| (upload flows) | `documents` (new) | `POST /documents/analyze` |
| `/fonctionnement` | static | none |
| centres detail | `centres` (exists, +Provider) | full detail endpoint |

## Known gaps / flags
- **`/utilisateurs`**: backend exposes only `POST /admin/users` (invite). No GET list →
  page is invite-only unless we list users via Supabase admin. Flag to product.
- **centres** currently has a hook but no Provider → no cross-page cache. Adding one.

## Phases
0. Foundations: read Next 16 docs; verify `LEO_API_URL`; finalize 6-file template + cache guard.
1. `AppProviders.tsx` composing all providers (lazy+shared); mount in `app/dashboard/layout.tsx`.
2. Build features (read-first, then mutating): centres → dossiers → pieces → alerts →
   reminders → conversations → folders → drive → assistant → users → simulate/documents.
3. Cross-cutting: role gating; consistent loading/empty/error states; scoped polling
   (dashboard + alerts live, rest cache-until-refresh).
4. Verify: `tsc`, lint, manual click-through of each page against the running backend.

## Delivered (build verified)
Feature modules under `lib/features/` — each `types/api/reducer/hook/Provider/index`:
`dashboard` (existing), `centres` (added Provider), `dossiers`, `pieces`, `alerts`,
`reminders`, `conversations`, `folders`, `drive`, `assistant`, `users`, `simulate`,
`documents`, plus `auth/RoleProvider`. Composed in `lib/features/AppProviders.tsx`,
mounted once in `app/dashboard/layout.tsx`.

Views repointed from ad-hoc `api.*`/mock data to cached contexts: AnalyticsCards, Charts,
AlertsView, RemindersView, DossiersView, ValidationsView, ConversationsView, FoldersView,
DriveView, AssistantView, UsersView, SimulateOdooView, CarteView, DossierDetailsView, and
the dashboard layout's centres load.

Caching: lazy `ensureLoaded()` guard (param-keyed where filters apply: alerts/dossiers/
pieces/reminders/conversations; path-keyed for drive). Mutations patch the cache in place
or refresh. Dashboard provider is the eager+polling exception.

### Backend-contract corrections found while wiring (backend left untouched)
- `pieces/queue` and `pieces/:id/reject` do **not** exist → pieces feature uses real
  `GET /pieces` + status derived from `valide_par_humain`/`rejet_raison`/confidence;
  centre labels joined via the dossiers cache; reject is client-side `dropLocal` only.
- `GET /folders` `routing` is an **array** of `{doc_key, folder_name}` (not an object map).
- `rag/ask` `sources` is `string[]` (not objects).
- centres **list** endpoint returns no `latitude/longitude` → the carte only plots geocoded
  centres (unchanged behaviour; now fed from the shared cache).
- `/utilisateurs` is **invite-only** (no GET-list endpoint) — flagged in the users feature.

### Role gating
`auth/RoleProvider` fetches `GET /auth/me` → `{ role, canWrite }`. `canWrite` is wired into
the Users invite page (operateur-only endpoint) as the representative gate; `useRole()` is
available for any other view. Backend RBAC still enforces `direction` = read-only regardless.
