# Review 2: UI & UX

UI redesign brief for the Léo (MCT) app, to be implemented by the dev team. Each checkbox = a specific task. Checked = done. Also read the project's "Business Model" page (centers, files, documents, pipeline) and the "Web Interface" page in the project Notion.

## 21st.dev Components to Integrate (check = pull)

- [ ] Sidebar with submenu: side navigation by module.
- [ ] Contacts table with modal: for Files / Validations / Centers tables.
- [ ] Donut chart: Dashboard distribution donuts.
- [ ] Funnel chart: Dashboard pipeline view and document tracking.
- [ ] Calendar (presets): Dashboard period selector (24h / 7d / 30d / 90d / 1 year).
- [ ] Alert dialog (with icon): confirmation before deleting rows.
- [ ] Popover select with search: multi-select with search for filters.

## Detailed UI Redesign Checklist by Page

### Global (applies to all pages)

- [ ] Real-time updates, no full-page reloads.
- [ ] Reduce page loading time.
- [ ] 100% French language in the UI.
- [ ] Colors must match the official brand guidelines exactly.
- [ ] Only one search bar per page.
- [ ] Standardize typography and KPI cards.
- [ ] Reduce animation durations.
- [ ] Remove the "brands" filter everywhere.
- [ ] Tables: row selection + bulk deletion.
- [ ] Use a single empty-value placeholder.
- [ ] Remove all Asana references.
- [ ] Accessibility improvements and console warning cleanup.

### Dashboard

- [ ] 5 KPI cards at the top.
- [ ] 1 large full-width chart with period selector.
- [ ] Remove the "Files by stage" bar chart.
- [ ] 1 pipeline view (center level).
- [ ] 2 distribution donuts.
- [ ] 1 "Document Tracking" block.
- [ ] 1 "Reminders by Due Date" chart.
- [ ] Specific page layout structure.
- [ ] Explicit empty states when data is missing.

### Files (List)

- [ ] Clicking a center opens the CENTER PROFILE, not a file.
- [ ] Display required columns.
- [ ] Replace brand filter with proper filters.
- [ ] Bulk selection, deletion, and pagination.
- [ ] Reduce font weight in tables.
- [ ] Keep Kanban view here.

### File Details

- [ ] Remove the "MCT Partner" badge.
- [ ] Allow editing of all center fields.
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
- [ ] Bulk validation for high-confidence clusters.

### Map

- [ ] Reduce onboarding marker glow.
- [ ] Remove the "Recent Activity" KPI card.
- [ ] List all onboarding centers below the map.
- [ ] One point = one center.

### Reminders

- [ ] Automatic response detection.
- [ ] Replace table with cards.
- [ ] Remove strange building icon.
- [ ] Define card content.
- [ ] Display reminder details.
- [ ] Show associated file.
- [ ] Display pending and sent statuses.
- [ ] Reminder type J+7 / J+15 / J+30.

### Centers

- [ ] Remove brand filter.
- [ ] Bulk selection, deletion, and pagination.
- [ ] Display active files/controllers count.
- [ ] New tab-based view.

### Conversations / Assistant / Users / Drive

- [ ] Place Assistant, Drive, Users, Simulator, Operations at bottom of menu.
- [ ] Conversations: distinguish client / internal / Léo.
- [ ] Assistant: only for RAG testing.
- [ ] Users: email + password login and role management.
- [ ] Drive/Documents: search bar and Drive integration.

### Screens to Create

- [ ] Management View + multi-file heat map.
- [ ] Controllers View.
- [ ] Internal Stakeholders / Whitelist View.
- [ ] "RAG Pending Validation" queue.
- [ ] Audit Log View.

### Restructuring: One Center = Multiple Files

- [ ] Controller discovery workflow.
- [ ] Three interface levels.
- [ ] Center-focused files list and Kanban.
- [ ] Validation linked to specific files.
- [ ] Reminder linked to center + file + document.
- [ ] Map unchanged.
- [ ] Display file count per center.

### Data Model Extensions

- [ ] Extend `pipeline_stage` to 6 business phases.
- [ ] Extend `document_type` with additional document categories.
- [ ] Extend `file_type` with acquisition and controller scenarios.
- [ ] Correct activities from VL/Moto/PL to VL/CL/PL.
- [ ] Add new entities and internal stakeholder table.

### Answers to Baptiste's Questions

- [ ] The 6 phases are confirmed.
- [ ] Macro status vs journey clarification.
- [ ] Journey vs pipeline board clarification.
