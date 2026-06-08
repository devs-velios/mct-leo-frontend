# MCT‑Léo Frontend — UI Test Plan (manual / user‑story based)

How to use: run each test in order within a section. Each case has **Steps** and
**Expected**. Mark Pass/Fail in the box `[ ]`. "Network tab" = browser DevTools → Network
(filter `leo` to watch calls to `/api/leo/*`).

---

## 0. Preconditions / Setup

- [ ] Backend (Léo API) running on `http://localhost:3000`; frontend on `http://localhost:3001`.
- [ ] Frontend `.env` has `LEO_API_URL=http://localhost:3000`.
- [ ] A Supabase user exists. Note its role in `profiles` (`operateur` or `direction`).
- [ ] For the **Simulateur / Conversations send** flows, backend `SIMULATE_ENABLED=true`.
- [ ] For **role gating** tests, backend `RBAC_ENABLED=true` and you can log in as both an
      `operateur` and a `direction` user.
- [ ] Open DevTools → Network, filter on `leo`, keep it open throughout.

Legend: a request to `GET /api/leo/<x>` proves the UI hit the backend (not a stale cache).

---

## 1. Authentication

**US‑1 — As a user, I can log in and reach the dashboard.**
- [ ] Steps: Open `/`, enter valid email/password, submit.
- [ ] Expected: Redirect to `/dashboard`; no redirect back to `/`; your email shows in the sidebar/topbar.

**US‑2 — As a user, my session persists on refresh.**
- [ ] Steps: On `/dashboard`, hard‑refresh (Ctrl/Cmd+R).
- [ ] Expected: You stay on the dashboard (not bounced to login). Network shows `GET /api/auth/session` and/or feature loads.

**US‑3 — As a user, I can log out.**
- [ ] Steps: Click logout.
- [ ] Expected: Redirect to `/`. Visiting `/dashboard` directly redirects back to `/`.

---

## 2. Dashboard (home KPIs + charts + table)

**US‑4 — As an operator, I see live KPI cards.**
- [ ] Steps: Go to `/dashboard`.
- [ ] Expected: The 4 cards (Dossiers actifs, Pièces en attente, Rappels en attente, Centres ouverts) show numbers (not `…` forever). Network shows one `GET /api/leo/dashboard`.

**US‑5 — As an operator, charts reflect real data.**
- [ ] Steps: Observe the "Par phase" donut and legends.
- [ ] Expected: Donut segments/labels match centre statuses; total in the centre matches "Centres" count. (Charts + cards share ONE `dashboard` call — verify only one request fired, not two.)

**US‑6 — As an operator, the dashboard table lists real centres.**
- [ ] Steps: Observe the alerts/dossiers table.
- [ ] Expected: Rows correspond to real centres (enseigne/ville). Filters (tous/critiques/onboarding/agrément) narrow the list.

---

## 3. ⭐ Caching & backend reconciliation (the headline behavior)

These verify: (a) navigation reuses cache, (b) refresh reloads from backend,
(c) every mutation re‑pulls real data, (d) empty cache still loads.

**US‑7 — Navigating between pages reuses the cache (no refetch).**
- [ ] Steps: Open `/dashboard/alertes` (watch `GET /api/leo/alerts`). Go to `/dashboard/rappels`, then back to `/dashboard/alertes`.
- [ ] Expected: On the **return** visit, NO new `GET /api/leo/alerts?status=open` fires — the list renders instantly from cache.

**US‑8 — Hard refresh always reloads real data from backend.**
- [ ] Steps: On any page (e.g. `/dashboard/dossiers`), hard‑refresh.
- [ ] Expected: A fresh `GET /api/leo/dossiers?...` fires and the list repopulates (cache was cleared by reload, fallback to backend works).

**US‑9 — After a mutation, the cache reconciles with the backend.**
- [ ] Steps: On `/dashboard/alertes`, resolve an alert (see US‑16). Watch Network.
- [ ] Expected: After the `POST .../resolve`, a fresh `GET /api/leo/alerts?status=open` fires automatically (revalidate) and the list matches the backend (resolved item gone).

**US‑10 — Empty/error cache falls back to a real load.**
- [ ] Steps: Stop the backend, open `/dashboard/rappels` (load fails → error). Restart backend, navigate away and back to `/dashboard/rappels`.
- [ ] Expected: Because the previous load errored (not "loaded"), the page retries `GET /api/leo/reminders` and shows data once the backend is back.

**US‑11 — Centres list keeps its full size after a mutation (regression).**
- [ ] Steps: Note the dashboard table row count (driven by `centres?limit=200`). Open a centre, edit it (US‑13). Return to dashboard.
- [ ] Expected: Table still shows the full set (limit 200) — it did NOT shrink to ~50. (Revalidation re‑pulls the same slice.)

---

## 4. Dossiers (pipeline)

**US‑12 — As an operator, I see the pipeline and can switch table/kanban.**
- [ ] Steps: Open `/dashboard/dossiers`.
- [ ] Expected: KPI cards (Total/À relancer/Bloqués/Ouverts) + list. `GET /api/leo/dossiers?limit=200` fired once. Toggle Tableau/Kanban works; search + enseigne filter work.

**US‑13 — As an operator, I advance a dossier stage and see it reflected.**
- [ ] Steps: In the table, use the advance action (next) on a dossier.
- [ ] Expected: `POST /api/leo/dossiers/:id/advance-stage` fires, THEN a fresh `GET /api/leo/dossiers...` (revalidate); the row's phase updates to match the backend. (Advancing past the end / illegal jump shows no change, no crash.)

---

## 5. Validations (pieces)

**US‑14 — As an operator, I review the pieces queue with centre labels.**
- [ ] Steps: Open `/dashboard/validations`.
- [ ] Expected: Rows show code/enseigne/ville (joined from dossiers), doc type, IA confidence %, status (À identifier / À valider / Validé / Rejeté), Drive link when present. `GET /api/leo/pieces` + `GET /api/leo/dossiers` both fired.

**US‑15 — As an operator, I validate / move / rename a piece.**
- [ ] Steps: Click "valider" on a piece → confirm toast. Then use move (enter a folder) and rename (enter a name).
- [ ] Expected: `POST /pieces/:id/verify` (and `/move`, `/rename`) fire, each followed by a fresh `GET /api/leo/pieces` (revalidate). The piece's status flips to "Validé" / new folder/name reflected; the stats update.
- [ ] Negative (known limitation): "Rejeter" removes the row locally but there is **no backend reject** — after any subsequent revalidation the piece reappears. Confirm this matches expectation.

---

## 6. Alertes

**US‑16 — As an operator, I work the open‑alerts list and resolve items.**
- [ ] Steps: Open `/dashboard/alertes` (Ouvertes tab). Click "Résoudre" on one.
- [ ] Expected: Item disappears immediately (optimistic); `POST /alerts/:id/resolve` then a fresh `GET /api/leo/alerts?status=open` fire. Switch to "Résolues" tab → `GET /api/leo/alerts?status=resolved` fires and the resolved item appears there.

**US‑17 — Tab cache works per filter.**
- [ ] Steps: Toggle Ouvertes → Résolues → Ouvertes quickly.
- [ ] Expected: Each distinct filter fetches once; re‑selecting the same tab does not refetch (until a resolve mutation forces revalidation).

---

## 7. Rappels (reminders)

**US‑18 — As an operator, I list reminders.**
- [ ] Steps: Open `/dashboard/rappels`.
- [ ] Expected: Table of reminders (pièce, programmé, type, statut) OR the empty state. `GET /api/leo/reminders` fired.

**US‑19 — As an operator, I create a reminder.**
- [ ] Steps: "Créer un rappel" → pick a dossier (the dropdown is populated from the dossiers cache), optional pièce/message, set date/heure → submit.
- [ ] Expected: `POST /api/leo/reminders` then a fresh `GET /api/leo/reminders` (revalidate); new row appears with backend‑derived fields (kind/escalation).

**US‑20 — As an operator, I edit / stop / delete a reminder.**
- [ ] Steps: On a pending reminder use edit (date/message), then stop, then delete on another.
- [ ] Expected: `PATCH /reminders/:id`, `POST /reminders/:id/stop`, `DELETE /reminders/:id` each fire, each followed by a fresh `GET /api/leo/reminders`. Statuses/rows match the backend afterward.

---

## 8. Conversations (WhatsApp inbox)

**US‑21 — As an operator, I browse the inbox.**
- [ ] Steps: Open `/dashboard/conversations`.
- [ ] Expected: List of centres with last activity. `GET /api/leo/conversations` fired. Search + phase filter work.

**US‑22 — As an operator, I open a thread and see messages.**
- [ ] Steps: Click a conversation.
- [ ] Expected: `GET /api/leo/centres/:id/messages?limit=200` fires once; messages render (Léo left, client right). Re‑opening the same thread does NOT refetch (cached).

**US‑23 — As an operator, I send a client message and Léo's reply arrives (polling).** *(needs SIMULATE_ENABLED)*
- [ ] Steps: Type a message, send. Watch the chat + Network.
- [ ] Expected: Your message appears immediately (optimistic). `POST /simulate/whatsapp/message` fires, then a **"Léo écrit…"** typing indicator (animated dots) shows. The thread is **polled** (`GET .../messages` every ~2.5s, up to ~25s) and the inbox revalidates each tick; as soon as Léo's reply lands it renders and the typing indicator disappears. If Léo never replies, the indicator stops after the poll window (no infinite spinner).

**US‑24 — As an operator, I upload a document and see it loading in the chat.** *(needs SIMULATE_ENABLED)*
- [ ] Steps: Use the paperclip, pick a file. Watch the chat.
- [ ] Expected: The file appears in the chat **immediately** as a `📎 filename` bubble, plus an "Envoi du document…" row with a **spinner** while it uploads. `POST /simulate/whatsapp/document?centre_id=...` fires; when it completes the spinner clears and the thread is polled (like US‑23) so any OCR/Léo follow‑up appears. Inbox last‑message updates.

---

## 9. Dossiers Drive — folders (drive‑config)

**US‑25 — As an operator, I see folders + document routing.**
- [ ] Steps: Open `/dashboard/drive-config`.
- [ ] Expected: Folder list + routing list (doc_key → folder dropdown). `GET /api/leo/folders` fired.

**US‑26 — As an operator, I add a folder.**
- [ ] Steps: Enter name (+ optional label) → Ajouter.
- [ ] Expected: `POST /api/leo/folders` then a fresh `GET /api/leo/folders` (revalidate); new folder appears and is selectable in routing dropdowns. Duplicate name shows the inline error.

**US‑27 — As an operator, I rename a folder and re‑point a routing.**
- [ ] Steps: Pencil → new label; change a routing dropdown to another folder.
- [ ] Expected: `PATCH /folders/:id` and `PUT /folders/routing` fire, each followed by a fresh `GET /api/leo/folders`. Values match the backend after.

---

## 10. Drive (read‑only browser)

**US‑28 — As an operator, I browse the Drive tree.**
- [ ] Steps: Open `/dashboard/drive`. Click into a folder, then a sub‑folder, then use the breadcrumb to go back.
- [ ] Expected: Each NEW path fires `GET /drive/folders?path=...` + `GET /drive/files?path=...` once. Navigating BACK to an already‑visited path is instant (per‑path cache, no refetch). Files open Google Drive in a new tab.

---

## 11. Assistant (RAG chatbot)

**US‑29 — As an operator, I ask a regulatory question and get a sourced answer.**
- [ ] Steps: Open `/dashboard/assistant`. Click an example or type a question → send.
- [ ] Expected: Your turn shows, loader shows, then Léo's answer renders. `POST /api/leo/rag/ask` fired. If sources returned, they list under the answer; `needsApproval` shows the amber "à valider" note when set.

**US‑30 — Chat history persists across navigation.**
- [ ] Steps: After a Q&A, navigate to another page and back to `/dashboard/assistant`.
- [ ] Expected: The previous conversation is still visible (cached in context); no refetch.

---

## 12. Utilisateurs + role gating

**US‑31 — As an operator, I invite a user.** *(log in as operateur)*
- [ ] Steps: Open `/dashboard/utilisateurs`, enter email, pick role, submit.
- [ ] Expected: `POST /api/leo/admin/users` fires; success banner with the email/role. Duplicate → "déjà un compte" (409); SMTP not configured → the 502 message.

**US‑32 — As direction (read‑only), invite is blocked in the UI.** *(log in as direction, RBAC on)*
- [ ] Steps: Open `/dashboard/utilisateurs`.
- [ ] Expected: A grey "Accès en lecture seule…" banner shows and the "Inviter" button is **disabled**. (Backend also returns 403 if forced.)

**US‑33 — As direction, reads still work.**
- [ ] Steps: Browse dashboard, dossiers, validations, alertes, conversations.
- [ ] Expected: All lists load (read endpoints succeed). Write actions that hit the backend return errors handled gracefully (toast/inline), no crash.

---

## 13. Simulateur (Odoo) *(needs SIMULATE_ENABLED)*

**US‑34 — As an operator, I simulate a won deal.**
- [ ] Steps: Open `/dashboard/simulateur`, click a preset (or fill the form) → "Créer le centre".
- [ ] Expected: `POST /api/leo/simulate/odoo` fires; success banner shows the new `centre_id`. Error path shows the red message.

**US‑35 — The new centre shows up across the app.**
- [ ] Steps: After US‑34, go to `/dashboard` (or `/dashboard/dossiers`).
- [ ] Expected: The newly created centre appears in the list. (If it was already cached, a refresh or a mutation‑triggered revalidation surfaces it.)

---

## 14. Carte

**US‑36 — As an operator, I see the map view.**
- [ ] Steps: Open `/dashboard/carte`.
- [ ] Expected: Page loads without error; KPI counts by phase render. `GET /api/leo/centres?limit=200` fired (shared with dashboard cache).
- [ ] Note (known limitation): only centres geocoded with lat/long are plotted as pins; the list endpoint returns no coordinates, so the map may show no pins — this is expected, not a bug.

---

## 15. Centre detail (drill‑in)

**US‑37 — As an operator, I open a centre's full detail.**
- [ ] Steps: From dashboard table or carte, open a centre/dossier.
- [ ] Expected: `GET /api/leo/centres/:id` fires; detail (pieces, messages, reminders, alerts, audit) renders.

**US‑38 — As an operator, I edit a centre and the list stays in sync.**
- [ ] Steps: Edit enseigne/ville.
- [ ] Expected: `PATCH /centres/:id` then a fresh `GET /api/leo/centres?limit=200` (revalidate) + detail reload. The dashboard table row reflects the new value when you return.

**US‑39 — As an operator, I upload a missing piece.**
- [ ] Steps: Use the upload control for a missing doc type, pick a file.
- [ ] Expected: Upload fires; detail re‑pulls (the piece appears / stats update) and the centres list slice revalidates.

**US‑40 — As an operator, I delete a centre.**
- [ ] Steps: Delete, confirm the dialog.
- [ ] Expected: `DELETE /centres/:id` fires, detail closes; the centre is gone from the dashboard list (cache reconciled).

---

## 16. Cross‑cutting / negative checks

- [ ] **No console errors** on any page (React/runtime).
- [ ] **Loading states**: each list shows a spinner/skeleton then content (no permanent spinner).
- [ ] **Empty states**: alertes/rappels/assistant/drive show their designed empty UI when there's no data.
- [ ] **Auth gate**: with no session, every `/dashboard/*` URL redirects to `/`.
- [ ] **Backend down**: lists show graceful empty/error (no white screen); recovering the backend + revisiting reloads data.

---

## Known limitations to confirm (not bugs)
1. Validations **Rejeter** is client‑side only (no backend endpoint) → piece reappears after revalidation.
2. **Utilisateurs** has no list (invite‑only) — backend exposes no GET users.
3. **Carte** pins require lat/long the list endpoint doesn't return → may show no pins.
4. **Simulateur / Conversations send / upload** require `SIMULATE_ENABLED=true` on the backend, else 404.
