# Frontend integration guide — Léo backend

Built page-by-page. Base URL (dev): `http://localhost:3000`.

**Auth:** off by default in dev (no token needed). When `RBAC_ENABLED=true`, log in via Supabase
and add `-H "Authorization: Bearer <jwt>"` to every call. Reads need any role
(operateur/direction); writes need operateur.

---

## 1. Dashboard (home KPIs)

The home screen's stat cards / charts come from **one call**.

### Endpoint
```
GET /api/dashboard
```

### curl
```bash
curl http://localhost:3000/api/dashboard
# with auth on:
curl http://localhost:3000/api/dashboard -H "Authorization: Bearer <jwt>"
```

### Response (live example)
```json
{
  "centres": { "total": 2, "by_statut": { "onboarding": 2 } },
  "dossiers": { "total": 2, "by_stage": { "installation_qualite": 2 } },
  "open_alerts": 0,
  "pending_reminders": 1,
  "pieces": { "total": 2, "verified": 2 }
}
```

### What each stat means
| Field | Meaning | Use for |
|---|---|---|
| `centres.total` | total number of centres | a "Centres" KPI card |
| `centres.by_statut` | centres grouped by status | a donut/bar by status |
| `dossiers.total` | total dossiers | KPI / pipeline total |
| `dossiers.by_stage` | dossiers grouped by pipeline stage | the pipeline funnel chart |
| `open_alerts` | unresolved blocage alerts | an "Alerts" badge (red if > 0) |
| `pending_reminders` | reminders still queued | a "Reminders" KPI |
| `pieces.total` / `pieces.verified` | documents stored / human-verified | a "Documents verified" progress (verified / total) |

### Possible category keys (so you can show all buckets, even at 0)
- **`centres.by_statut`** keys: `onboarding`, `audit`, `agrement_en_cours`, `ouvert`, `bloque`
- **`dossiers.by_stage`** keys: `signature_validee`, `plans_valides`, `installation_qualite`, `audit`, `depot_agrement`, `agrement_recu`, `ouverture`

⚠️ **Only non-zero buckets are returned.** A status/stage with 0 centres is **omitted** from the
object — so in the UI, initialize every bucket to `0` and overlay what the API returns. Example:
```ts
const STATUTS = ['onboarding','audit','agrement_en_cours','ouvert','bloque'];
const byStatut = Object.fromEntries(STATUTS.map(s => [s, data.centres.by_statut[s] ?? 0]));
```

### Notes
- Cheap counts — safe to poll/refresh on the dashboard (e.g. every 30–60 s) or on focus.
- All numbers are integers.

---

## 2. Centres page (list · add · edit · delete · detail)

One page to manage centres. 5 endpoints (all RBAC: list/detail = read, add/edit/delete = operateur).

### 2a. List — `GET /api/centres`
Query params (all optional): `status`, `q` (search code/enseigne), `limit` (default 50), `offset`.
```bash
curl 'http://localhost:3000/api/centres?status=onboarding&q=garage&limit=20&offset=0'
```
```json
{
  "centres": [
    { "id":"<uuid>", "code_centre":"CT-DEMO-1", "enseigne":"Garage du Lac", "ville":"Lyon",
      "type_contrat":"R", "activites":["VL"], "statut_ouverture":"onboarding",
      "created_at":"2026-06-06T...", "etape_pipeline":"installation_qualite" }
  ],
  "count": 1
}
```
`count` = total matching (for pagination). `etape_pipeline` = the centre's current dossier stage (or `null`).

### 2b. Detail — `GET /api/centres/:id` (COMPLETE centre data)
One call returns **everything** about a centre — powers the whole detail page (tabs:
Overview / Documents / Conversation / Reminders / Alerts / Activity).
```bash
curl http://localhost:3000/api/centres/<id>
```
```json
{
  "centre": {                              // ← full row (all columns)
    "id","code_centre","enseigne","ville","type_contrat","activites","statut_ouverture",
    "street","street2","zip","region","country","contacts_clients","created_at","whatsapp_phone_number_id"
  },
  "dossiers": [                            // ← ALL dossiers, with micro + macro + nav
    { "id","type_dossier","etape_pipeline","created_at",
      "statut_ouverture":"onboarding", "next_stage":"plans_valides", "prev_stage":null }
  ],
  "pieces": [                              // ← FULL piece rows
    { "id","type_piece","nom_fichier_origine","nom_fichier_canonique","drive_path",
      "drive_link":"https://drive.google.com/...","confiance_classification":1,
      "valide_par_humain":false,"validated_at":null,"created_at":"..." }
  ],
  "presentPieces": ["kbis"],               // doc-type names received
  "missingPieces": ["cni","rapport_audit_initial","..."],   // checklist gap
  "pieces_stats": { "present":1, "missing":9, "verified":0 },
  "messages":  [ { "id","sender","contenu","received_at" } ],   // WhatsApp conversation
  "alerts":    [ { "id","type","status","message","created_at","resolved_at" } ],  // open + resolved
  "reminders": [ { "id","piece_attendue","scheduled_at","status","message","kind" } ],
  "audit":     [ { "action","actor_type","actor_id","entity_type","entity_id","payload_apres","created_at" } ]  // last 50
}
```
**Tab → field map:** Overview = `centre` + `dossiers` + `pieces_stats` · Documents = `pieces` +
`missingPieces` (✅ present / ⬜ missing, each piece has a `drive_link` + `valide_par_humain`) ·
Conversation = `messages` · Reminders = `reminders` · Alerts = `alerts` · Activity = `audit`.
- `pieces[].drive_link` → clickable link to the file on Drive.
- `pieces[].valide_par_humain` → verified badge; verify via `POST /api/pieces/:id/verify`.
- `dossiers[]` carries micro (`etape_pipeline`) + macro (`statut_ouverture`) — move via the
  pipeline endpoint (§3).

### 2c. Add — `POST /api/centres`
Creates the centre **+ an initial dossier** (stage `signature_validee`).
```bash
curl -X POST http://localhost:3000/api/centres -H 'Content-Type: application/json' -d '{
  "code_centre": "CT-NEW-1",        // required, unique
  "enseigne": "Garage Neuf",
  "ville": "Nantes",
  "type_contrat": "R",              // R | P  (default R)
  "activites": ["VL","PL"],         // subset of VL|CL|PL (default ["VL"])
  "street": "1 rue X", "zip": "44000", "region": "Loire-Atlantique", "country": "France",
  "contacts_clients": { "responsable": "33600000000" }   // phone(s)/email for WhatsApp
}'
# → 201 { "centre": {…full row…}, "dossier_id": "<uuid>" }
# duplicate code_centre → 409 { "message": "code_centre already exists" }
```

### 2d. Edit — `PATCH /api/centres/:id`
Send only the fields you change. Editable: `code_centre, enseigne, ville, type_contrat, activites, street, street2, zip, region, country, contacts_clients, statut_ouverture`.
```bash
curl -X PATCH http://localhost:3000/api/centres/<id> -H 'Content-Type: application/json' \
  -d '{ "enseigne": "Garage Rénové", "ville": "Rennes" }'
# → 200 {…updated centre row…}   ·  404 if not found  ·  409 on code_centre clash
```

### 2e. Delete — `DELETE /api/centres/:id`
Removes the centre **and all its data** (dossiers, pieces, reminders, messages, alerts).
```bash
curl -X DELETE http://localhost:3000/api/centres/<id>
# → 200 { "id": "<id>", "deleted": true }   ·  404 if not found
```

### Page wiring
```
table      ← GET /api/centres (search/filter/paginate)
row click  ← GET /api/centres/:id (detail drawer)
"Add"      → POST /api/centres        → refresh list
"Edit"     → PATCH /api/centres/:id   → refresh row
"Delete"   → DELETE /api/centres/:id  → remove row (confirm first — it cascades!)
```
⚠️ Delete is **cascading and permanent** — confirm in the UI. Use `activites` (FR spelling) in
requests, matching what the list/detail return.

---

## 3. Pipeline page (dossiers · move stage · macro/micro status)

### The two statuses
- **Micro status** = `etape_pipeline` on the **dossier** — the 7 fine stages:
  `signature_validee → plans_valides → installation_qualite → audit → depot_agrement → agrement_recu → ouverture`
- **Macro status** = `statut_ouverture` on the **centre** — **derived** from the micro stage:

  | micro `etape_pipeline` | → macro `statut_ouverture` |
  |---|---|
  | signature_validee, plans_valides, installation_qualite | `onboarding` |
  | audit | `audit` |
  | depot_agrement, agrement_recu | `agrement_en_cours` |
  | ouverture | `ouvert` |

  (`bloque` is set separately by a blocage, not by a stage.)

👉 **You move the MICRO stage; the MACRO updates automatically.** Macro is read-only/derived —
the UI shows it but never sets it directly.

### 3a. List dossiers — `GET /api/dossiers`
Optional `stage`, `centre_id`, `limit`, `offset`. Each row has micro (`etape_pipeline`) + the
embedded centre (which carries macro `statut_ouverture`).
```bash
curl 'http://localhost:3000/api/dossiers?stage=audit&limit=200'
```
```json
{
  "dossiers": [
    { "id":"<uuid>", "etape_pipeline":"plans_valides", "type_dossier":"agrement_centre",
      "created_at":"...",
      "centre": { "id","code_centre","enseigne","ville","statut_ouverture":"onboarding" } }
  ],
  "count": 1
}
```
For a **kanban board**, fetch all and group by `etape_pipeline` (or call once per column with `?stage=`).

### 3b. One dossier — `GET /api/dossiers/:id`
```json
{ "id","centre_id",
  "etape_pipeline":"signature_validee",        // micro
  "statut_ouverture":"onboarding",             // macro (derived)
  "next_stage":"plans_valides", "prev_stage": null }
```
Use `next_stage`/`prev_stage` to enable/disable the move buttons (null = end of pipeline).

### 3c. Move the pipeline — `POST /api/dossiers/:id/advance-stage`
```bash
# advance one stage
curl -X POST http://localhost:3000/api/dossiers/<id>/advance-stage \
  -H 'Content-Type: application/json' -d '{"direction":"next"}'
# go back one stage
curl -X POST .../advance-stage -d '{"direction":"back"}'
```
```json
{ "id","from":"signature_validee","to":"plans_valides",
  "etape_pipeline":"plans_valides",            // new micro
  "statut_ouverture":"onboarding",             // new macro (auto-updated)
  "next_stage":"installation_qualite", "prev_stage":"signature_validee" }
```
The response gives the **new micro + new macro** → update the card without a refetch.

**Rules / errors:**
- Moves are **one step at a time** (`next` / `back`) — you can't skip stages (regulatory). An
  illegal jump → **422**; no next/prev from the end → **409**; missing dossier → **404**.
- The move is **atomic + audited**, and the centre's macro status updates in the same transaction.

### Page wiring
```
board/list ← GET /api/dossiers (group by etape_pipeline)
each card  → shows micro (etape_pipeline) + macro badge (centre.statut_ouverture)
"Advance"  → POST /api/dossiers/:id/advance-stage {direction:'next'} → update card (micro+macro from response)
"Back"     → {direction:'back'}
buttons enabled via next_stage / prev_stage (null = disabled)
```

---

## 4. Reminders page (see · add · edit · stop · delete)

Reminders chase the client for missing documents. Two kinds:
- **`auto`** — one **digest** reminder per dossier, created automatically on centre creation
  (first at +3 days, escalates +15 days, max 3; recomputes the missing list each time it fires;
  self-cancels when nothing is missing). `piece_attendue` is `null` for a digest.
- **`manual`** — created by an admin for a specific document (or a custom digest), with a custom
  or default message and a chosen time.

**Status values:** `pending` (scheduled) · `sent` · `cancelled` (stopped).

### 4a. List — `GET /api/reminders?dossier_id=&status=`
Both filters optional (omit `dossier_id` for all centres; e.g. `?status=pending`).
```bash
curl 'http://localhost:3000/api/reminders?dossier_id=<dossier_id>'
```
```json
{
  "reminders": [
    { "id":"<uuid>", "dossier_id":"<uuid>",
      "piece_attendue": null,                 // null = digest (all missing docs); else a doc type
      "scheduled_at":"2026-06-09T14:00:00Z",  // when it fires / fired
      "sent_at": null,
      "status":"pending",                     // pending | sent | cancelled
      "message": null,                        // null = default text; else custom
      "kind":"auto",                          // auto | manual
      "escalation": 0,                        // 0 = first, then 1,2 (+15d each, max 3)
      "created_at":"..." }
  ],
  "count": 1
}
```

### 4b. Add — `POST /api/reminders`
```bash
curl -X POST http://localhost:3000/api/reminders -H 'Content-Type: application/json' -d '{
  "dossier_id": "<dossier_id>",
  "piece": "kbis",                       // optional — omit/null = digest (all missing docs)
  "message": "Merci d'\''envoyer votre Kbis",  // optional — null = default text
  "scheduled_at": "2026-06-10T09:00:00Z" // ISO datetime (required)
}'
# → 201 { "id":"<uuid>", "jobId":"<uuid>", "scheduledAt":"2026-06-10T09:00:00Z", "action":"created" }
```

### 4c. Edit — `PATCH /api/reminders/:id`
Change time and/or message (only while `pending`; reschedules the job).
```bash
curl -X PATCH http://localhost:3000/api/reminders/<id> -H 'Content-Type: application/json' \
  -d '{ "scheduled_at":"2026-06-12T09:00:00Z", "message":"Rappel: Kbis attendu" }'
# → 200 {…updated reminder row…}  ·  404 if not found or not pending
```

### 4d. Stop — `POST /api/reminders/:id/stop`
Cancels it but keeps the row (status `cancelled`).
```bash
curl -X POST http://localhost:3000/api/reminders/<id>/stop
# → 200 { "id":"<id>", "status":"cancelled" }  ·  404 if not found
```

### 4e. Delete — `DELETE /api/reminders/:id`
Removes it entirely (and cancels its job).
```bash
curl -X DELETE http://localhost:3000/api/reminders/<id>
# → 200 { "id":"<id>", "deleted":true }  ·  404 if not found
```

### Page wiring
```
table   ← GET /api/reminders (?dossier_id= on a centre page, or all)
columns → piece_attendue (or "Digest"), scheduled_at, status, kind, message (or "default")
"Add"   → POST /api/reminders         → refresh
"Edit"  → PATCH /api/reminders/:id    (only pending)
"Stop"  → POST /api/reminders/:id/stop
"Delete"→ DELETE /api/reminders/:id
```
The centre detail (§2b) already embeds this dossier's `reminders` — so the Reminders tab can
render straight from there and use these endpoints for actions.

---

## 5. Alerts page (operator worklist)

Alerts flag things needing a human — chiefly **blocages** (the client is stuck / a step failed).
A blocage also sets the centre's macro status to `bloque`; **resolving it restores the previous
status and sends the client a "résolu" WhatsApp**.

### 5a. List — `GET /api/alerts?status=&centre_id=`
`status` = `open` (default) | `resolved`. `centre_id` optional.
```bash
curl 'http://localhost:3000/api/alerts?status=open'
```
```json
{
  "alerts": [
    { "id":"<uuid>", "centre_id":"<uuid>", "dossier_id":"<uuid>",
      "type":"blocage", "status":"open",
      "message":"Le client signale un blocage : …",
      "payload": { },                 // extra context (free-form)
      "created_at":"...", "resolved_at": null, "resolved_by": null }
  ],
  "count": 1
}
```

### 5b. Resolve — `POST /api/alerts/:id/resolve`
```bash
curl -X POST http://localhost:3000/api/alerts/<id>/resolve
# → 200 { "id":"<id>", "status":"resolved" }  ·  404 if not found or already resolved
```
Side effects: restores the centre's previous macro status (un-blocks it) and notifies the client.

### Page wiring
```
worklist ← GET /api/alerts?status=open      (badge count = dashboard.open_alerts)
row      → centre_id link (open the centre), message, created_at
"Resolve"→ POST /api/alerts/:id/resolve     → remove from open list
toggle   → ?status=resolved for history
```
The dashboard's `open_alerts` count and the centre detail's `alerts[]` come from the same data.

---

## 6. Folders config page (Drive routing)

Lets the client configure **which document type goes into which Drive folder**. Two things:
- **folders** — the Drive folder catalog (the "trays" documents are filed into).
- **routing** — the mapping `doc_key → folder_name` used when a document is classified.

`is_review: true` marks the human-review tray (e.g. `99_A_identifier`) where uncertain
classifications land.

### 6a. List — `GET /api/folders`
```bash
curl http://localhost:3000/api/folders
```
```json
{
  "folders": [
    { "id":"<uuid>", "name":"02_Administratif", "label":"Administratif",
      "sort_order":0, "is_review":false, "created_at":"..." }
  ],
  "routing": [
    { "doc_key":"kbis", "folder_name":"02_Administratif" },
    { "doc_key":"plan_masse", "folder_name":"03_Technique" }
  ]
}
```
Render two panels: the folder list (left) and the doc→folder mapping (right, one row per doc type).

### 6b. Add a folder — `POST /api/folders`
```bash
curl -X POST http://localhost:3000/api/folders -H 'Content-Type: application/json' -d '{
  "name": "05_Juridique",     // required, unique (the Drive folder name)
  "label": "Juridique",       // optional display label
  "sort_order": 4,            // optional ordering
  "is_review": false          // optional — true = a review tray
}'
# → 201 {…folder row…}  ·  409 if the name already exists
```

### 6c. Rename / reorder — `PATCH /api/folders/:id`
```bash
curl -X PATCH http://localhost:3000/api/folders/<id> -H 'Content-Type: application/json' \
  -d '{ "label":"Documents juridiques", "sort_order":2 }'
# → 200 {…folder row…}  ·  404 if not found
```
(Only `label` + `sort_order` are editable — the `name` is the Drive folder identity.)

### 6d. Re-point a document type — `PUT /api/folders/routing`
Change which folder a document type files into.
```bash
curl -X PUT http://localhost:3000/api/folders/routing -H 'Content-Type: application/json' \
  -d '{ "doc_key":"kbis", "folder_name":"05_Juridique" }'
# → 200 { "doc_key":"kbis", "folder_name":"05_Juridique" }
# → 400 if folder_name doesn't exist (create the folder first)
```

### Page wiring
```
GET  /api/folders              → render folders + routing
"Add folder"   → POST /api/folders
"Rename/order" → PATCH /api/folders/:id
"Route X → Y"  → PUT /api/folders/routing {doc_key, folder_name}
```
Changes take effect immediately — the next classified document uses the new routing.

---

## 7. RAG chatbot page (Léo Q&A)

A grounded Q&A box: ask in free text, get an answer **grounded in the real corpus** (the 78
centre conversations + the reference docs), **with citations**. One call.

### Ask — `POST /api/rag/ask`
```bash
curl -X POST http://localhost:3000/api/rag/ask -H 'Content-Type: application/json' -d '{
  "question": "Quels documents pour ouvrir un centre VL ?",
  "lang": "fr",        // optional: fr (default) | en
  "corpus": "mct"      // optional: mct (default) | all
}'
```
```json
{
  "answer": "Pour ouvrir un centre VL, les documents requis sont : Kbis, Rapport d'audit initial VL, Plan de masse (1/100 et 1/200), Cadastre, …",
  "sources": [
    "Source 1 — Listes documents Centre (formations), partie 1/4",
    "Source 2 — Etapes signature a agrement (listes_pieces), partie 1/2"
  ],
  "needsApproval": false
}
```

### Fields
| Field | Meaning |
|---|---|
| `answer` | the grounded French (or EN) answer — render as markdown |
| `sources` | citation strings (the docs/conversations the answer is based on) — show under the answer |
| `needsApproval` | **true** = the question touched a sensitive/regulatory topic → the answer should be **reviewed by a human before sending to a client** (show a warning banner, don't auto-send) |

### Page wiring
```
chat input → POST /api/rag/ask {question, lang}
render     → answer (markdown) + "Sources:" list
if needsApproval → show a "⚠️ à valider par un humain" banner
```
- `lang` follows the user's UI language (fr/en).
- Stateless — each call is independent (no thread id). Keep your own chat history client-side if
  you want a conversation view.
- This is the **same engine** that answers client `question` intents in WhatsApp, so testing here
  reflects what clients receive.

---

## 8. Documents page (pieces · verify · move · rename)

The documents a centre has sent — each classified, filed to Drive, and pending human
verification. Usually a tab on the centre detail (§2b already embeds `pieces` + `missingPieces`).

A `piece` row:
```json
{
  "id":"<uuid>", "dossier_id":"<uuid>", "type_piece":"kbis",
  "nom_fichier_origine":"kbis.pdf", "nom_fichier_canonique":"kbis.pdf",
  "drive_path":"02_Administratif", "drive_file_id":"1AbC…",
  "drive_link":"https://drive.google.com/file/d/1AbC…/view",
  "confiance_classification":1, "valide_par_humain":false,
  "rejet_raison":null, "validated_at":null, "created_at":"..."
}
```
- `drive_link` → open the file. `confiance_classification` < 0.80 → it was routed to the
  review tray (`99_A_identifier`) for a human to confirm/reclassify.
- `valide_par_humain` → the verified badge.

### 8a. List — `GET /api/pieces?dossier_id=&verified=`
```bash
curl 'http://localhost:3000/api/pieces?dossier_id=<dossier_id>&verified=false'
# → { "pieces": [ {…piece…} ], "count": 1 }
```
`verified` = `true` | `false` (omit for all).

### 8b. Stats — `GET /api/pieces/stats?dossier_id=`
```bash
curl 'http://localhost:3000/api/pieces/stats?dossier_id=<dossier_id>'
# → { "total": 1, "verified": 0, "unverified": 1 }
```

### 8c. One piece — `GET /api/pieces/:id`  → the piece (404 if missing)

### 8d. Verify — `POST /api/pieces/:id/verify`
Marks it human-validated **and sends the client a WhatsApp** ("✅ document vérifié — il reste …").
```bash
curl -X POST http://localhost:3000/api/pieces/<id>/verify
# → 200 {…piece, valide_par_humain:true, validated_at:…}  ·  404 if not found
```

### 8e. Move — `POST /api/pieces/:id/move`  (Drive + DB)
```bash
curl -X POST http://localhost:3000/api/pieces/<id>/move -H 'Content-Type: application/json' \
  -d '{ "folderPath": "02_Administratif" }'
# → 200 {…piece with new drive_path…}
```
Use this to reclassify a doc out of the review tray into its correct folder.

### 8f. Rename — `POST /api/pieces/:id/rename`  (Drive + DB)
```bash
curl -X POST http://localhost:3000/api/pieces/<id>/rename -H 'Content-Type: application/json' \
  -d '{ "newName": "kbis_garage_du_lac.pdf" }'
# → 200 {…piece with new nom_fichier_canonique…}
```

### 8g. Operator upload — `POST /api/centres/:id/documents` (no OCR)
The operator uploads a document **for any centre** and **provides the metadata themselves** — no
classification runs. Multipart `file`; everything else is query params:

| Query param | Required | Meaning |
|---|---|---|
| `type` | ✅ | the document type (one of the PIECE_TYPES, e.g. `kbis`, `cadastre`, `plan_masse`, … `autre`) |
| `folder` | — | target Drive folder name (default = the type's folder) |
| `name` | — | file name in Drive (default = the uploaded file's name) |
| `verified` | — | `true` to mark it already human-validated (default false) |

```bash
curl -X POST "http://localhost:3000/api/centres/<id>/documents?type=kbis&verified=true" \
  -F "file=@/path/to/kbis.pdf"
# → 201 { "piece": {…full piece…}, "drive_link":"https://drive.google.com/...",
#         "targetFolder":"02_Administratif", "mock":false }
# explicit folder + name:
curl -X POST ".../documents?type=cadastre&folder=99_A_identifier&name=cadastre.pdf" -F "file=@..."
# → 400 if "type" missing/invalid · 404 if the centre has no dossier
```
Files straight to Drive + saves the `pieces` row with the given type (confidence 1, no client
WhatsApp ack since the operator is filing it). Use this on the centre's Documents tab for an
"Upload document" button where the operator picks the type/folder/name.

### Page wiring
```
list    ← GET /api/pieces?dossier_id=   (✅ verified / ⏳ pending, drive_link per row)
"Upload"→ POST /api/centres/:id/documents?type=…  (operator picks type/folder/name; no OCR)
"Verify"→ POST /api/pieces/:id/verify   → badge ✅ + client notified
"Move"  → POST /api/pieces/:id/move {folderPath}     (e.g. from 99_A_identifier)
"Rename"→ POST /api/pieces/:id/rename {newName}
progress← GET /api/pieces/stats (verified / total)
```
*(Documents the **client** sends via WhatsApp DO get auto-OCR'd/classified — that's the
`simulate/whatsapp/document` / real webhook path. This operator endpoint skips OCR by design.)*

---

## 9. Drive browser page (read-only)

Browse the real Google Drive tree (the centre/document folders) — read-only.

### Folders — `GET /api/drive/folders?path=`
Empty `path` = root. Pass a folder name (or nested `A/B`) to go deeper.
```bash
curl 'http://localhost:3000/api/drive/folders'                  # root
curl 'http://localhost:3000/api/drive/folders?path=02_Administratif'
```
```json
{ "path": "", "folders": [ { "id":"1Nd1…", "name":"02_Administratif" }, … ] }
```

### Files — `GET /api/drive/files?path=`
```bash
curl 'http://localhost:3000/api/drive/files?path=02_Administratif'
```
```json
{ "path": "02_Administratif", "files": [ { "id":"1Yv0…", "name":"kbis.pdf" }, … ] }
```

### Page wiring
```
breadcrumbs + folder grid ← GET /api/drive/folders?path=<current>
file list                 ← GET /api/drive/files?path=<current>
folder click → set path = path ? `${path}/${name}` : name → refetch both
file click   → open https://drive.google.com/file/d/<file.id>/view
```
Read-only — there are no create/upload/delete Drive endpoints here (files arrive via the document
pipeline; folder *config* is §6). A file's link is `https://drive.google.com/file/d/<id>/view`.

---

## 10. Auth & Users (login · me · invite)

**Login is Supabase, authorization is our backend.** The frontend logs in via the Supabase
client; our backend verifies the JWT and resolves the role.

### Roles
- **`operateur`** — full access (all reads + writes, can invite users).
- **`direction`** — read-only (reads pass; writes → 403).

### Login / logout / session — **Supabase client** (not our API)
```ts
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY); // anon key = public, safe in browser

await supabase.auth.signInWithPassword({ email, password });    // login
const token = (await supabase.auth.getSession()).data.session?.access_token; // JWT
await supabase.auth.signOut();                                   // logout
```
Send `token` as `Authorization: Bearer <token>` on **every** `/api/*` call.

### 10a. Who am I — `GET /api/auth/me`
```bash
curl http://localhost:3000/api/auth/me -H "Authorization: Bearer <jwt>"
# → 200 { "id":"<uuid>", "email":"marie@mct.fr", "role":"operateur" }
# → 401 if no/invalid token
```
Call right after login → store `role` → gate the UI (hide write actions for `direction`).

### 10b. Invite a user — `POST /api/admin/users`  (operateur-only)
```bash
curl -X POST http://localhost:3000/api/admin/users -H 'Content-Type: application/json' \
  -H "Authorization: Bearer <operateur jwt>" \
  -d '{ "email":"marie@mct.fr", "role":"operateur" }'   # role: operateur | direction
# → 201 { "id":"<uuid>", "email":"marie@mct.fr", "role":"operateur", "invited":true }
# → 409 if the email already exists
# → 502 if the invite email couldn't be sent (SMTP not configured in Supabase)
```
The backend invites the user via Supabase (emails a set-password link) and stores their role in
`profiles`. The new user clicks the link, sets a password, then logs in via the Supabase client.

### New-user lifecycle
```
admin → POST /api/admin/users {email, role}     (your "Add user" screen)
backend → Supabase invite + profiles role
user → email link → set password (Supabase)
user → login (Supabase) → GET /api/auth/me → role → UI
```

### Notes
- **RBAC toggle:** `RBAC_ENABLED` is **off in dev** (no token needed) and **on/forced in prod**.
  Build against dev freely; flip it on to test the real token + role gating.
- **CORS:** set `CORS_ORIGINS` to your frontend URL.
- The invite email requires **SMTP configured in Supabase** (Auth → SMTP); without it, `POST
  /api/admin/users` returns 502 — for dev you can create users in the Supabase dashboard instead.

---

## 11. WhatsApp page (inbox + chat)

A WhatsApp-style two-pane page: **inbox** (all conversations on the left) + **chat** (the selected
centre's messages on the right).

### 11a. Inbox — `GET /api/conversations?q=&limit=&offset=`
One row per centre that has messages, **ordered by most-recent activity**, with a last-message
preview — exactly like WhatsApp's chat list.
```bash
curl 'http://localhost:3000/api/conversations?limit=50'
```
```json
{
  "conversations": [
    { "centre_id":"<uuid>", "code_centre":"CT-ROUTING-LAB", "enseigne":"Routing Test",
      "ville":"Paris", "statut_ouverture":"onboarding", "message_count":11,
      "last_message": { "sender":"leo", "contenu":"Merci, c'est bien noté ✅", "received_at":"..." } }
  ],
  "count": 2
}
```
`q` searches code/enseigne. Use `last_message` + `received_at` for the preview/timestamp, and
`statut_ouverture` for a status badge.

### 11b. Chat — `GET /api/centres/:id/messages?limit=`
The selected conversation (chronological).
```bash
curl 'http://localhost:3000/api/centres/<centre_id>/messages?limit=100'
# → { "messages":[ { "id","sender":"client"|"leo"|"interne","contenu","received_at" } ], "count": N }
```
Render `client` left / `leo` right (bubbles). Poll every ~2 s on the open chat to see Léo's
new replies arrive.

### Page wiring
```
left  ← GET /api/conversations        (chat list, sorted by last_message.received_at)
right ← GET /api/centres/:id/messages  (open chat; poll for new messages)
click a conversation → load its messages
```
- **Sending is automatic** — Léo replies to clients through the real pipeline; there's no
  "operator types a message" endpoint in prod. (In **dev/demo** you can inject a client message
  via `POST /api/simulate/whatsapp/message` — see `frontend-simulation.md`.)
- The per-centre chat also appears inside the centre detail (§2b `messages`).
