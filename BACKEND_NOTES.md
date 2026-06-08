# Backend Notes — routes the UI needs

Tracking backend work required by the **Review 2 (UI/UX)** redesign. The frontend
already has the UI built against these; each item links to where it's wired so you
only need to add the route and swap the marked `TODO(backend)` line.

> Convention: the client talks to the same-origin proxy `/api/leo/*`
> (see [lib/api.ts](lib/api.ts)). `api.del(path)` already exists — these notes are
> about the **backend endpoints** that proxy needs to forward to.

---

## 1. Bulk delete (tables: row selection + bulk deletion)

The global brief requires row selection + bulk deletion on all data tables. The
shared UI is built and wired into the **Dossiers** table as the reference:

- UI primitives: [components/ui/checkbox.tsx](components/ui/checkbox.tsx),
  [components/hooks/useRowSelection.ts](components/hooks/useRowSelection.ts),
  [components/ui/bulk-action-bar.tsx](components/ui/bulk-action-bar.tsx)
- Reference wiring: [components/DossiersView.tsx](components/DossiersView.tsx)
  → `handleBulkDelete` (currently removes rows from local state only).

**Needed routes** (one per deletable resource):

| Resource    | Suggested route                | Used by view            |
| ----------- | ------------------------------ | ----------------------- |
| Dossiers    | `DELETE /dossiers/{id}`        | DossiersView            |
| Centres     | `DELETE /centres/{id}`         | CentresView             |
| Validations | `DELETE /validations/{id}`     | ValidationsView         |
| Rappels     | `DELETE /reminders/{id}`       | RemindersView           |
| Utilisateurs| `DELETE /users/{id}`           | UsersView               |

Optional but preferred — a single batch route to avoid N requests:

```
POST /dossiers/bulk-delete   body: { ids: string[] }   → { deleted: string[] }
```

Once available, replace in each view:

```ts
// TODO(backend): await Promise.all([...ids].map((id) => api.del(`dossiers/${id}`)));
```

with the real call (and then refresh the context list instead of local filtering).

---

## 2. (placeholder for next phases)

Add further route needs here as the per-page redesign proceeds
(e.g. center field editing, validation bulk-approve, audit log feed).
