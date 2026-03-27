# Settings & Account Management — Design Spec
**Date:** 2026-03-27
**Status:** Approved for implementation
**Project:** Neuron OS

---

## 1. Overview

Two separate pages with distinct entry points:

- **Settings** (`/settings`) — personal account page, reachable by clicking the user profile card at the bottom of the sidebar. Available to all authenticated users. No tab bar — renders the personal form directly.
- **User Management** (`/admin/users`) — dedicated sidebar entry, visible only to Executive department users. Full account management: create, edit, deactivate.

Entry point for Settings replaces the existing `"profile"` page type with `"settings"`. User Management is a new page type `"admin-users"` added to the sidebar under a dedicated section.

---

## 2. Design Principles (from UI/UX Pro Max)

### Style: Flat Design + Minimalism & Swiss Style

Aligned with both the Neuron design system and Linear's aesthetic:

- **No shadows** — visual separation via `1px #E5E9F0` borders only
- **Grid-based layout** — 48px horizontal padding, 32px vertical rhythm
- **Typography-first** — Inter, weight hierarchy via 600/500/400, not size alone
- **Whitespace** — generous vertical breathing room between sections (40px between sections)
- **Micro-interactions** — hover 150ms ease-out, focus rings 2px `#0F766E`
- **Color discipline** — use existing Neuron tokens, no ad-hoc hex values in components

### Key UX Rules Applied

| Rule | Application |
|---|---|
| `input-labels` | Every field has a visible label above, never placeholder-only |
| `inline-validation` | Validate on blur, not on keystroke or submit-only |
| `submit-feedback` | Button shows loading spinner during async ops, then success/error |
| `read-only-distinction` | Read-only fields use `#F7FAF8` background + `#667085` text, visually distinct from editable |
| `progressive-disclosure` | Team field in Create Account only appears when department = Operations |
| `confirmation-dialogs` | Deactivate action requires a confirmation step before executing |
| `password-toggle` | Show/hide toggle on all password inputs |
| `error-placement` | Errors appear directly below the offending field, never only at top |
| `destructive-emphasis` | Deactivate link is red `#B42318`, spatially separated from Save |

---

## 3. Entry Points

### 3a. Settings — Sidebar Profile Card

**Change:** `onNavigate("profile")` → `onNavigate("settings")` in `NeuronSidebar.tsx`

The profile card visual is **unchanged**:
- 32px circular avatar (initials or photo once uploaded)
- Name (13px, weight 600, `#12332B`)
- Email (11px, `#667085`)
- Department (11px, `#667085`)

Active state: `var(--neuron-state-selected)` background, `1.5px var(--neuron-ui-active-border)` border — same as all other sidebar items.

Collapsed sidebar: shows avatar only, tooltip shows name on hover.

### 3b. User Management — Dedicated Sidebar Entry

A new sidebar nav item added at the **bottom of the main nav list**, above the profile card, visible only when `user.department === 'Executive'`.

```
...
[Users]    ← Users icon (lucide), label "Users", routes to "admin-users"
───────────────────────────────────
[Jose Ramos]  ← profile card
```

- Icon: `Users` (lucide, 20px)
- Label: "Users"
- Page type: `"admin-users"`
- Visibility: conditional — `user.department === 'Executive'` only
- Collapsed sidebar: shows icon only, tooltip "Users"
- Active/hover states follow the same sidebar item pattern as all other nav entries

---

## 4. Settings Page — Layout

No tab bar. Personal content renders directly below the header.

```
┌──────────────────────────────────────────────────────────────┐
│  padding: 32px 48px                                          │
│                                                              │
│  Settings                          [32px, weight 600, #12332B]
│  Manage your account details       [14px, #667085]           │
│                                                              │
│  ───────────────────────────────────────────────────────     │  ← 1px #E5E9F0
│                                                              │
│  [Personal form content]                                     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 5. Personal Tab

Max content width: **600px**, left-aligned (not centered — aligns with Neuron's left-heavy layout pattern).

### Section 1 — Profile

```
Profile
──────────────────────────────────────────  ← 1px #E5E9F0 section divider below heading

[Avatar 56px circle]  [Upload photo]  [Remove]
  initials or image     14px teal       14px muted, only shown if photo exists

Full name *
[________________________________]         ← full width input, 40px height

Contact number
[________________________________]
e.g. +63 917 123 4567                      ← helper text 12px #667085 below

                              [Save Profile]  ← right-aligned, teal filled button
```

**Avatar upload:**
- Clicking "Upload photo" opens native file picker (accept: `image/*`)
- Uploads to Supabase Storage bucket `avatars/{user_id}/avatar.{ext}`
- Preview updates immediately (optimistic, blob URL)
- On success: updates `public.users.avatar_url`
- If no photo: shows initial letter in `#E8F5F2` circle with `#0F766E` text

**Save Profile behavior:**
- Button shows spinner (18px, white) during save
- On success: sonner toast "Profile updated"
- On error: sonner toast "Failed to update — try again"
- Validates: name required (non-empty after trim)

---

### Section 2 — Account *(read-only)*

```
Account
──────────────────────────────────────────

Email address
jose.ramos@neuron.ph                       ← plain text, 13px #12332B, no input box

Department
Executive

Role
manager

Team
—

  ┌─────────────────────────────────────────────────────────┐
  │ ⓘ  Contact an Executive admin to update these details. │  ← info notice
  └─────────────────────────────────────────────────────────┘
```

**Read-only field style:**
- Label: 13px weight 500 `#12332B`
- Value: 13px weight 400 `#667085`
- No border, no background — purely typographic, 8px gap between label and value
- 16px gap between each field

**Info notice:**
- Background: `#F0F9FF`, border: `1px #BAE6FD`, border-radius: 8px, padding: 12px 16px
- Icon: `Info` (lucide, 16px, `#0369A1`)
- Text: 13px `#0369A1`

---

### Section 3 — Password

```
Password
──────────────────────────────────────────

New password *
[________________________________] [👁]    ← show/hide toggle

Confirm password *
[________________________________] [👁]

                          [Update Password]  ← right-aligned, teal filled button
```

**Validation (on blur):**
- Min 8 characters — error: "Password must be at least 8 characters"
- Passwords must match — error on confirm field: "Passwords do not match"

**Update Password behavior:**
- Calls `supabase.auth.updateUser({ password })`
- Button spinner during call
- On success: toast "Password updated", both fields cleared
- On error: toast with error message from Supabase

---

## 6. User Management Page *(Executive only, `"admin-users"`)*

Separate page, full content-width layout (no 600px cap — this is a data table view).

```
┌──────────────────────────────────────────────────────────────┐
│  padding: 32px 48px                                          │
│                                                              │
│  User Management                   [32px, weight 600, #12332B]
│  Manage workspace accounts and     [14px, #667085]           │
│  access permissions                                          │
│                                                              │
│  ───────────────────────────────────────────────────────     │  ← 1px #E5E9F0
│                                                              │
│  [table content]                                             │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Header Row

```
Members (17)                              [+ Create Account]
```

- "Members" — 20px weight 600 `#12332B`
- Count — 20px weight 400 `#667085` (updates live after create/deactivate)
- Button — standard teal filled button, 40px height, `Plus` icon 16px, "Create Account" label

### User Table

Uses the existing `DataTable` component (`/src/components/common/DataTable.tsx`).

**Columns:**

| Column | Width | Content | Style |
|---|---|---|---|
| Name | 220px | 28px avatar circle + full name | Avatar: initials/photo; name 13px weight 500 `#12332B` |
| Email | 200px | email address | 13px `#667085` |
| Department | 150px | department badge | Pill — see badge colors below |
| Role | 100px | staff / team_leader / manager | 13px `#667085`, capitalize display ("Team Leader") |
| Team | 140px | team name or `—` | 13px `#667085` |
| Status | 80px | Active / Inactive | Dot + label — see below |
| Actions | 48px | `•••` menu | MoreHorizontal icon, 16px |

**Department badge colors:**
| Department | Background | Text |
|---|---|---|
| Business Development | `#ECFDF5` | `#065F46` |
| Pricing | `#EFF6FF` | `#1E40AF` |
| Operations | `#FFF7ED` | `#9A3412` |
| Accounting | `#F5F3FF` | `#5B21B6` |
| HR | `#FDF2F8` | `#9D174D` |
| Executive | `#F0FDF4` | `#14532D` |

Badge style: `border-radius: 999px`, `padding: 2px 10px`, `font-size: 12px`, `font-weight: 500`.

**Status indicator:**
- Active: 6px circle `#12B76A` + "Active" 13px `#027A48`
- Inactive: 6px circle `#D0D5DD` + "Inactive" 13px `#667085`

**Row interaction:**
- Hover: `#F9FAFB` background on entire row (150ms ease)
- Clicking a row opens the Edit User panel
- Row height: 48px

**Empty state:**
```
[Users icon, 40px, #D0D5DD]
No team members yet
Create an account to add someone to your workspace.
[+ Create Account]   ← ghost/outlined teal button
```

---

## 7. Create Account Panel

SidePanel, slides from right. Width: **480px**.

**Header:**
```
New Account              [✕]
─────────────────────────────
```
Title: 18px weight 600 `#12332B`. Close icon: 20px `#667085`.

**Form fields:**

```
Full name *
[________________________________]

Email address *
[________________________________]

Department *
[▼ Select department             ]

Role *
[▼ Select role                   ]

Team                               ← shown only when department = 'Operations'
[▼ Select team                   ]

Initial password *
[________________________________] [👁]
⚠ Share this password securely. The employee can update it from their Settings.

─────────────────────────────────────────────────────
[Cancel]                         [Create Account →]
```

**Field details:**
- All inputs: 40px height, `border: 1px #E5E9F0`, `border-radius: 8px`, `padding: 0 12px`
- Focus: `border: 1px #0F766E`, `box-shadow: 0 0 0 3px rgba(15,118,110,0.12)`
- Error state: `border: 1px #F04438`, error text 12px `#F04438` below field
- Department dropdown: `CustomDropdown` component with 6 canonical options
- Role dropdown: staff → "Staff", team_leader → "Team Leader", manager → "Manager"
- Team dropdown: conditional, only shows when `department === 'Operations'`; queries `teams` table filtered by `department = 'Operations'`
- Password warning notice: 12px `#B54708`, `ⓘ` icon, appears below the password field (not a box — just inline text)

**Footer:**
- `[Cancel]` — ghost button, 40px, `#667085` text, no border
- `[Create Account →]` — filled teal button, 40px
- Cancel closes panel (no confirmation needed — form hasn't been saved)
- Submit: validates all required fields on click before calling Edge Function

**Loading state:** "Create Account →" button shows spinner + "Creating…" text, disabled.

**Success:** Panel closes, users table refreshes, toast "Account created for [Name]".

**Error:** Toast with the error message. Panel stays open. Fields remain populated.

---

## 8. Edit User Panel

SidePanel, slides from right. Width: **480px**.

**Header:**
```
[28px avatar]  Diana Reyes          [✕]
               Business Development
─────────────────────────────────────
```
Avatar + name + department in the header. Close icon top-right.

**Read-only fields (top, no inputs):**
```
Email
diana.reyes@neuron.ph
```
Label 12px `#667085` weight 500, value 13px `#12332B`. Same typographic read-only style as Personal tab.

**Editable fields:**

```
Department *
[▼ Business Development          ]

Role *
[▼ manager                       ]

Team
[▼ —                             ]      ← shown for all depts (future BD teams)

Status
● Active   ○ Inactive               ← radio-style toggle pills

─────────────────────────────────────────────────────
[Cancel]                        [Save Changes]
```

**Status toggle:**
- Two pill buttons: "Active" (selected: `#ECFDF5` bg, `#027A48` text, `1px #6CE9A6` border) and "Inactive" (selected: `#FEF3F2` bg, `#B42318` text, `1px #FECDCA` border)
- Unselected: `#FFFFFF` bg, `#667085` text, `1px #E5E9F0` border

**Destructive action:**
```

─────────────────────────────────────────────
Deactivate Account                           ← 13px #B42318, far bottom of panel,
                                               after 24px gap from Save row
```
Clicking triggers inline confirmation within the panel:

```
Deactivate Diana Reyes?
This will prevent her from logging in. Her data will not be deleted.

[Cancel]      [Deactivate]                   ← Deactivate is red filled button
```

---

## 9. DB Schema Additions

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
```

**Supabase Storage:**
- Bucket name: `avatars`
- Access: public read, authenticated write
- Path pattern: `avatars/{user_id}/avatar.{ext}`
- Max file size: 5MB
- Accepted types: image/jpeg, image/png, image/webp

---

## 10. Edge Function: `create-user`

**Path:** `supabase/functions/create-user/index.ts`

**Request:**
```ts
POST /functions/v1/create-user
Authorization: Bearer {user JWT}
Content-Type: application/json

{
  name: string,
  email: string,
  password: string,
  department: string,
  role: 'staff' | 'team_leader' | 'manager',
  team_id?: string | null
}
```

**Response (success):**
```ts
{ success: true, user: { id, name, email, department, role } }
```

**Response (error):**
```ts
{ success: false, error: string }
// HTTP 403 if caller is not Executive
// HTTP 400 if validation fails
// HTTP 409 if email already exists
```

**Steps:**
1. Decode JWT from `Authorization` header
2. Query `public.users` to verify `department = 'Executive'` — return 403 if not
3. Call `supabase.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name } })`
4. `handle_new_auth_user` trigger fires → creates `public.users` row
5. `UPDATE public.users SET name, department, role, team_id WHERE auth_id = newUser.id`
6. Return the updated profile row

---

## 11. Files to Create / Modify

| File | Action | Notes |
|---|---|---|
| `src/components/settings/Settings.tsx` | Create | Personal account settings page |
| `src/components/admin/UserManagement.tsx` | Create | User Management page (Executive only) |
| `src/components/admin/CreateUserPanel.tsx` | Create | SidePanel for account creation |
| `src/components/admin/EditUserPanel.tsx` | Create | SidePanel for editing users |
| `supabase/functions/create-user/index.ts` | Create | Edge Function |
| `src/components/NeuronSidebar.tsx` | Modify | `"profile"` → `"settings"`; add `"admin-users"` entry for Executive |
| `src/App.tsx` | Modify | Add `"settings"` + `"admin-users"` routes; remove `"profile"` route |
| `src/supabase/migrations/020_user_profile_columns.sql` | Create | `avatar_url`, `phone` columns |

---

## 12. Junk Account Cleanup

These 3 test Executive accounts should be deleted from Supabase Auth before launch:

| Email | Reason |
|---|---|
| `test@user2.ph` | Test account with full Executive bypass |
| `codextest+20260318a@example.com` | Automated test account |
| `audit+20260324210815@example.com` | QA audit account |

Manual step: Supabase Dashboard → Authentication → Users → Delete each.

---

## 13. Pre-Delivery UI Checklist (UI/UX Pro Max)

- [ ] No emojis used as icons — Lucide SVG only
- [ ] All inputs have visible labels (not placeholder-only)
- [ ] Errors appear below the specific field, not only at top
- [ ] Inline validation on blur (not on keystroke)
- [ ] All password fields have show/hide toggle
- [ ] Submit buttons show loading state during async ops
- [ ] Destructive actions (Deactivate) use red `#B42318` and have confirmation step
- [ ] Read-only fields are visually distinct from editable inputs
- [ ] Team field hides/shows based on department selection (progressive disclosure)
- [ ] All interactive elements have `cursor-pointer`
- [ ] Focus rings: 2px `#0F766E` outline on all inputs and buttons
- [ ] Hover transitions: 150ms ease-out on all interactive elements
- [ ] Touch targets: min 40px height on all inputs, 40px on buttons
- [ ] Text contrast: all body text ≥ 4.5:1 against background
- [ ] Sonner toasts use `sonner@2.0.3` import
- [ ] Panel closes are instant (no animation needed for cancel)
- [ ] SidePanel uses `/src/components/common/SidePanel.tsx`
- [ ] DataTable uses `/src/components/common/DataTable.tsx`

---

*Spec written 2026-03-27. Approved by Marcus. Ready for implementation planning.*
