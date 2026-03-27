# Settings & Account Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a personal Settings page (sidebar profile card click) and an Executive-only User Management page (dedicated sidebar entry) with full account CRUD.

**Architecture:** Two independent pages sharing no state. Settings reads/writes the current user's own profile via the Supabase client + Auth API. User Management fetches all users and delegates account creation to a Supabase Edge Function (required for `auth.admin.createUser`) while editing uses the regular client with existing RLS policies.

**Tech Stack:** React 18 + TypeScript, Supabase JS client, Supabase Edge Function (Deno), `supabase/functions/create-user`, SidePanel, DataTable, CustomDropdown, sonner@2.0.3 toasts, motion/react, lucide-react icons.

**Color Guardrails:** All colors must use `var(--neuron-*)` CSS variables from `src/styles/globals.css`. No raw hex, rgb(), or rgba() literals are permitted in component files. New tokens were added to globals.css before this plan was written — use them. Quick reference:
- Primary action button: `var(--neuron-action-primary)` / hover: `var(--neuron-action-primary-hover)` / text: `var(--neuron-action-primary-text)`
- Text: `var(--neuron-ink-primary)` / secondary: `var(--neuron-ink-secondary)` / muted: `var(--neuron-ink-muted)`
- Borders: `var(--neuron-ui-border)` / divider: `var(--neuron-ui-divider)` / active: `var(--neuron-ui-active-border)`
- Backgrounds: `var(--neuron-bg-page)` / elevated: `var(--neuron-bg-elevated)` / tint: `var(--neuron-brand-green-100)` / hover: `var(--neuron-state-hover)` / selected: `var(--neuron-state-selected)`
- Input focus ring: `var(--neuron-state-focus-ring)` (use as `boxShadow`)
- Status: `var(--neuron-semantic-success/warn/danger)` and their `-bg` / `-border` / `-text` variants
- Info callout: `var(--neuron-semantic-info)` / `-bg` / `-border`
- Department badges: `var(--neuron-dept-{bd|pricing|ops|accounting|hr|executive}-{bg|text})` / default: `var(--neuron-dept-default-{bg|text})`
- Status toggle: `var(--neuron-toggle-active-bg)` / `var(--neuron-toggle-inactive-bg)` / `-text` variants
- Muted icon/border: `var(--neuron-ui-muted)`

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/supabase/migrations/020_user_profile_columns.sql` | Create | Add `avatar_url`, `phone` columns to `users`; create `avatars` storage bucket |
| `src/hooks/useUser.tsx` | Modify | Add `avatar_url?` and `phone?` to `User` interface |
| `supabase/functions/create-user/index.ts` | Create | Edge Function: Executive-only auth user creation |
| `src/components/settings/Settings.tsx` | Create | Personal settings page (profile, account read-only, password) |
| `src/components/admin/UserManagement.tsx` | Create | Executive-only user list page with DataTable |
| `src/components/admin/CreateUserPanel.tsx` | Create | SidePanel: create new account via Edge Function |
| `src/components/admin/EditUserPanel.tsx` | Create | SidePanel: edit dept/role/status, inline deactivate confirm |
| `src/components/NeuronSidebar.tsx` | Modify | Add `"settings"` + `"admin-users"` to Page type; update profile card; add Users nav item |
| `src/App.tsx` | Modify | Add `/settings` + `/admin/users` routes; update page mappings; remove `/profile` |

---

## Task 1: DB Migration 020

**Files:**
- Create: `src/supabase/migrations/020_user_profile_columns.sql`
- Apply via: Supabase MCP `mcp__supabase__execute_sql`

- [ ] **Step 1: Write the migration file**

```sql
-- ============================================================================
-- 020: User profile columns + avatars storage bucket
-- ============================================================================

-- Add avatar_url and phone to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;

-- Create avatars storage bucket (public read so avatar URLs work without auth)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS — allow public read, auth-scoped write
-- Path pattern: {auth_uid}/avatar.{ext}  (folder = auth UUID, compared to auth.uid())

CREATE POLICY "avatars_public_read" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_auth_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "avatars_owner_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "avatars_owner_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

- [ ] **Step 2: Apply the migration via Supabase MCP**

Run the SQL above using `mcp__supabase__execute_sql` tool. Expected: no error, returns success.

Verify the columns exist:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'users' AND column_name IN ('avatar_url', 'phone');
```
Expected: 2 rows returned.

Verify the bucket exists:
```sql
SELECT id, name, public FROM storage.buckets WHERE id = 'avatars';
```
Expected: 1 row, `public = true`.

- [ ] **Step 3: Commit**

```bash
git add src/supabase/migrations/020_user_profile_columns.sql
git commit -m "feat: migration 020 — avatar_url, phone columns, avatars storage bucket"
```

---

## Task 2: Update User Type

**Files:**
- Modify: `src/hooks/useUser.tsx` (lines 6–18)

- [ ] **Step 1: Add new fields to the User interface**

In `src/hooks/useUser.tsx`, find the `User` interface and add two optional fields after `team_id`:

```tsx
export interface User {
  id: string;
  email: string;
  name: string;
  department: 'Business Development' | 'Pricing' | 'Operations' | 'Accounting' | 'Executive' | 'HR';
  role: 'staff' | 'team_leader' | 'manager';
  created_at: string;
  is_active: boolean;
  team_id?: string | null;
  avatar_url?: string | null;   // ← add
  phone?: string | null;         // ← add
  // Operations-specific: controls which Ops module tabs are visible (separate from RBAC role)
  service_type?: 'Forwarding' | 'Brokerage' | 'Trucking' | 'Marine Insurance' | 'Others' | null;
  operations_role?: 'Manager' | 'Supervisor' | 'Handler' | null;
}
```

- [ ] **Step 2: Verify build compiles**

```bash
npm run build
```
Expected: exits 0, no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useUser.tsx
git commit -m "feat: add avatar_url and phone fields to User type"
```

---

## Task 3: Edge Function `create-user`

**Files:**
- Create: `supabase/functions/create-user/index.ts`

> **Important:** This Edge Function uses `SUPABASE_SERVICE_ROLE_KEY` which is automatically injected by Supabase's runtime — never hard-code it. The function is deployed to the Supabase project; it does NOT run locally.

- [ ] **Step 1: Create the directory and file**

```bash
mkdir -p supabase/functions/create-user
```

Create `supabase/functions/create-user/index.ts`:

```ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing authorization" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the caller is an Executive department user via their JWT + RLS
    const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: callerProfile, error: profileError } = await callerClient
      .from("users")
      .select("department")
      .single();

    if (profileError || !callerProfile) {
      return new Response(
        JSON.stringify({ success: false, error: "Could not verify caller identity" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (callerProfile.department !== "Executive") {
      return new Response(
        JSON.stringify({ success: false, error: "Only Executive accounts can create users" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { name, email, password, department, role, team_id } = await req.json();

    if (!name || !email || !password || !department || !role) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields: name, email, password, department, role" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validDepartments = ["Business Development", "Pricing", "Operations", "Accounting", "HR", "Executive"];
    const validRoles = ["staff", "team_leader", "manager"];

    if (!validDepartments.includes(department) || !validRoles.includes(role)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid department or role value" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the Supabase Auth user using the service role key
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });

    if (authError) {
      const status = authError.message.toLowerCase().includes("already registered") ? 409 : 400;
      return new Response(
        JSON.stringify({ success: false, error: authError.message }),
        { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const newAuthUserId = authData.user.id;

    // The handle_new_auth_user trigger fires and creates a public.users row with email + name from metadata.
    // Now update it with the provided department, role, and team.
    const { data: updatedUser, error: updateError } = await adminClient
      .from("users")
      .update({ name, department, role, team_id: team_id || null })
      .eq("auth_id", newAuthUserId)
      .select("id, name, email, department, role")
      .single();

    if (updateError) {
      return new Response(
        JSON.stringify({ success: false, error: `Profile update failed: ${updateError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, user: updatedUser }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

- [ ] **Step 2: Deploy the Edge Function**

```bash
npx supabase login
npx supabase functions deploy create-user --project-ref ubspbukgcxmzegnomlgi
```

Expected output: `Deployed Functions create-user` with a function URL.

If Supabase CLI is not installed: `npm install -g supabase` first.

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/create-user/index.ts
git commit -m "feat: add create-user edge function for Executive account creation"
```

---

## Task 4: Settings Page

**Files:**
- Create: `src/components/settings/Settings.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/settings/Settings.tsx`:

```tsx
import { useState, useEffect, useRef } from "react";
import { Eye, EyeOff, Info, Loader2 } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { supabase } from "../../utils/supabase/client";
import { useUser } from "../../hooks/useUser";

function SectionHeader({ title }: { title: string }) {
  return (
    <div style={{ marginBottom: "24px" }}>
      <h2 style={{ fontSize: "14px", fontWeight: 600, color: "var(--neuron-ink-primary)", marginBottom: "12px" }}>
        {title}
      </h2>
      <div style={{ height: "1px", backgroundColor: "var(--neuron-ui-border)" }} />
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--neuron-ink-primary)", marginBottom: "4px" }}>
        {label}
      </p>
      <p style={{ fontSize: "13px", fontWeight: 400, color: "var(--neuron-ink-muted)" }}>
        {value || "—"}
      </p>
    </div>
  );
}

function FieldLabel({ children, required }: { children: string; required?: boolean }) {
  return (
    <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--neuron-ink-primary)", marginBottom: "6px" }}>
      {children}{required && <span style={{ color: "var(--neuron-semantic-danger)" }}> *</span>}
    </label>
  );
}

function FieldError({ message }: { message: string }) {
  return message ? (
    <p style={{ fontSize: "12px", color: "var(--neuron-semantic-danger)", marginTop: "4px" }}>{message}</p>
  ) : null;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: "40px",
  border: "1px solid var(--neuron-ui-border)",
  borderRadius: "8px",
  padding: "0 12px",
  fontSize: "13px",
  color: "var(--neuron-ink-primary)",
  backgroundColor: "var(--neuron-bg-elevated)",
  outline: "none",
  boxSizing: "border-box",
};

const inputFocusStyle: React.CSSProperties = {
  border: "1px solid var(--neuron-ui-active-border)",
  boxShadow: "var(--neuron-state-focus-ring)",
};

const inputErrorStyle: React.CSSProperties = {
  border: "1px solid var(--neuron-semantic-danger)",
};

function TextInput({
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  type = "text",
  rightElement,
}: {
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  error?: string;
  type?: string;
  rightElement?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => { setFocused(false); onBlur?.(); }}
        onFocus={() => setFocused(true)}
        placeholder={placeholder}
        style={{
          ...inputStyle,
          ...(focused ? inputFocusStyle : {}),
          ...(error ? inputErrorStyle : {}),
          paddingRight: rightElement ? "44px" : "12px",
        }}
      />
      {rightElement && (
        <div style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)" }}>
          {rightElement}
        </div>
      )}
    </div>
  );
}

function SaveButton({ saving, label, onClick }: { saving: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      style={{
        height: "40px",
        padding: "0 20px",
        borderRadius: "8px",
        background: saving ? "var(--neuron-action-primary-hover)" : "var(--neuron-action-primary)",
        border: "none",
        color: "var(--neuron-action-primary-text)",
        fontSize: "13px",
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        gap: "8px",
        cursor: saving ? "not-allowed" : "pointer",
        marginLeft: "auto",
        opacity: saving ? 0.8 : 1,
      }}
    >
      {saving && <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />}
      {saving ? "Saving…" : label}
    </button>
  );
}

export function Settings() {
  const { user, session, setUser } = useUser();

  // Profile section
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [nameError, setNameError] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatar_url || null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Team name for Account section
  const [teamName, setTeamName] = useState<string | null>(null);

  // Password section
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({ new: "", confirm: "" });
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (user?.team_id) {
      supabase
        .from("teams")
        .select("name")
        .eq("id", user.team_id)
        .single()
        .then(({ data }) => setTeamName(data?.name || null));
    }
  }, [user?.team_id]);

  const authUid = session?.user?.id;

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    setAvatarUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSaveProfile = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError("Name is required");
      return;
    }
    setNameError("");
    setSavingProfile(true);

    try {
      let newAvatarUrl = avatarUrl;

      // Upload avatar if a new file was selected
      if (avatarFile && authUid) {
        const ext = avatarFile.name.split(".").pop() || "jpg";
        const path = `${authUid}/avatar.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, avatarFile, { upsert: true, contentType: avatarFile.type });

        if (uploadError) throw new Error(`Avatar upload failed: ${uploadError.message}`);

        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
        newAvatarUrl = urlData.publicUrl;
      }

      const { error } = await supabase
        .from("users")
        .update({ name: trimmedName, phone: phone.trim() || null, avatar_url: newAvatarUrl })
        .eq("id", user!.id);

      if (error) throw new Error(error.message);

      setAvatarUrl(newAvatarUrl);
      setAvatarFile(null);
      setAvatarPreview(null);
      setUser({ ...user!, name: trimmedName, phone: phone.trim() || null, avatar_url: newAvatarUrl });
      toast.success("Profile updated");
    } catch (err) {
      toast.error("Failed to update — try again");
      console.error(err);
    } finally {
      setSavingProfile(false);
    }
  };

  const validateNewPassword = () => {
    if (newPassword && newPassword.length < 8) {
      setPasswordErrors((prev) => ({ ...prev, new: "Password must be at least 8 characters" }));
    } else {
      setPasswordErrors((prev) => ({ ...prev, new: "" }));
    }
  };

  const validateConfirmPassword = () => {
    if (confirmPassword && confirmPassword !== newPassword) {
      setPasswordErrors((prev) => ({ ...prev, confirm: "Passwords do not match" }));
    } else {
      setPasswordErrors((prev) => ({ ...prev, confirm: "" }));
    }
  };

  const handleUpdatePassword = async () => {
    const newErr = newPassword.length < 8 ? "Password must be at least 8 characters" : "";
    const confirmErr = confirmPassword !== newPassword ? "Passwords do not match" : "";
    setPasswordErrors({ new: newErr, confirm: confirmErr });
    if (newErr || confirmErr || !newPassword) return;

    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw new Error(error.message);
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password updated");
    } catch (err: any) {
      toast.error(err.message || "Failed to update password");
    } finally {
      setSavingPassword(false);
    }
  };

  const displayAvatar = avatarPreview || avatarUrl;
  const initials = (user?.name || user?.email || "U").charAt(0).toUpperCase();

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", backgroundColor: "var(--neuron-bg-elevated)" }}>
      {/* Page Header */}
      <div style={{ padding: "32px 48px", borderBottom: "1px solid var(--neuron-ui-border)" }}>
        <h1 style={{ fontSize: "32px", fontWeight: 600, color: "var(--neuron-ink-primary)", letterSpacing: "-1.2px", marginBottom: "4px" }}>
          Settings
        </h1>
        <p style={{ fontSize: "14px", color: "var(--neuron-ink-muted)" }}>Manage your account details</p>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "40px 48px" }}>
        <div style={{ maxWidth: "600px" }}>

          {/* Section 1 — Profile */}
          <SectionHeader title="Profile" />

          {/* Avatar */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                backgroundColor: displayAvatar ? "transparent" : "var(--neuron-brand-green-100)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              {displayAvatar ? (
                <img src={displayAvatar} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ fontSize: "22px", fontWeight: 600, color: "var(--neuron-action-primary)" }}>{initials}</span>
              )}
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarSelect}
                style={{ display: "none" }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{ fontSize: "14px", color: "var(--neuron-action-primary)", background: "none", border: "none", cursor: "pointer", fontWeight: 500 }}
              >
                Upload photo
              </button>
              {displayAvatar && (
                <button
                  onClick={handleRemoveAvatar}
                  style={{ fontSize: "14px", color: "var(--neuron-ink-muted)", background: "none", border: "none", cursor: "pointer" }}
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          {/* Name */}
          <div style={{ marginBottom: "20px" }}>
            <FieldLabel required>Full name</FieldLabel>
            <TextInput
              value={name}
              onChange={setName}
              onBlur={() => { if (!name.trim()) setNameError("Name is required"); else setNameError(""); }}
              error={nameError}
            />
            <FieldError message={nameError} />
          </div>

          {/* Phone */}
          <div style={{ marginBottom: "24px" }}>
            <FieldLabel>Contact number</FieldLabel>
            <TextInput value={phone} onChange={setPhone} placeholder="e.g. +63 917 123 4567" />
            <p style={{ fontSize: "12px", color: "var(--neuron-ink-muted)", marginTop: "4px" }}>e.g. +63 917 123 4567</p>
          </div>

          <SaveButton saving={savingProfile} label="Save Profile" onClick={handleSaveProfile} />

          {/* Section 2 — Account (read-only) */}
          <div style={{ marginTop: "40px" }}>
            <SectionHeader title="Account" />
            <ReadOnlyField label="Email address" value={user?.email || ""} />
            <ReadOnlyField label="Department" value={user?.department || ""} />
            <ReadOnlyField label="Role" value={
              user?.role === "team_leader" ? "Team Leader" :
              user?.role === "manager" ? "Manager" :
              user?.role === "staff" ? "Staff" : user?.role || ""
            } />
            <ReadOnlyField label="Team" value={teamName || "—"} />

            <div
              style={{
                backgroundColor: "var(--neuron-semantic-info-bg)",
                border: "1px solid var(--neuron-semantic-info-border)",
                borderRadius: "8px",
                padding: "12px 16px",
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
                marginTop: "4px",
              }}
            >
              <Info size={16} style={{ color: "var(--neuron-semantic-info)", flexShrink: 0, marginTop: "1px" }} />
              <p style={{ fontSize: "13px", color: "var(--neuron-semantic-info)" }}>
                Contact an Executive admin to update these details.
              </p>
            </div>
          </div>

          {/* Section 3 — Password */}
          <div style={{ marginTop: "40px" }}>
            <SectionHeader title="Password" />

            <div style={{ marginBottom: "20px" }}>
              <FieldLabel required>New password</FieldLabel>
              <TextInput
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={setNewPassword}
                onBlur={validateNewPassword}
                error={passwordErrors.new}
                rightElement={
                  <button
                    onClick={() => setShowNew((v) => !v)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--neuron-ink-muted)", display: "flex" }}
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />
              <FieldError message={passwordErrors.new} />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <FieldLabel required>Confirm password</FieldLabel>
              <TextInput
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={setConfirmPassword}
                onBlur={validateConfirmPassword}
                error={passwordErrors.confirm}
                rightElement={
                  <button
                    onClick={() => setShowConfirm((v) => !v)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--neuron-ink-muted)", display: "flex" }}
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />
              <FieldError message={passwordErrors.confirm} />
            </div>

            <SaveButton saving={savingPassword} label="Update Password" onClick={handleUpdatePassword} />
          </div>

        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
```

- [ ] **Step 2: Verify build compiles**

```bash
npm run build
```
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add src/components/settings/Settings.tsx
git commit -m "feat: add Settings page — profile, account read-only, password"
```

---

## Task 5: UserManagement Page

**Files:**
- Create: `src/components/admin/UserManagement.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/admin/UserManagement.tsx`:

```tsx
import { useState, useEffect, useCallback } from "react";
import { Plus, Users } from "lucide-react";
import { supabase } from "../../utils/supabase/client";
import { DataTable, ColumnDef } from "../common/DataTable";
import { CreateUserPanel } from "./CreateUserPanel";
import { EditUserPanel } from "./EditUserPanel";

type UserRow = {
  id: string;
  email: string;
  name: string;
  department: string;
  role: string;
  team_id: string | null;
  is_active: boolean;
  avatar_url?: string | null;
  teams: { name: string } | null;
};

const DEPT_BADGE: Record<string, { bg: string; text: string }> = {
  "Business Development": { bg: "var(--neuron-dept-bd-bg)",         text: "var(--neuron-dept-bd-text)" },
  "Pricing":             { bg: "var(--neuron-dept-pricing-bg)",     text: "var(--neuron-dept-pricing-text)" },
  "Operations":          { bg: "var(--neuron-dept-ops-bg)",         text: "var(--neuron-dept-ops-text)" },
  "Accounting":          { bg: "var(--neuron-dept-accounting-bg)",  text: "var(--neuron-dept-accounting-text)" },
  "HR":                  { bg: "var(--neuron-dept-hr-bg)",          text: "var(--neuron-dept-hr-text)" },
  "Executive":           { bg: "var(--neuron-dept-executive-bg)",   text: "var(--neuron-dept-executive-text)" },
};

function DeptBadge({ dept }: { dept: string }) {
  const colors = DEPT_BADGE[dept] || { bg: "var(--neuron-dept-default-bg)", text: "var(--neuron-dept-default-text)" };
  return (
    <span
      style={{
        borderRadius: "999px",
        padding: "2px 10px",
        fontSize: "12px",
        fontWeight: 500,
        backgroundColor: colors.bg,
        color: colors.text,
      }}
    >
      {dept}
    </span>
  );
}

function StatusDot({ active }: { active: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <div
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          backgroundColor: active ? "var(--neuron-toggle-active-bg)" : "var(--neuron-toggle-inactive-bg)",
          flexShrink: 0,
        }}
      />
      <span style={{ fontSize: "13px", color: active ? "var(--neuron-toggle-active-text)" : "var(--neuron-ink-muted)" }}>
        {active ? "Active" : "Inactive"}
      </span>
    </div>
  );
}

function AvatarCell({ user }: { user: UserRow }) {
  const initials = (user.name || user.email || "U").charAt(0).toUpperCase();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <div
        style={{
          width: "28px",
          height: "28px",
          borderRadius: "50%",
          backgroundColor: "var(--neuron-brand-green-100)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        {user.avatar_url ? (
          <img src={user.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--neuron-action-primary)" }}>{initials}</span>
        )}
      </div>
      <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--neuron-ink-primary)" }}>{user.name || user.email}</span>
    </div>
  );
}

function formatRole(role: string): string {
  if (role === "team_leader") return "Team Leader";
  if (role === "manager") return "Manager";
  if (role === "staff") return "Staff";
  return role;
}

export function UserManagement() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<UserRow | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("users")
      .select("id, email, name, department, role, team_id, is_active, avatar_url, teams(name)")
      .order("name", { ascending: true });
    if (!error && data) {
      setUsers(data as UserRow[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const columns: ColumnDef<UserRow>[] = [
    {
      header: "Name",
      width: "220px",
      cell: (u) => <AvatarCell user={u} />,
    },
    {
      header: "Email",
      width: "200px",
      cell: (u) => <span style={{ fontSize: "13px", color: "var(--neuron-ink-muted)" }}>{u.email}</span>,
    },
    {
      header: "Department",
      width: "150px",
      cell: (u) => <DeptBadge dept={u.department} />,
    },
    {
      header: "Role",
      width: "100px",
      cell: (u) => <span style={{ fontSize: "13px", color: "var(--neuron-ink-muted)" }}>{formatRole(u.role)}</span>,
    },
    {
      header: "Team",
      width: "140px",
      cell: (u) => (
        <span style={{ fontSize: "13px", color: "var(--neuron-ink-muted)" }}>
          {u.teams?.name || "—"}
        </span>
      ),
    },
    {
      header: "Status",
      width: "80px",
      cell: (u) => <StatusDot active={u.is_active} />,
    },
  ];

  const emptyState = (
    <div style={{ textAlign: "center", padding: "64px 0" }}>
      <Users size={40} style={{ color: "var(--neuron-ui-muted)", margin: "0 auto 16px" }} />
      <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--neuron-ink-primary)", marginBottom: "4px" }}>
        No team members yet
      </p>
      <p style={{ fontSize: "13px", color: "var(--neuron-ink-muted)", marginBottom: "20px" }}>
        Create an account to add someone to your workspace.
      </p>
      <button
        onClick={() => setShowCreate(true)}
        style={{
          height: "40px",
          padding: "0 20px",
          borderRadius: "8px",
          background: "var(--neuron-bg-elevated)",
          border: "1px solid var(--neuron-action-primary)",
          color: "var(--neuron-action-primary)",
          fontSize: "13px",
          fontWeight: 600,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <Plus size={16} />
        Create Account
      </button>
    </div>
  );

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", backgroundColor: "var(--neuron-bg-elevated)" }}>
      {/* Page Header */}
      <div style={{ padding: "32px 48px", borderBottom: "1px solid var(--neuron-ui-border)" }}>
        <h1 style={{ fontSize: "32px", fontWeight: 600, color: "var(--neuron-ink-primary)", letterSpacing: "-1.2px", marginBottom: "4px" }}>
          User Management
        </h1>
        <p style={{ fontSize: "14px", color: "var(--neuron-ink-muted)" }}>
          Manage workspace accounts and access permissions
        </p>
      </div>

      {/* Table Header Row */}
      <div
        style={{
          padding: "24px 48px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <p style={{ fontSize: "20px", fontWeight: 600, color: "var(--neuron-ink-primary)" }}>
          Members{" "}
          <span style={{ fontWeight: 400, color: "var(--neuron-ink-muted)" }}>({users.length})</span>
        </p>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            height: "40px",
            padding: "0 16px",
            borderRadius: "8px",
            background: "var(--neuron-action-primary)",
            border: "none",
            color: "var(--neuron-action-primary-text)",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--neuron-action-primary-hover)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--neuron-action-primary)"; }}
        >
          <Plus size={16} />
          Create Account
        </button>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflow: "auto", padding: "0 48px 32px" }}>
        <DataTable
          data={users}
          columns={columns}
          isLoading={loading}
          emptyMessage={emptyState}
          onRowClick={(u) => setEditUser(u)}
        />
      </div>

      {/* Panels */}
      {showCreate && (
        <CreateUserPanel
          isOpen={showCreate}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); fetchUsers(); }}
        />
      )}

      {editUser && (
        <EditUserPanel
          isOpen={!!editUser}
          user={editUser}
          onClose={() => setEditUser(null)}
          onSaved={() => { setEditUser(null); fetchUsers(); }}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```
Expected: exits 0. (CreateUserPanel and EditUserPanel don't exist yet — expect import errors until Tasks 6 and 7 are complete. Complete Tasks 6 and 7 before running this build check.)

- [ ] **Step 3: Commit after Tasks 6 and 7 are complete**

Defer commit until after Tasks 6 and 7. See end of Task 7.

---

## Task 6: CreateUserPanel

**Files:**
- Create: `src/components/admin/CreateUserPanel.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/admin/CreateUserPanel.tsx`:

```tsx
import { useState, useEffect } from "react";
import { Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { supabase } from "../../utils/supabase/client";
import { SidePanel } from "../common/SidePanel";
import { CustomDropdown } from "../bd/CustomDropdown";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const DEPARTMENTS = [
  "Business Development",
  "Pricing",
  "Operations",
  "Accounting",
  "HR",
  "Executive",
];

const ROLES = [
  { value: "staff", label: "Staff" },
  { value: "team_leader", label: "Team Leader" },
  { value: "manager", label: "Manager" },
];

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: "40px",
  border: "1px solid var(--neuron-ui-border)",
  borderRadius: "8px",
  padding: "0 12px",
  fontSize: "13px",
  color: "var(--neuron-ink-primary)",
  backgroundColor: "var(--neuron-bg-elevated)",
  outline: "none",
  boxSizing: "border-box",
};

function FieldLabel({ children, required }: { children: string; required?: boolean }) {
  return (
    <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--neuron-ink-primary)", marginBottom: "6px" }}>
      {children}{required && <span style={{ color: "var(--neuron-semantic-danger)" }}> *</span>}
    </label>
  );
}

function FieldError({ message }: { message: string }) {
  return message ? <p style={{ fontSize: "12px", color: "var(--neuron-semantic-danger)", marginTop: "4px" }}>{message}</p> : null;
}

export function CreateUserPanel({ isOpen, onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState("");
  const [teamId, setTeamId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Teams list (Operations only)
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => {
    if (department === "Operations") {
      supabase
        .from("teams")
        .select("id, name")
        .eq("department", "Operations")
        .order("name")
        .then(({ data }) => setTeams(data || []));
    } else {
      setTeams([]);
      setTeamId("");
    }
  }, [department]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Name is required";
    if (!email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Enter a valid email address";
    if (!department) errs.department = "Department is required";
    if (!role) errs.role = "Role is required";
    if (!password) errs.password = "Password is required";
    else if (password.length < 8) errs.password = "Password must be at least 8 characters";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-user", {
        body: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          department,
          role,
          team_id: teamId || null,
        },
      });

      if (error || !data?.success) {
        const msg = data?.error || error?.message || "Failed to create account";
        toast.error(msg);
        return;
      }

      toast.success(`Account created for ${name.trim()}`);
      onCreated();
    } catch (err: any) {
      toast.error(err.message || "Unexpected error");
    } finally {
      setSubmitting(false);
    }
  };

  const footer = (
    <div
      style={{
        padding: "16px 24px",
        borderTop: "1px solid var(--neuron-ui-border)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "var(--neuron-bg-elevated)",
      }}
    >
      <button
        onClick={onClose}
        style={{
          height: "40px",
          padding: "0 20px",
          background: "none",
          border: "none",
          color: "var(--neuron-ink-muted)",
          fontSize: "13px",
          fontWeight: 500,
          cursor: "pointer",
        }}
      >
        Cancel
      </button>
      <button
        onClick={handleSubmit}
        disabled={submitting}
        style={{
          height: "40px",
          padding: "0 20px",
          borderRadius: "8px",
          background: "var(--neuron-action-primary)",
          border: "none",
          color: "var(--neuron-action-primary-text)",
          fontSize: "13px",
          fontWeight: 600,
          cursor: submitting ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          opacity: submitting ? 0.8 : 1,
        }}
      >
        {submitting && <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />}
        {submitting ? "Creating…" : "Create Account →"}
      </button>
    </div>
  );

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      title="New Account"
      footer={footer}
      width="480px"
    >
      <div style={{ padding: "24px", overflowY: "auto", height: "100%" }}>

        <div style={{ marginBottom: "20px" }}>
          <FieldLabel required>Full name</FieldLabel>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ ...inputStyle, ...(errors.name ? { border: "1px solid var(--neuron-semantic-danger)" } : {}) }}
          />
          <FieldError message={errors.name} />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <FieldLabel required>Email address</FieldLabel>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ ...inputStyle, ...(errors.email ? { border: "1px solid var(--neuron-semantic-danger)" } : {}) }}
          />
          <FieldError message={errors.email} />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <FieldLabel required>Department</FieldLabel>
          <CustomDropdown
            label=""
            value={department}
            onChange={setDepartment}
            options={[
              { value: "", label: "Select department" },
              ...DEPARTMENTS.map((d) => ({ value: d, label: d })),
            ]}
          />
          <FieldError message={errors.department} />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <FieldLabel required>Role</FieldLabel>
          <CustomDropdown
            label=""
            value={role}
            onChange={setRole}
            options={[
              { value: "", label: "Select role" },
              ...ROLES,
            ]}
          />
          <FieldError message={errors.role} />
        </div>

        {department === "Operations" && (
          <div style={{ marginBottom: "20px" }}>
            <FieldLabel>Team</FieldLabel>
            <CustomDropdown
              label=""
              value={teamId}
              onChange={setTeamId}
              options={[
                { value: "", label: "No team" },
                ...teams.map((t) => ({ value: t.id, label: t.name })),
              ]}
            />
          </div>
        )}

        <div style={{ marginBottom: "8px" }}>
          <FieldLabel required>Initial password</FieldLabel>
          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                ...inputStyle,
                paddingRight: "44px",
                ...(errors.password ? { border: "1px solid var(--neuron-semantic-danger)" } : {}),
              }}
            />
            <button
              onClick={() => setShowPassword((v) => !v)}
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--neuron-ink-muted)",
                display: "flex",
              }}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <FieldError message={errors.password} />
        </div>

        <div style={{ display: "flex", alignItems: "flex-start", gap: "6px", marginBottom: "8px" }}>
          <AlertCircle size={14} style={{ color: "var(--neuron-semantic-warn)", flexShrink: 0, marginTop: "2px" }} />
          <p style={{ fontSize: "12px", color: "var(--neuron-semantic-warn)" }}>
            Share this password securely. The employee can update it from their Settings.
          </p>
        </div>

      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </SidePanel>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```
Expected: exits 0. (EditUserPanel may still cause errors — proceed to Task 7.)

- [ ] **Step 3: Commit (after Task 7)**

Defer to after Task 7. See end of Task 7.

---

## Task 7: EditUserPanel

**Files:**
- Create: `src/components/admin/EditUserPanel.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/admin/EditUserPanel.tsx`:

```tsx
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { supabase } from "../../utils/supabase/client";
import { SidePanel } from "../common/SidePanel";
import { CustomDropdown } from "../bd/CustomDropdown";

type UserRow = {
  id: string;
  email: string;
  name: string;
  department: string;
  role: string;
  team_id: string | null;
  is_active: boolean;
  avatar_url?: string | null;
  teams: { name: string } | null;
};

interface Props {
  isOpen: boolean;
  user: UserRow;
  onClose: () => void;
  onSaved: () => void;
}

const DEPARTMENTS = [
  "Business Development", "Pricing", "Operations", "Accounting", "HR", "Executive",
];

const ROLES = [
  { value: "staff", label: "Staff" },
  { value: "team_leader", label: "Team Leader" },
  { value: "manager", label: "Manager" },
];

function FieldLabel({ children }: { children: string }) {
  return (
    <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--neuron-ink-primary)", marginBottom: "6px" }}>
      {children}
    </label>
  );
}

export function EditUserPanel({ isOpen, user, onClose, onSaved }: Props) {
  const [department, setDepartment] = useState(user.department);
  const [role, setRole] = useState(user.role);
  const [teamId, setTeamId] = useState(user.team_id || "");
  const [isActive, setIsActive] = useState(user.is_active);
  const [saving, setSaving] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => {
    supabase
      .from("teams")
      .select("id, name")
      .order("name")
      .then(({ data }) => setTeams(data || []));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("users")
        .update({ department, role, team_id: teamId || null, is_active: isActive })
        .eq("id", user.id);

      if (error) throw new Error(error.message);
      toast.success("User updated");
      onSaved();
    } catch (err: any) {
      toast.error(err.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    setDeactivating(true);
    try {
      const { error } = await supabase
        .from("users")
        .update({ is_active: false })
        .eq("id", user.id);

      if (error) throw new Error(error.message);
      toast.success(`${user.name} has been deactivated`);
      onSaved();
    } catch (err: any) {
      toast.error(err.message || "Failed to deactivate account");
    } finally {
      setDeactivating(false);
    }
  };

  const initials = (user.name || user.email || "U").charAt(0).toUpperCase();

  const pillStyle = (selected: boolean, variant: "active" | "inactive"): React.CSSProperties => {
    if (selected) {
      return variant === "active"
        ? { backgroundColor: "var(--neuron-semantic-success-bg)", color: "var(--neuron-semantic-success-text)", border: "1px solid var(--neuron-semantic-success-border)" }
        : { backgroundColor: "var(--neuron-semantic-danger-bg)", color: "var(--neuron-semantic-danger)", border: "1px solid var(--neuron-semantic-danger-border)" };
    }
    return { backgroundColor: "var(--neuron-bg-elevated)", color: "var(--neuron-ink-muted)", border: "1px solid var(--neuron-ui-border)" };
  };

  const panelTitle = (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <div
        style={{
          width: "28px",
          height: "28px",
          borderRadius: "50%",
          backgroundColor: "var(--neuron-brand-green-100)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        {user.avatar_url ? (
          <img src={user.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--neuron-action-primary)" }}>{initials}</span>
        )}
      </div>
      <div>
        <p style={{ fontSize: "16px", fontWeight: 600, color: "var(--neuron-ink-primary)", lineHeight: "1.2" }}>{user.name}</p>
        <p style={{ fontSize: "12px", color: "var(--neuron-ink-muted)" }}>{user.department}</p>
      </div>
    </div>
  );

  const footer = (
    <div style={{ padding: "16px 24px", borderTop: "1px solid var(--neuron-ui-border)", display: "flex", justifyContent: "space-between", backgroundColor: "var(--neuron-bg-elevated)" }}>
      <button
        onClick={onClose}
        style={{ height: "40px", padding: "0 20px", background: "none", border: "none", color: "var(--neuron-ink-muted)", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}
      >
        Cancel
      </button>
      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          height: "40px",
          padding: "0 20px",
          borderRadius: "8px",
          background: "var(--neuron-action-primary)",
          border: "none",
          color: "var(--neuron-action-primary-text)",
          fontSize: "13px",
          fontWeight: 600,
          cursor: saving ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          opacity: saving ? 0.8 : 1,
        }}
      >
        {saving && <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />}
        {saving ? "Saving…" : "Save Changes"}
      </button>
    </div>
  );

  return (
    <SidePanel isOpen={isOpen} onClose={onClose} title={panelTitle} footer={footer} width="480px">
      <div style={{ padding: "24px", overflowY: "auto", height: "100%" }}>

        {/* Read-only email */}
        <div style={{ marginBottom: "20px" }}>
          <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--neuron-ink-muted)", marginBottom: "4px" }}>Email</p>
          <p style={{ fontSize: "13px", color: "var(--neuron-ink-primary)" }}>{user.email}</p>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <FieldLabel>Department</FieldLabel>
          <CustomDropdown
            label=""
            value={department}
            onChange={setDepartment}
            options={DEPARTMENTS.map((d) => ({ value: d, label: d }))}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <FieldLabel>Role</FieldLabel>
          <CustomDropdown
            label=""
            value={role}
            onChange={setRole}
            options={ROLES}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <FieldLabel>Team</FieldLabel>
          <CustomDropdown
            label=""
            value={teamId}
            onChange={setTeamId}
            options={[
              { value: "", label: "No team" },
              ...teams.map((t) => ({ value: t.id, label: t.name })),
            ]}
          />
        </div>

        <div style={{ marginBottom: "24px" }}>
          <FieldLabel>Status</FieldLabel>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => setIsActive(true)}
              style={{
                height: "36px",
                padding: "0 16px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 500,
                cursor: "pointer",
                ...pillStyle(isActive, "active"),
              }}
            >
              Active
            </button>
            <button
              onClick={() => setIsActive(false)}
              style={{
                height: "36px",
                padding: "0 16px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 500,
                cursor: "pointer",
                ...pillStyle(!isActive, "inactive"),
              }}
            >
              Inactive
            </button>
          </div>
        </div>

        {/* Deactivate section */}
        <div style={{ borderTop: "1px solid var(--neuron-ui-border)", paddingTop: "24px", marginTop: "8px" }}>
          {!showDeactivateConfirm ? (
            <button
              onClick={() => setShowDeactivateConfirm(true)}
              style={{ background: "none", border: "none", color: "var(--neuron-semantic-danger)", fontSize: "13px", cursor: "pointer", fontWeight: 500, padding: 0 }}
            >
              Deactivate Account
            </button>
          ) : (
            <div>
              <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--neuron-ink-primary)", marginBottom: "6px" }}>
                Deactivate {user.name}?
              </p>
              <p style={{ fontSize: "13px", color: "var(--neuron-ink-muted)", marginBottom: "16px" }}>
                This will prevent them from logging in. Their data will not be deleted.
              </p>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => setShowDeactivateConfirm(false)}
                  style={{
                    height: "36px", padding: "0 16px", borderRadius: "8px",
                    background: "var(--neuron-bg-elevated)", border: "1px solid var(--neuron-ui-border)",
                    color: "var(--neuron-ink-muted)", fontSize: "13px", cursor: "pointer", fontWeight: 500,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeactivate}
                  disabled={deactivating}
                  style={{
                    height: "36px", padding: "0 16px", borderRadius: "8px",
                    background: "var(--neuron-semantic-danger)", border: "none",
                    color: "var(--neuron-action-primary-text)", fontSize: "13px", cursor: deactivating ? "not-allowed" : "pointer",
                    fontWeight: 600, display: "flex", alignItems: "center", gap: "6px",
                    opacity: deactivating ? 0.8 : 1,
                  }}
                >
                  {deactivating && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
                  {deactivating ? "Deactivating…" : "Deactivate"}
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </SidePanel>
  );
}
```

- [ ] **Step 2: Verify build compiles**

```bash
npm run build
```
Expected: exits 0, no TypeScript errors across Tasks 5, 6, and 7.

- [ ] **Step 3: Commit Tasks 5, 6, and 7 together**

```bash
git add src/components/admin/UserManagement.tsx src/components/admin/CreateUserPanel.tsx src/components/admin/EditUserPanel.tsx
git commit -m "feat: add UserManagement page, CreateUserPanel, EditUserPanel"
```

---

## Task 8: Wire Sidebar + Routes

**Files:**
- Modify: `src/components/NeuronSidebar.tsx`
- Modify: `src/App.tsx`

### Part A: NeuronSidebar.tsx

- [ ] **Step 1: Add `"settings"` and `"admin-users"` to the Page type**

In `src/components/NeuronSidebar.tsx`, find the `Page` type definition (line 36). It currently ends with `... | "profile" | "admin" | ...`. Make two changes:

1. Add `"settings"` and `"admin-users"` to the union (replace `"profile"` with `"settings"`, add `"admin-users"`):

```tsx
type Page = "dashboard" | "bd-contacts" | "bd-customers" | "bd-inquiries" | "projects" | "bd-projects" | "bd-contracts" | "bd-tasks" | "bd-activities" | "bd-budget-requests" | "bd-reports" | "pricing-contacts" | "pricing-customers" | "pricing-quotations" | "pricing-projects" | "pricing-contracts" | "pricing-vendors" | "pricing-reports" | "ops-forwarding" | "ops-brokerage" | "ops-trucking" | "ops-marine-insurance" | "ops-others" | "ops-reports" | "operations" | "acct-transactions" | "acct-evouchers" | "acct-billings" | "acct-invoices" | "acct-collections" | "acct-expenses" | "acct-coa" | "acct-reports" | "acct-projects" | "acct-contracts" | "acct-customers" | "acct-bookings" | "acct-catalog" | "acct-financials" | "hr" | "calendar" | "inbox" | "ticket-queue" | "settings" | "admin-users" | "admin" | "ticket-testing" | "activity-log" | "design-system";
```

- [ ] **Step 2: Add Users nav item before the profile card footer**

In `NeuronSidebar.tsx`, find the footer section (around line 885):
```tsx
{/* Footer */}
<div className="px-4 py-4" style={{ borderTop: "1px solid var(--neuron-ui-border)" }}>
  {/* User Profile */}
  {currentUser && currentUser.name && (
```

**Before** that footer `<div>`, add the Users nav entry (conditional on Executive department):

```tsx
{/* Users nav entry — Executive only */}
{currentUser?.department === 'Executive' && (
  <div style={{ padding: "0 16px 8px" }}>
    {(() => {
      const isActive = currentPage === "admin-users";
      return (
        <button
          onClick={() => onNavigate("admin-users")}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150"
          style={{
            height: "40px",
            backgroundColor: isActive ? "var(--neuron-state-selected)" : "transparent",
            border: isActive ? "1.5px solid var(--neuron-ui-active-border)" : "1.5px solid transparent",
            color: isActive ? "var(--neuron-brand-green)" : "var(--neuron-ink-secondary)",
            fontWeight: isActive ? 600 : 400,
            justifyContent: isCollapsed ? "center" : "flex-start",
            paddingLeft: isCollapsed ? "0" : "12px",
            paddingRight: isCollapsed ? "0" : "12px",
          }}
          onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = "var(--neuron-state-hover)"; }}
          onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = "transparent"; }}
          title={isCollapsed ? "Users" : undefined}
        >
          <Users
            size={20}
            style={{ color: isActive ? "var(--neuron-brand-green)" : "var(--neuron-ink-muted)", flexShrink: 0 }}
          />
          {!isCollapsed && <span style={{ fontSize: "14px", lineHeight: "20px" }}>Users</span>}
        </button>
      );
    })()}
  </div>
)}
```

Note: `Users` is already imported at the top of `NeuronSidebar.tsx` (line 5). No new import needed.

- [ ] **Step 3: Update the profile card to navigate to "settings"**

In `NeuronSidebar.tsx`, find the profile card button (around line 890):
```tsx
onClick={() => onNavigate("profile")}
```
Change to:
```tsx
onClick={() => onNavigate("settings")}
```

Also find the two occurrences of `currentPage === "profile"` in that button block and change them to `currentPage === "settings"`:
```tsx
// Line ~893:
backgroundColor: currentPage === "settings" ? "var(--neuron-state-selected)" : "var(--neuron-bg-page)",
border: currentPage === "settings" ? "1.5px solid var(--neuron-ui-active-border)" : "1.5px solid transparent",
// ...
// Line ~901 and 907:
onMouseEnter={(e) => {
  if (currentPage !== "settings") {
    e.currentTarget.style.backgroundColor = "var(--neuron-state-hover)";
  }
}}
onMouseLeave={(e) => {
  if (currentPage !== "settings") {
    e.currentTarget.style.backgroundColor = "var(--neuron-bg-page)";
  }
}}
```

### Part B: App.tsx

- [ ] **Step 4: Add lazy import for Settings and UserManagement**

In `src/App.tsx`, after the existing lazy imports (around line 37), add:

```tsx
const Settings = lazy(() => import("./components/settings/Settings").then((m) => ({ default: m.Settings })));
const UserManagement = lazy(() => import("./components/admin/UserManagement").then((m) => ({ default: m.UserManagement })));
```

- [ ] **Step 5: Update getCurrentPage() in RouteWrapper**

In `src/App.tsx`, find `getCurrentPage()` (around line 438). Add two cases — replace the existing `if (path.startsWith("/profile")) return "profile";` line with:

```tsx
if (path.startsWith("/settings")) return "settings";
if (path.startsWith("/admin/users")) return "admin-users";
```

Keep `if (path.startsWith("/admin")) return "admin";` below those two lines (order matters — `/admin/users` must be checked before `/admin`).

- [ ] **Step 6: Update handleNavigate routeMap**

In `src/App.tsx`, find the `routeMap` in `handleNavigate` (around line 493). Replace the `"profile": "/profile"` entry with:

```tsx
"settings": "/settings",
"admin-users": "/admin/users",
```

- [ ] **Step 7: Replace the ProfilePage function and update routes**

In `src/App.tsx`, find the `ProfilePage` function (line 1133) and replace it:

```tsx
function SettingsPage() {
  return (
    <RouteWrapper page="settings">
      <Settings />
    </RouteWrapper>
  );
}
```

Find the `UserManagementPage` function (it doesn't exist yet) — add it after `SettingsPage`:

```tsx
function UserManagementPage() {
  return (
    <RouteWrapper page="admin-users">
      <UserManagement />
    </RouteWrapper>
  );
}
```

- [ ] **Step 8: Update the routes**

In `src/App.tsx`, find the Open routes section (around line 1293):
```tsx
{/* Open to all authenticated users */}
<Route path="/calendar" element={<CalendarPage />} />
<Route path="/inbox" element={<InboxPageWrapper />} />
<Route path="/profile" element={<ProfilePage />} />
```

Change `/profile` to `/settings`:
```tsx
<Route path="/settings" element={<SettingsPage />} />
```

Add `/admin/users` inside the Executive GuardedLayout (around line 1289):
```tsx
{/* Executive only routes */}
<Route element={<GuardedLayout allowedDepartments={["Executive"]} />}>
  <Route path="/admin" element={<AdminPage />} />
  <Route path="/admin/users" element={<UserManagementPage />} />
</Route>
```

- [ ] **Step 9: Verify build**

```bash
npm run build
```
Expected: exits 0, no TypeScript errors.

- [ ] **Step 10: Smoke test in browser**

```bash
npm run dev
```

Verify:
1. Navigate to `/settings` — Settings page renders with Profile, Account, Password sections
2. Update name field and click "Save Profile" — success toast appears, name updates in sidebar profile card
3. Fill both password fields with a valid 8-char password — "Update Password" button works, toast appears
4. Log in as an Executive account — sidebar shows "Users" entry above the profile card
5. Click "Users" — User Management page renders with the members table
6. Click "+ Create Account" — CreateUserPanel slides in with all fields
7. Fill form and submit — new account created, panel closes, table refreshes
8. Click any user row — EditUserPanel slides in with their data pre-populated
9. Change department/role and click "Save Changes" — user record updates, panel closes

- [ ] **Step 11: Commit**

```bash
git add src/components/NeuronSidebar.tsx src/App.tsx
git commit -m "feat: wire settings and admin-users routes, update sidebar navigation"
```

---

## Post-Implementation Checklist

Run through the spec's UI/UX checklist before calling this done:

- [ ] No emojis used as icons — all Lucide SVG
- [ ] All inputs have visible labels (not placeholder-only)
- [ ] Errors appear below each specific field
- [ ] Inline validation fires on blur, not keystroke
- [ ] Password fields have show/hide toggle
- [ ] Submit buttons show loading spinner during async ops
- [ ] Deactivate action is red `#B42318` with inline confirmation before executing
- [ ] Read-only fields in Account section are visually distinct (typographic only, no input borders)
- [ ] Team field in CreateUserPanel only shows when department = Operations
- [ ] `sonner@2.0.3` import used for all toasts (not `sonner`)
- [ ] SidePanel component used for both panels (not custom modals)
- [ ] DataTable component used for the users table
- [ ] Sidebar Users entry only visible to `user.department === 'Executive'` users

---

## Manual Cleanup Reminder

Delete these 3 test Executive accounts from Supabase Auth Dashboard (Authentication → Users) before going to production:

| Email | Reason |
|---|---|
| `test@user2.ph` | Test account with full Executive bypass |
| `codextest+20260318a@example.com` | Automated test account |
| `audit+20260324210815@example.com` | QA audit account |

---

*Plan written 2026-03-27. Based on approved spec at `src/docs/specs/2026-03-27-settings-account-management-design.md`.*
