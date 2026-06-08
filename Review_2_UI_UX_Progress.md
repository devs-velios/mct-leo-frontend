# Review 2: UI & UX — Progress Tracker

> Copy of the redesign brief annotated with implementation status.
> `[x]` = done · `[ ]` = not started.
> 💬 = note (often a backend dependency — see [BACKEND_NOTES.md](BACKEND_NOTES.md)).
> Last updated by the frontend pass on the **Global** section.

## 21st.dev Components to Integrate (check = pull)

- [ ] Sidebar with submenu: side navigation by module.
- [ ] Contacts table with modal: for Files / Validations / Centers tables.
- [ ] Donut chart: Dashboard distribution donuts.
- [ ] Funnel chart: Dashboard pipeline view and document tracking.
- [x] Alert dialog (with icon): confirmation before deleting rows. 💬 Used by the new bulk-delete bar via the on-brand `useDialog().confirm({ danger })`.
- [ ] Calendar (presets): Dashboard period selector (24h / 7d / 30d / 90d / 1 year).
- [ ] Popover select with search: multi-select with search for filters.

## Detailed UI Redesign Checklist by Page

### Global (applies to all pages)

- [ ] Real-time updates, no full-page reloads. 💬 Deferred — architectural (per-view data fetching/SWR).
- [ ] Reduce page loading time. 💬 Deferred — needs perf profiling.
- [ ] 100% French language in the UI. 💬 Deferred — full string audit pending.
- [x] Colors must match the official brand guidelines exactly. 💬 All hex swapped across 48 files to exact palette (orange `#E34F2D`, indigo `#332151`, + light/dark variants); named tokens added in `app/globals.css`.
- [ ] Only one search bar per page. 💬 Deferred — per-page dedupe.
- [x] Standardize typography and KPI cards. 💬 New canonical `components/ui/kpi-card.tsx` (KpiCard + KpiCardGrid); `AnalyticsCards` refactored onto it. Typography scale unified on KPI tiles.
- [x] Reduce animation durations. 💬 Interaction/entrance transitions shortened (Tailwind 1000/500/300 → 300/200/200; CSS hovers 0.3–0.9s → 0.2–0.5s). Ambient loops left intentionally.
- [ ] Remove the "brands" filter everywhere. 💬 Blocked — couldn't locate a literal vehicle-brand filter; need a pointer to the exact dropdown/page.
- [x] Tables: row selection + bulk deletion. 💬 Reusable primitives built (`ui/checkbox`, `hooks/useRowSelection`, `ui/bulk-action-bar`) + wired into the Dossiers table. ⚠️ **Waiting on backend**: delete is UI-only (local removal) — needs DELETE routes, see [BACKEND_NOTES.md](BACKEND_NOTES.md) §1. Still to extend to Centres/Validations/Reminders/Users tables.
- [x] Use a single empty-value placeholder. 💬 Standardized on "Non disponible" via `na()` helper; fixed the stray "—" in CentresView.
- [x] Remove all Asana references. 💬 None existed — already clean.
- [ ] Accessibility improvements and console warning cleanup. 💬 Partial — new components are a11y-friendly (role=checkbox, aria, focus rings); pre-existing `set-state-in-effect` lint warnings remain.

### Dashboard  ✅ complete

- [x] 5 KPI cards at the top. 💬 `AnalyticsCards` → single divided `ui/stats.tsx` strip (shadcn Card + `divide-x`): Dossiers / Centres / Pièces / Rappels / Alertes (highlighted when >0). Icon + value only — label shown on hover via `ui/Tooltip`.
- [x] 1 large full-width chart with period selector. 💬 `dashboard/TrendChart.tsx` — area chart of new dossiers with 24h / 7j / 30j / 90j / 1an segmented selector (re-buckets `created_at`).
- [x] Remove the "Files by stage" bar chart. 💬 Old recharts bar chart deleted from `Charts.tsx`.
- [x] 1 pipeline view (center level). 💬 `dashboard/PipelineKanban.tsx` — Kanban board with one column per regulatory stage (Signature validée → … → Ouverture), centres as cards grouped by `etape_pipeline`; clickable cards open the centre.
- [x] 2 distribution donuts. 💬 `dashboard/DistributionDonuts.tsx` — "Centres par statut" + "Dossiers par phase".
- [x] 1 "Document Tracking" block. 💬 `dashboard/DocumentTracking.tsx` — pièces reçues/à valider/validées + validation progress bar.
- [x] 1 "Reminders by Due Date" chart. 💬 `dashboard/RemindersByDueDate.tsx` — pending reminders bucketed En retard / Aujourd'hui / ≤7j / ≤30j / Plus tard.
- [x] Specific page layout structure. 💬 KPIs → full-width trend → pipeline → 2 donuts → (doc tracking + reminders). Shared `dashboard/Panel.tsx` shell.
- [x] Explicit empty states when data is missing. 💬 Shared `EmptyState` (icon + message + hint) used by every block.

### Files (List)  ✅ complete

- [x] Clicking a center opens the CENTER PROFILE, not a file. 💬 New `app/dashboard/centres/[id]/page.tsx` → dedicated minimal `centres/CentreDetailView.tsx` (all centre info: identity, adresse, dossiers, pièces). Centres-list button renamed "Voir le détail"; layout navigation routes centre clicks straight to `/dashboard/centres/:id`.
- [x] Display required columns. 💬 Centre (name + code) · Ville (own column) · Phase · Créé le · Action.
- [x] Replace brand filter with proper filters. 💬 Removed the dead *enseigne* dropdown (backend rows were all "Indépendant"); replaced with a working **Phase** filter using the prebuilt `ui/Select`.
- [x] Bulk selection, deletion, and pagination. 💬 Row select + `BulkActionBar` + pagination wired. ⚠️ delete is UI-only — backend route pending (BACKEND_NOTES §1).
- [x] Reduce font weight in tables. 💬 Rows lightened (extrabold/bold → semibold/medium/normal); phase badge is now a single neutral pill (no emerald/amber).
- [x] Keep Kanban view here. 💬 Tableau ⇄ Kanban toggle retained; Kanban cards also open the centre profile.

### File Details

- [ ] Remove the "MCT Partner" badge.
- [ ] Allow editing of all center fields. 💬 Will need backend PATCH for center fields.
- [ ] Update layout.
- [ ] Display center files list.
- [ ] Only one pipeline visualization.
- [ ] Conditional document checklist.
- [ ] Drive link and document history per document.
- [ ] Display stakeholders.
- [ ] Actions panel.
- [ ] Remove dead code `toggleDocStatus`.

### Validations

- [ ] Context: all incoming documents requiring validation.
- [ ] Remove "Advanced Filters" block.
- [ ] Only one search bar.
- [ ] Reorder columns.
- [ ] Display the linked file.
- [ ] Conditional action buttons.
- [ ] Keep AI confidence score.
- [ ] Complete document type labels.
- [ ] Bulk validation for high-confidence clusters. 💬 Will need a bulk-approve backend route.

### Map

- [ ] Reduce onboarding marker glow.
- [ ] Remove the "Recent Activity" KPI card.
- [ ] List all onboarding centers below the map.
- [ ] One point = one center.

### Reminders

- [ ] Automatic response detection. 💬 Backend dependency.
- [ ] Replace table with cards.
- [ ] Remove strange building icon.
- [ ] Define card content.
- [ ] Display reminder details.
- [ ] Show associated file.
- [ ] Display pending and sent statuses.
- [ ] Reminder type J+7 / J+15 / J+30.

### Centers

- [ ] Remove brand filter. 💬 Need pointer to the exact filter.
- [ ] Bulk selection, deletion, and pagination. 💬 Selection primitives ready; delete needs backend route (BACKEND_NOTES §1).
- [ ] Display active files/controllers count.
- [ ] New tab-based view.

### Conversations / Assistant / Users / Drive

- [ ] Place Assistant, Drive, Users, Simulator, Operations at bottom of menu.
- [ ] Conversations: distinguish client / internal / Léo.
- [ ] Assistant: only for RAG testing.
- [ ] Users: email + password login and role management. 💬 Backend auth/roles dependency.
- [ ] Drive/Documents: search bar and Drive integration. 💬 Drive integration is a backend dependency.

### Screens to Create

- [ ] Management View + multi-file heat map.
- [ ] Controllers View.
- [ ] Internal Stakeholders / Whitelist View.
- [ ] "RAG Pending Validation" queue.
- [ ] Audit Log View. 💬 Backend audit-log feed dependency.

### Restructuring: One Center = Multiple Files

- [ ] Controller discovery workflow.
- [ ] Three interface levels.
- [ ] Center-focused files list and Kanban.
- [ ] Validation linked to specific files.
- [ ] Reminder linked to center + file + document.
- [ ] Map unchanged.
- [ ] Display file count per center.

### Data Model Extensions  💬 All backend — schema/migrations required.

- [ ] Extend `pipeline_stage` to 6 business phases.
- [ ] Extend `document_type` with additional document categories.
- [ ] Extend `file_type` with acquisition and controller scenarios.
- [ ] Correct activities from VL/Moto/PL to VL/CL/PL.
- [ ] Add new entities and internal stakeholder table.

### Answers to Baptiste's Questions

- [ ] The 6 phases are confirmed.
- [ ] Macro status vs journey clarification.
- [ ] Journey vs pipeline board clarification.
