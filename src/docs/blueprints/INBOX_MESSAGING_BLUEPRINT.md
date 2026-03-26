# Inbox Messaging System — Architecture Blueprint

> Status: planning-complete, ready-to-implement
> Last updated: 2026-03-21
> Author: Claude Code + Marcus

---

## 1. Concept Summary

The Inbox is Neuron OS's **internal cross-department communication layer** — think internal email with system entity attachments and a thread model. It replaces the old ticket-centric view entirely.

**Core model:** A user composes a *message* → addresses it to one or more people and/or departments → optionally links system entities (Inquiry, Booking, etc.) and uploads files → recipients see it in their Inbox and reply in a shared thread → the original sender resolves it when done.

**UX inspiration:** Linear (clean list, keyboard-first feel) + Slack (threaded view, bottom composer) — built with Neuron's design tokens.

---

## 2. Database Schema — 6 Tables

### 2.1 `tickets` — Thread container (metadata only)

```sql
CREATE TABLE tickets (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject         text NOT NULL,
  type            text NOT NULL CHECK (type IN ('fyi', 'action_required', 'urgent')),
  status          text NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft', 'open', 'pending', 'resolved', 'archived')),
  created_by      uuid REFERENCES users(id) NOT NULL,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  last_message_at timestamptz DEFAULT now(),  -- drives inbox sort order
  resolved_at     timestamptz,
  resolved_by     uuid REFERENCES users(id)
);
```

**Key note:** No `body` on this table. The opening message is the first record in `ticket_messages`.

---

### 2.2 `ticket_participants` — Who is in the thread

```sql
CREATE TABLE ticket_participants (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id        uuid REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
  participant_type text NOT NULL CHECK (participant_type IN ('user', 'department')),
  user_id          uuid REFERENCES users(id),      -- set if participant_type = 'user'
  department       text,                            -- set if participant_type = 'department'
  role             text NOT NULL CHECK (role IN ('sender', 'to', 'cc')),
  added_by         uuid REFERENCES users(id) NOT NULL,
  added_at         timestamptz DEFAULT now(),

  CONSTRAINT chk_participant_target
    CHECK (
      (participant_type = 'user' AND user_id IS NOT NULL AND department IS NULL) OR
      (participant_type = 'department' AND department IS NOT NULL AND user_id IS NULL)
    )
);
```

**Logic:**
- `sender` = the person who composed it (always 1 row, participant_type = 'user')
- `to` = direct recipients (person or dept — multiple allowed)
- `cc` = copied (person or dept — multiple allowed)
- When a dept is targeted, Neuron queries users in that dept with role = 'manager' and shows it to all of them

---

### 2.3 `ticket_assignments` — Dept ticket handed to a specific rep

```sql
CREATE TABLE ticket_assignments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id     uuid REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
  department    text NOT NULL,                   -- which dept received the ticket
  assigned_to   uuid REFERENCES users(id) NOT NULL,
  assigned_by   uuid REFERENCES users(id) NOT NULL,
  assigned_at   timestamptz DEFAULT now(),
  note          text                             -- optional note from manager on assignment
);
```

**Logic:** When a manager assigns a dept-addressed ticket to one of their reps:
1. Insert into `ticket_assignments`
2. Upsert a `ticket_participants` row for the rep (role = 'to', added_by = manager)
3. Insert a system `ticket_messages` row announcing the assignment

---

### 2.4 `ticket_messages` — The thread (all messages + system events)

```sql
CREATE TABLE ticket_messages (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id        uuid REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
  sender_id        uuid REFERENCES users(id) NOT NULL,
  body             text,                          -- null for system events
  is_system        boolean NOT NULL DEFAULT false,
  system_event     text,                          -- 'status_changed' | 'assigned' | 'participant_added' | 'retracted'
  system_metadata  jsonb,                         -- { "old_status": "open", "new_status": "pending", "assigned_to_name": "Jane" }
  is_retracted     boolean NOT NULL DEFAULT false,
  retracted_at     timestamptz,
  retracted_by     uuid REFERENCES users(id),
  created_at       timestamptz DEFAULT now()
);
```

**Retraction rule:** Any participant can retract their own message at any time. The row stays — `is_retracted = true`, body is hidden, thread shows: *"[Name] retracted a message · timestamp"*

**System event examples:**
- Assignment: `{ "event": "assigned", "assigned_to": "Jane Cruz", "by": "Ana Reyes" }`
- Status change: `{ "event": "status_changed", "from": "open", "to": "pending" }`
- Participant added: `{ "event": "participant_added", "name": "CEO", "by": "John" }`

---

### 2.5 `ticket_attachments` — Files + entity links (per message)

```sql
CREATE TABLE ticket_attachments (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id        uuid REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
  message_id       uuid REFERENCES ticket_messages(id) ON DELETE CASCADE NOT NULL,
  attachment_type  text NOT NULL CHECK (attachment_type IN ('file', 'entity')),

  -- File upload fields (when attachment_type = 'file')
  file_path        text,           -- Supabase Storage path: tickets/{ticket_id}/{filename}
  file_name        text,
  file_size        integer,        -- bytes, max 25MB (26_214_400)
  file_mime_type   text,

  -- Entity link fields (when attachment_type = 'entity')
  entity_type      text,           -- see entity type enum below
  entity_id        uuid,
  entity_label     text,           -- snapshot display name at time of linking

  uploaded_by      uuid REFERENCES users(id) NOT NULL,
  created_at       timestamptz DEFAULT now()
);
```

**Supported entity types:**
`inquiry` | `quotation` | `contract` | `booking` | `project` | `invoice` | `collection` | `expense` | `customer` | `contact` | `vendor` | `budget_request`

**File rules:**
- Accepted: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG, JPEG, WEBP
- Max size: 25MB per file
- Storage bucket: `ticket-files` (private, auth-scoped)
- Path pattern: `tickets/{ticket_id}/{message_id}/{original_filename}`

---

### 2.6 `ticket_read_receipts` — Unread state per user

```sql
CREATE TABLE ticket_read_receipts (
  ticket_id           uuid REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
  user_id             uuid REFERENCES users(id) NOT NULL,
  last_read_at        timestamptz DEFAULT now(),
  last_read_message_id uuid REFERENCES ticket_messages(id),
  PRIMARY KEY (ticket_id, user_id)
);
```

**Unread logic:** A ticket is unread for user X if:
- No row exists in `ticket_read_receipts` for (ticket_id, user_id), OR
- `tickets.last_message_at > ticket_read_receipts.last_read_at`

Upsert on read: `ON CONFLICT (ticket_id, user_id) DO UPDATE SET last_read_at = now(), last_read_message_id = $messageId`

---

## 3. Supabase Storage

- Bucket name: `ticket-files`
- Access: **private** (authenticated users only)
- RLS: users can upload/read files only for tickets they are participants in
- URL generation: use `supabase.storage.from('ticket-files').createSignedUrl(path, 3600)`

---

## 4. UI Architecture

### 4.1 Layout — Two-panel split inside Inbox page

```
┌─────────────────────────────────────────────────────────┐
│ Neuron Sidebar (existing, ~220px)                       │
├──────────────────────┬──────────────────────────────────┤
│  THREAD LIST (320px) │  THREAD DETAIL (flex-1)          │
│  ┌────────────────┐  │  ┌──────────────────────────────┐│
│  │ Tabs           │  │  │ Header: subject, badges,     ││
│  │ Inbox·Sent·    │  │  │ participants, status         ││
│  │ Drafts·Archive │  │  ├──────────────────────────────┤│
│  ├────────────────┤  │  │ Message thread (scrollable)  ││
│  │ [Compose btn]  │  │  │ MessageBubble ×n             ││
│  ├────────────────┤  │  │ SystemEventRow ×n            ││
│  │ ThreadListItem │  │  ├──────────────────────────────┤│
│  │ ThreadListItem │  │  │ ComposeBox (reply)           ││
│  │ ThreadListItem │  │  └──────────────────────────────┘│
│  │ ...            │  │  (or empty state if none selected)│
│  └────────────────┘  │                                  │
└──────────────────────┴──────────────────────────────────┘
```

**Widths:** Thread list = 320px fixed. Thread detail = flex-1 (fills remaining space).

---

### 4.2 Thread List Panel — Tabs

```
[Inbox]  [Sent]  [Drafts 3]  [Archived]
```

- **Inbox** = threads where you are a `to` or `cc` participant, OR assigned to you, OR addressed to your dept (managers only)
  - Sub-filters: `All` | `Unread` | `Assigned to me`
- **Sent** = threads you created (`created_by = me`)
- **Drafts** = threads with `status = 'draft'` created by you
- **Archived** = threads with `status = 'archived'` you're a participant in
- Drafts tab shows a count badge when > 0

---

### 4.3 ThreadListItem anatomy

```
┌──────────────────────────────────────────────────────┐
│ ● [Subject — bold if unread]         [2h ago]       │
│   Jane Cruz → Pricing                [Action Req]   │
│   "Please review the attached quote before..."      │
│   📎 2 attachments   [Open]                         │
└──────────────────────────────────────────────────────┘
```

- **Unread dot** (6px, `#0F766E`) left-aligned, only shows when unread
- **Subject** bold (#12332B, 14px, font-medium) when unread; normal when read
- **Meta row**: sender name + dept → recipient summary
- **Preview**: first 80 chars of latest message body, truncated
- **Type badge**: `FYI` (gray) | `Action Required` (amber) | `Urgent` (red)
- **Status badge**: `Open` (blue) | `Pending` (amber) | `Resolved` (green/muted)
- **Attachment indicator**: paperclip icon + count if has attachments
- **Timestamp**: relative ("2h ago", "Yesterday", "Mar 18")
- **Selected state**: left border `border-l-2 border-[#0F766E]` + `bg-[#F7FAF8]`
- **Hover state**: `bg-[#F9FAFB]`

---

### 4.4 Thread Detail Panel

**Header (sticky, border-bottom):**
```
[←]  BL Correction Request — Booking #FWD-2026-003        [Open ▾]  [Resolve]
     From: John Santos (BD)  To: Pricing, +Ana Reyes (cc)
     [Assign ▾]  (visible to managers only when dept is addressed)
```

**Message thread (scrollable, `overflow-y-auto`):**
- Chronological, oldest at top
- Each `MessageBubble`: avatar circle (initials), name + dept (14px bold), timestamp (12px muted), body (13px), attachments below body
- `SystemEventRow`: full-width, center-aligned, muted italic ("Assigned to Jane Cruz by Ana Reyes · Mar 21, 2:14 PM")
- Retracted message: full-width gray placeholder ("John retracted a message · Mar 21, 1:02 PM")
- Own messages: no special side-alignment (not bubble-chat style — use Linear's flat row style)

**ComposeBox (sticky bottom):**
```
┌────────────────────────────────────────────────────┐
│  Reply to this thread...                           │
│                                                    │
│  [📎 Entity]  [📁 File]           [Send ▶]        │
└────────────────────────────────────────────────────┘
```
- Textarea auto-expands (min 80px, max 240px)
- Attachment toolbar always visible below textarea
- Send button disabled when empty
- On hover over own messages → show `[↩ Retract]` action

---

### 4.5 Compose Flow (New Message)

Triggered by `[+ Compose]` button in thread list header. Opens as a **modal** (600px wide, centered), not a slide panel.

**Compose modal fields:**

```
Subject *                               [___________________________]
To *      [+ Add person or department]  [ Jane Cruz ×] [Pricing × ]
CC        [+ Add person or department]  (collapsed by default, click to expand)
Type      [● FYI]  [ Action Required]  [ Urgent]
─────────────────────────────────────────────
Message *
[                                              ]
[                                              ]
[                                              ]

─────────────────────────────────────────────
📎 Attachments
[+ Link System Record]  [+ Upload File]
[Inquiry: Shipment #INQ-045 ×]  [quote-v2.pdf × 2.4MB]

─────────────────────────────────────────────
                          [Save Draft]  [Send →]
```

**To/CC field behavior:**
- Type a name → shows people dropdown AND dept names
- Select a dept → shows as `Pricing dept` chip
- Select a person → shows as `Jane Cruz` chip
- Multiple selections allowed

---

### 4.6 Entity Picker UX

Modal within compose (or reply). Opens when `[+ Link System Record]` is clicked.

```
┌─ Link System Record ───────────────────────────────┐
│  [Inquiry] [Quotation] [Booking] [Project] [More▾] │
│  Search: [________________________]                │
│                                                    │
│  ┌──────────────────────────────────────────────┐  │
│  │ INQ-045  Maersk - FCL Shanghai      Nov 2025 │  │
│  │ INQ-044  APL - LCL Singapore        Oct 2025 │  │
│  └──────────────────────────────────────────────┘  │
│                                          [Select]  │
└────────────────────────────────────────────────────┘
```

- Tab bar for entity types (first 5 visible, rest in overflow dropdown)
- Search box filters within each type
- Selected entities appear as chips in compose form
- Entity chips in thread messages are **clickable** → navigates to the entity detail page

---

### 4.7 File Attachment UX

- Click `[+ Upload File]` → native `<input type="file">` (accept PDF, Word, Excel, images)
- Shows upload progress chip while uploading to Supabase Storage
- Uploaded files appear as chips: `📄 quote-final.pdf  2.4MB  [×]`
- In thread messages: chips below message body, clickable to download (signed URL)
- File too large (>25MB): inline error "File exceeds 25MB limit"

---

### 4.8 Assignment Workflow UX

When a ticket is addressed to a department (not a specific person):

1. All managers of that dept see it in their Inbox with a subtle `[Assign]` button in the thread header
2. Clicking `[Assign]` opens a small dropdown: list of dept members (reps + themselves)
3. On select: system event appears in thread, assignee sees it in their inbox
4. The `[Assign]` button becomes `Assigned to: Jane Cruz  [Reassign]`

---

### 4.9 Status + Type Visual Treatment

**Type badges** (shown in thread list + thread header):
| Type | Background | Text |
|---|---|---|
| FYI | `#F3F4F6` | `#6B7280` |
| Action Required | `#FEF3C7` | `#D97706` |
| Urgent | `#FEE2E2` | `#DC2626` |

**Status badges** (in thread header, dropdown to change):
| Status | Background | Text |
|---|---|---|
| Draft | `#F3F4F6` | `#9CA3AF` |
| Open | `#DBEAFE` | `#1E40AF` |
| Pending | `#FEF3C7` | `#D97706` |
| Resolved | `#D1FAE5` | `#047857` |
| Archived | `#F3F4F6` | `#4B5563` |

**Who can change status:**
- `Open → Pending → Resolved`: only the original **sender** (they decide when their request is satisfied)
- `→ Archived`: any participant (personal action, like archiving email)
- Status changes appear as system events in the thread

---

### 4.10 Read/Unread Treatment

| State | Thread row | Subject weight |
|---|---|---|
| Unread | Left 6px teal dot + bg `#FFFFFF` | `font-semibold` |
| Read | No dot + bg `#F9FAFB` | `font-normal` |

- Mark as read: automatically when the thread detail panel opens and scrolls into view
- Sidebar "Inbox" nav item shows badge with total unread count across all threads

---

### 4.11 Keyboard Shortcuts (Linear-feel)

| Key | Action |
|---|---|
| `C` | Open Compose modal |
| `R` | Focus reply ComposeBox |
| `E` | Archive current thread |
| `↑ / ↓` | Navigate thread list |
| `Enter` | Open selected thread |
| `Esc` | Close compose modal / deselect thread |

---

## 5. Component Breakdown

### New components (all in `/src/components/inbox/`)

| Component | Purpose |
|---|---|
| `InboxPage.tsx` | Top-level layout — replaces current InboxPage |
| `ThreadListPanel.tsx` | Left panel: tabs + thread list |
| `ThreadListItem.tsx` | Single thread row in the list |
| `ThreadDetailPanel.tsx` | Right panel: header + messages + compose |
| `ThreadHeader.tsx` | Subject, badges, participants, status dropdown, resolve/assign actions |
| `MessageBubble.tsx` | Single user message in thread |
| `SystemEventRow.tsx` | System events (assignments, status changes) |
| `ComposeModal.tsx` | New message composition modal |
| `ComposeBox.tsx` | Reply composer at thread bottom |
| `ToField.tsx` | Multi-select To/CC field (user + dept search) |
| `EntityPicker.tsx` | Entity linking modal (tabbed by type) |
| `EntityLinkChip.tsx` | Clickable entity chip (in compose + messages) |
| `FileAttachmentChip.tsx` | File chip (in compose + messages) |
| `AssignDropdown.tsx` | Manager assigns ticket to dept member |
| `InboxEmptyState.tsx` | No thread selected / no threads in tab |

### New hooks (all in `/src/hooks/`)

| Hook | Purpose |
|---|---|
| `useInbox.ts` | Fetches thread list for current user with unread state |
| `useThread.ts` | Fetches single thread: messages + participants + attachments |
| `useThreadCompose.ts` | Send, draft save, file upload logic |
| `useMarkAsRead.ts` | Upserts read receipt when thread opens |
| `useEntitySearch.ts` | Searches any entity type by query string |

---

## 6. Build Phases

Each phase = one explicit Go Ahead from Marcus before starting.

---

### Phase 1 — Database + Storage
**Deliverables:** 6 SQL migration files + Supabase Storage bucket setup
- Migration: `010_tickets.sql` — all 6 tables
- Storage: create `ticket-files` bucket (private)
- Seed: 5 sample threads with messages, participants, one file attachment, one entity link
- Verify: query each table, confirm joins work

**Slash commands:** none (pure SQL/Supabase work)

---

### Phase 2 — Thread List Panel
**Deliverables:** `ThreadListPanel`, `ThreadListItem`, `useInbox` hook
- Two-panel layout shell for `InboxPage`
- Tab navigation (Inbox / Sent / Drafts / Archived)
- Thread list with unread dots, type badges, status badges, timestamps
- Click thread → selects it (state only, detail panel shows placeholder)
- `useInbox` hook with correct participant/dept filtering logic

**Slash commands:** `/ui-ux-pro-max` when building ThreadListItem for badge/dot visual treatment

---

### Phase 3 — Thread Detail View
**Deliverables:** `ThreadDetailPanel`, `ThreadHeader`, `MessageBubble`, `SystemEventRow`, `ComposeBox`, `useThread`, `useMarkAsRead`
- Full thread rendering (messages chronological, system events, retracted placeholders)
- Status dropdown in header (sender only)
- Resolve button (sender only)
- Reply composer with send (no attachments yet — that's Phase 5)
- Auto-mark as read on open

**Slash commands:** `/ui-ux-pro-max` for message bubble + system event styling; `/simplify` after completing

---

### Phase 4 — Compose New Message
**Deliverables:** `ComposeModal`, `ToField`, `useThreadCompose` (send + draft)
- Compose modal triggered by `[+ Compose]`
- To/CC multi-select field (search users by name + dept names)
- Subject, Type selector (FYI / Action Required / Urgent), Body
- Send → creates ticket + participants + first message, status = 'open'
- Save Draft → status = 'draft'
- Keyboard shortcut: `C` to open

**Slash commands:** `/ui-ux-pro-max` for ToField multi-select UX; `/simplify` after completing

---

### Phase 5 — Attachments (Entity Links + File Uploads)
**Deliverables:** `EntityPicker`, `EntityLinkChip`, `FileAttachmentChip`, `useEntitySearch`, Supabase Storage upload logic
- `[+ Link System Record]` in ComposeModal and ComposeBox
- EntityPicker modal with all 12 entity type tabs + search
- `[+ Upload File]` with upload progress, Supabase Storage PUT
- Chips display in compose + in rendered messages
- Entity chips navigate to detail page on click
- File chips generate signed URL on click

**Slash commands:** `/ui-ux-pro-max` for entity picker tab UX; `/frontend-design` for file chip upload progress

---

### Phase 6 — Assignment Workflow + Message Retraction
**Deliverables:** `AssignDropdown`, assignment system events, retraction UI
- `[Assign ▾]` in thread header (managers only, dept-addressed threads)
- Dropdown of dept members → assigns → system event in thread
- Hover own message → `[Retract]` action
- Retraction: marks `is_retracted`, shows placeholder, logs system event

**Slash commands:** `/simplify` after completing

---

### Phase 7 — Sidebar Badge + Polish
**Deliverables:** Unread badge on Inbox sidebar item, keyboard shortcuts, empty states, animations
- Unread count query → badge on sidebar "Inbox" nav item
- Keyboard shortcuts (`C`, `R`, `E`, `↑↓`, `Enter`, `Esc`)
- Empty states for each tab
- Thread detail slide-in animation (150ms ease-out, transform translateX)
- Final `/simplify` pass on all new components

**Slash commands:** `/simplify` (full pass); `/bencium-innovative-ux-designer:ACCESSIBILITY` for keyboard nav audit

---

## 7. Things to Watch Out For

### Participant query complexity
The inbox query is the most complex in the system. It needs to join `tickets → ticket_participants` and return threads where:
- You are a direct participant, OR
- Your department is addressed and you are a manager, OR
- You are assigned via `ticket_assignments`

This should be a Supabase RPC (Postgres function) to avoid over-fetching. Plan for this in Phase 2.

### File signed URLs expire
Supabase Storage signed URLs expire after the duration you set (recommend 1 hour). If a user opens an old thread, call `createSignedUrl` fresh. Do NOT store the signed URL in the DB — only store the path.

### Draft vs Open on send
When the user clicks Send on a draft thread, update `status = 'open'` AND set `last_message_at`. Make sure the Sent tab and Drafts tab re-query correctly.

### Entity label snapshot
Store `entity_label` at time of linking (e.g. "INQ-045 – Maersk FCL"). Don't rely on a join to the entity table for display in the thread, because the entity could be renamed or deleted.

### Message ordering
Always `ORDER BY created_at ASC` for thread messages. System events and user messages are in the same table — `created_at` is the source of truth for render order.

### Department inbox visibility
When a ticket is addressed to 'Pricing dept', ALL managers of Pricing see it. But reps in Pricing should NOT see it until a manager assigns it to a specific rep. Enforce this in `useInbox` filter logic.

---

## 8. Relevant Slash Commands by Phase

| Phase | Command | When to use |
|---|---|---|
| All UI phases | `/ui-ux-pro-max` | Before building any new component — run to get style/UX spec |
| All UI phases | `/bencium-innovative-ux-designer` | For accessibility audit and design system compliance |
| After each phase | `/simplify` | After completing a phase — review for code quality and DRY |
| Complex components | `/frontend-design` | For the most complex UI components (EntityPicker, ComposeModal) |

---

## 9. Non-Goals (Out of Scope for This Build)

- Real-time push notifications (refresh-on-open is sufficient)
- Email integration (send/receive actual emails)
- Message editing (retraction covers the use case)
- Read receipts shown to sender ("Jane read this at 2:14 PM")
- Reactions/emoji on messages
- Thread forwarding (new ticket covers this)
- Broadcast to multiple departments simultaneously (one compose can target multiple depts via the To field)

---

## 10. Execution Log

| Date | Phase | Action | Result |
|---|---|---|---|
| 2026-03-21 | Planning | Full architecture designed | Blueprint written, ready for Phase 1 |
