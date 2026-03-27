import { useState, useEffect, useRef } from "react";
import { Eye, EyeOff, Loader2, Monitor, Moon, Palette, Pencil, Sun, X } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { supabase } from "../../utils/supabase/client";
import { useUser } from "../../hooks/useUser";
import { syncWorkspaceTheme } from "../../theme/useWorkspaceTheme";
import { getThemeModePreference, setThemeModePreference } from "../../theme/themeMode";
import { getWorkspaceThemeSettings, saveWorkspaceThemeSettings } from "../../theme/themeSettings";
import {
  DEFAULT_WORKSPACE_THEME_SEEDS,
  ThemeModePreference,
  WorkspaceThemeSeeds,
} from "../../theme/workspaceTheme";

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

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
  backgroundColor: "var(--neuron-bg-page)",
  outline: "none",
  boxSizing: "border-box",
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
          ...(focused ? { border: "1px solid var(--neuron-ui-active-border)", boxShadow: "var(--neuron-state-focus-ring)" } : {}),
          ...(error ? { border: "1px solid var(--neuron-semantic-danger)" } : {}),
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

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      backgroundColor: "var(--neuron-bg-elevated)",
      border: "1px solid var(--neuron-ui-border)",
      borderRadius: "12px",
      padding: "24px",
      ...style,
    }}>
      {children}
    </div>
  );
}

function CardTitle({ children }: { children: string }) {
  return (
    <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--neuron-ink-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "20px" }}>
      {children}
    </p>
  );
}

function AppearanceModeOption({
  active,
  label,
  description,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number }>;
  onClick: () => void;
}) {
  const Icon = icon;

  return (
    <button
      onClick={onClick}
      style={{
        textAlign: "left",
        padding: "16px",
        borderRadius: "12px",
        border: active ? "1px solid var(--neuron-action-primary)" : "1px solid var(--neuron-ui-border)",
        backgroundColor: active ? "var(--neuron-state-selected)" : "var(--neuron-bg-elevated)",
        cursor: "pointer",
        transition: "all 150ms ease",
      }}
      onMouseEnter={(event) => {
        if (!active) {
          event.currentTarget.style.backgroundColor = "var(--neuron-state-hover)";
        }
      }}
      onMouseLeave={(event) => {
        if (!active) {
          event.currentTarget.style.backgroundColor = "var(--neuron-bg-elevated)";
        }
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
        <Icon size={16} />
        <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--neuron-ink-primary)" }}>{label}</span>
      </div>
      <p style={{ margin: 0, fontSize: "12px", lineHeight: "18px", color: "var(--neuron-ink-muted)" }}>{description}</p>
    </button>
  );
}

function ColorSeedControl({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div
      style={{
        border: "1px solid var(--neuron-ui-border)",
        borderRadius: "12px",
        padding: "16px",
        backgroundColor: "var(--neuron-bg-page)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", marginBottom: "12px" }}>
        <div>
          <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--neuron-ink-primary)", marginBottom: "4px" }}>{label}</p>
          <p style={{ fontSize: "12px", lineHeight: "18px", color: "var(--neuron-ink-muted)", margin: 0 }}>{description}</p>
        </div>
        <input
          type="color"
          aria-label={label}
          value={value}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          style={{
            width: "44px",
            height: "44px",
            padding: 0,
            border: "1px solid var(--neuron-ui-border)",
            borderRadius: "10px",
            background: "transparent",
            cursor: "pointer",
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "10px 12px",
          borderRadius: "10px",
          backgroundColor: "var(--neuron-bg-elevated)",
          border: "1px solid var(--neuron-ui-border)",
        }}
      >
        <div
          style={{
            width: "18px",
            height: "18px",
            borderRadius: "999px",
            backgroundColor: value,
            border: "1px solid rgba(255,255,255,0.16)",
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: "12px", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", color: "var(--neuron-ink-secondary)" }}>
          {value}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function Settings() {
  const { user, session, setUser } = useUser();

  // Profile edit state
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [nameError, setNameError] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatar_url || null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Team name
  const [teamName, setTeamName] = useState<string | null>(null);

  // Password (hidden by default)
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({ new: "", confirm: "" });
  const [savingPassword, setSavingPassword] = useState(false);

  // Appearance
  const [themeModePreference, setThemeModePreferenceState] = useState<ThemeModePreference>(() => getThemeModePreference());
  const [themeSeeds, setThemeSeeds] = useState<WorkspaceThemeSeeds>(DEFAULT_WORKSPACE_THEME_SEEDS);
  const [savedThemeSeeds, setSavedThemeSeeds] = useState<WorkspaceThemeSeeds>(DEFAULT_WORKSPACE_THEME_SEEDS);
  const [loadingTheme, setLoadingTheme] = useState(true);
  const [savingTheme, setSavingTheme] = useState(false);

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

  useEffect(() => {
    let active = true;

    async function loadThemeSettings() {
      setLoadingTheme(true);

      try {
        const settings = await getWorkspaceThemeSettings();
        if (!active) return;

        setThemeSeeds(settings.seeds);
        setSavedThemeSeeds(settings.seeds);
        setThemeModePreferenceState(getThemeModePreference());
      } catch (error) {
        console.error(error);
        if (active) {
          toast.error("Unable to load appearance settings");
        }
      } finally {
        if (active) {
          setLoadingTheme(false);
        }
      }
    }

    void loadThemeSettings();

    return () => {
      active = false;
    };
  }, []);

  const authUid = session?.user?.id;
  const displayAvatar = avatarPreview || avatarUrl;
  const initials = (user?.name || user?.email || "U").charAt(0).toUpperCase();

  const roleLabel =
    user?.role === "team_leader" ? "Team Leader" :
    user?.role === "manager" ? "Manager" :
    user?.role === "staff" ? "Staff" : user?.role || "";

  // ── Avatar ───────────────────────────────────────────────────────────────

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

  // ── Profile save ─────────────────────────────────────────────────────────

  const handleSaveProfile = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) { setNameError("Name is required"); return; }
    setNameError("");
    setSavingProfile(true);

    try {
      let newAvatarUrl = avatarUrl;

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

      if (!avatarFile && avatarUrl === null && user?.avatar_url && authUid) {
        const { data: files } = await supabase.storage.from("avatars").list(authUid);
        if (files && files.length > 0) {
          await supabase.storage.from("avatars").remove(files.map((f) => `${authUid}/${f.name}`));
        }
      }

      const { error } = await supabase
        .from("users")
        .update({ name: trimmedName, phone: phone.trim() || null, avatar_url: newAvatarUrl })
        .eq("id", user!.id);
      if (error) throw new Error(error.message);

      setAvatarUrl(newAvatarUrl);
      setAvatarFile(null);
      setAvatarPreview(null);
      const updated = { ...user!, name: trimmedName, phone: phone.trim() || null, avatar_url: newAvatarUrl };
      setUser(updated);
      localStorage.setItem("neuron_user", JSON.stringify(updated));
      toast.success("Profile updated");
      setEditing(false);
    } catch (err) {
      toast.error("Failed to update — try again");
      console.error(err);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCancelEdit = () => {
    setName(user?.name || "");
    setPhone(user?.phone || "");
    setAvatarUrl(user?.avatar_url || null);
    setAvatarPreview(null);
    setAvatarFile(null);
    setNameError("");
    setEditing(false);
  };

  // ── Password ──────────────────────────────────────────────────────────────

  const validateNewPassword = () => {
    if (newPassword && newPassword.length < 8)
      setPasswordErrors((p) => ({ ...p, new: "Password must be at least 8 characters" }));
    else setPasswordErrors((p) => ({ ...p, new: "" }));
  };

  const validateConfirmPassword = () => {
    if (confirmPassword && confirmPassword !== newPassword)
      setPasswordErrors((p) => ({ ...p, confirm: "Passwords do not match" }));
    else setPasswordErrors((p) => ({ ...p, confirm: "" }));
  };

  const handleUpdatePassword = async () => {
    validateNewPassword();
    validateConfirmPassword();
    if (!newPassword) { setPasswordErrors((p) => ({ ...p, new: "New password is required" })); return; }
    if (newPassword.length < 8) return;
    if (newPassword !== confirmPassword) { setPasswordErrors((p) => ({ ...p, confirm: "Passwords do not match" })); return; }

    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw new Error(error.message);
      toast.success("Password updated");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordForm(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to update password");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleThemeModeChange = (preference: ThemeModePreference) => {
    setThemeModePreference(preference);
    setThemeModePreferenceState(preference);
  };

  const handleThemeSeedChange = (key: keyof WorkspaceThemeSeeds, value: string) => {
    setThemeSeeds((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleResetThemeEdits = () => {
    setThemeSeeds(savedThemeSeeds);
  };

  const handleSaveTheme = async () => {
    setSavingTheme(true);

    try {
      const savedSettings = await saveWorkspaceThemeSettings(themeSeeds);
      const syncedTheme = await syncWorkspaceTheme();

      if (syncedTheme.error) {
        throw syncedTheme.error;
      }

      setThemeSeeds(savedSettings.seeds);
      setSavedThemeSeeds(savedSettings.seeds);
      toast.success("Appearance updated");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update appearance");
    } finally {
      setSavingTheme(false);
    }
  };

  const hasUnsavedThemeChanges = JSON.stringify(themeSeeds) !== JSON.stringify(savedThemeSeeds);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", backgroundColor: "var(--neuron-bg-page)" }}>

      {/* Page Header */}
      <div style={{ padding: "32px 48px 24px", borderBottom: "1px solid var(--neuron-ui-border)", backgroundColor: "var(--neuron-bg-elevated)" }}>
        <h1 style={{ fontSize: "32px", fontWeight: 600, color: "var(--neuron-ink-primary)", letterSpacing: "-1.2px", marginBottom: "4px" }}>
          Settings
        </h1>
        <p style={{ fontSize: "14px", color: "var(--neuron-ink-muted)" }}>Manage your account and personal preferences</p>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "40px 48px" }}>
        <div style={{ maxWidth: "600px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* ── Profile card ─────────────────────────────────────────────── */}
          <Card>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <CardTitle>Profile</CardTitle>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    height: "32px", padding: "0 12px",
                    border: "1px solid var(--neuron-ui-border)", borderRadius: "8px",
                    background: "none", cursor: "pointer",
                    fontSize: "13px", fontWeight: 500, color: "var(--neuron-ink-secondary)",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--neuron-state-hover)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                >
                  <Pencil size={14} />
                  Edit
                </button>
              )}
            </div>

            {editing ? (
              /* ── Edit mode ─────────────────────────────────────────────── */
              <div>
                {/* Avatar upload */}
                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
                  <div style={{
                    width: "64px", height: "64px", borderRadius: "50%", flexShrink: 0,
                    backgroundColor: displayAvatar ? "transparent" : "var(--neuron-brand-green-100)",
                    display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
                  }}>
                    {displayAvatar
                      ? <img src={displayAvatar} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <span style={{ fontSize: "24px", fontWeight: 600, color: "var(--neuron-action-primary)" }}>{initials}</span>
                    }
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarSelect} style={{ display: "none" }} />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      style={{ fontSize: "13px", fontWeight: 500, color: "var(--neuron-action-primary)", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                    >
                      Upload photo
                    </button>
                    {displayAvatar && (
                      <button
                        onClick={handleRemoveAvatar}
                        style={{ fontSize: "13px", color: "var(--neuron-ink-muted)", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                {/* Name */}
                <div style={{ marginBottom: "16px" }}>
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
                  <TextInput value={phone} onChange={setPhone} />
                  <p style={{ fontSize: "12px", color: "var(--neuron-ink-muted)", marginTop: "4px" }}>e.g. +63 917 123 4567</p>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                  <button
                    onClick={handleCancelEdit}
                    style={{
                      height: "36px", padding: "0 16px", borderRadius: "8px",
                      border: "1px solid var(--neuron-ui-border)", background: "none",
                      fontSize: "13px", fontWeight: 500, color: "var(--neuron-ink-secondary)", cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    style={{
                      height: "36px", padding: "0 16px", borderRadius: "8px",
                      border: "none", background: "var(--neuron-action-primary)",
                      fontSize: "13px", fontWeight: 600, color: "var(--neuron-action-primary-text)",
                      cursor: savingProfile ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", gap: "6px",
                      opacity: savingProfile ? 0.8 : 1,
                    }}
                  >
                    {savingProfile && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
                    {savingProfile ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </div>
            ) : (
              /* ── View mode ─────────────────────────────────────────────── */
              <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                {/* Avatar */}
                <div style={{
                  width: "64px", height: "64px", borderRadius: "50%", flexShrink: 0,
                  backgroundColor: displayAvatar ? "transparent" : "var(--neuron-brand-green-100)",
                  display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
                }}>
                  {displayAvatar
                    ? <img src={displayAvatar} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <span style={{ fontSize: "24px", fontWeight: 600, color: "var(--neuron-action-primary)" }}>{initials}</span>
                  }
                </div>

                {/* Identity */}
                <div>
                  <p style={{ fontSize: "17px", fontWeight: 600, color: "var(--neuron-ink-primary)", marginBottom: "2px" }}>
                    {user?.name || "—"}
                  </p>
                  <p style={{ fontSize: "13px", color: "var(--neuron-ink-muted)", marginBottom: "4px" }}>
                    {user?.department}{roleLabel ? ` · ${roleLabel}` : ""}
                  </p>
                  {(user?.phone) && (
                    <p style={{ fontSize: "13px", color: "var(--neuron-ink-secondary)" }}>
                      {user.phone}
                    </p>
                  )}
                </div>
              </div>
            )}
          </Card>

          {/* ── Account card (read-only) ──────────────────────────────────── */}
          <Card>
            <CardTitle>Account</CardTitle>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 24px" }}>
              {[
                { label: "Email address", value: user?.email || "—" },
                { label: "Department", value: user?.department || "—" },
                { label: "Role", value: roleLabel || "—" },
                { label: "Team", value: teamName || "—" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--neuron-ink-muted)", marginBottom: "2px" }}>{label}</p>
                  <p style={{ fontSize: "13px", color: "var(--neuron-ink-primary)" }}>{value}</p>
                </div>
              ))}
            </div>

          </Card>

          {/* Appearance card */}
          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
              <Palette size={16} color="var(--neuron-ink-muted)" />
              <CardTitle>Appearance</CardTitle>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div>
                <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--neuron-ink-primary)", marginBottom: "6px" }}>
                  Theme mode
                </p>
                <p style={{ fontSize: "12px", color: "var(--neuron-ink-muted)", margin: "0 0 14px" }}>
                  Choose how Neuron should render by default on this device.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "12px" }}>
                  <AppearanceModeOption
                    active={themeModePreference === "light"}
                    label="Light"
                    description="Keep the interface bright and neutral."
                    icon={Sun}
                    onClick={() => handleThemeModeChange("light")}
                  />
                  <AppearanceModeOption
                    active={themeModePreference === "dark"}
                    label="Dark"
                    description="Use the darker workspace palette."
                    icon={Moon}
                    onClick={() => handleThemeModeChange("dark")}
                  />
                  <AppearanceModeOption
                    active={themeModePreference === "system"}
                    label="System"
                    description="Match your operating system preference."
                    icon={Monitor}
                    onClick={() => handleThemeModeChange("system")}
                  />
                </div>
              </div>

              <div>
                <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--neuron-ink-primary)", marginBottom: "6px" }}>
                  Workspace colors
                </p>
                <p style={{ fontSize: "12px", color: "var(--neuron-ink-muted)", margin: "0 0 14px" }}>
                  Tune the main brand colors used across cards, actions, and surfaces.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <ColorSeedControl
                    label="Primary"
                    description="Main brand tone used for actions and highlights."
                    value={themeSeeds.primary}
                    onChange={(value) => handleThemeSeedChange("primary", value)}
                  />
                  <ColorSeedControl
                    label="Accent"
                    description="Secondary tone used for supportive emphasis."
                    value={themeSeeds.accent}
                    onChange={(value) => handleThemeSeedChange("accent", value)}
                  />
                  <ColorSeedControl
                    label="Surface tint"
                    description="Tint blended into cards, panels, and surfaces."
                    value={themeSeeds.surfaceTint}
                    onChange={(value) => handleThemeSeedChange("surfaceTint", value)}
                  />
                  <ColorSeedControl
                    label="Neutral base"
                    description="Base neutral used to balance the overall palette."
                    value={themeSeeds.neutralBase}
                    onChange={(value) => handleThemeSeedChange("neutralBase", value)}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                <p style={{ fontSize: "12px", color: "var(--neuron-ink-muted)", margin: 0 }}>
                  {loadingTheme ? "Loading saved appearance settings..." : "Color changes apply after saving."}
                </p>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={handleResetThemeEdits}
                    disabled={!hasUnsavedThemeChanges || savingTheme || loadingTheme}
                    style={{
                      height: "36px",
                      padding: "0 16px",
                      borderRadius: "8px",
                      border: "1px solid var(--neuron-ui-border)",
                      background: "none",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "var(--neuron-ink-secondary)",
                      cursor: !hasUnsavedThemeChanges || savingTheme || loadingTheme ? "not-allowed" : "pointer",
                      opacity: !hasUnsavedThemeChanges || savingTheme || loadingTheme ? 0.6 : 1,
                    }}
                  >
                    Reset
                  </button>
                  <button
                    onClick={handleSaveTheme}
                    disabled={!hasUnsavedThemeChanges || savingTheme || loadingTheme}
                    style={{
                      height: "36px",
                      padding: "0 16px",
                      borderRadius: "8px",
                      border: "none",
                      background: "var(--neuron-action-primary)",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "var(--neuron-action-primary-text)",
                      cursor: !hasUnsavedThemeChanges || savingTheme || loadingTheme ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      opacity: !hasUnsavedThemeChanges || savingTheme || loadingTheme ? 0.7 : 1,
                    }}
                  >
                    {savingTheme && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
                    {savingTheme ? "Saving..." : "Save colors"}
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* Password card */}
          <Card>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--neuron-ink-primary)", marginBottom: "2px" }}>Password</p>
                <p style={{ fontSize: "13px", color: "var(--neuron-ink-muted)" }}>Last changed: managed by Supabase Auth</p>
              </div>
              {!showPasswordForm && (
                <button
                  onClick={() => setShowPasswordForm(true)}
                  style={{
                    height: "32px", padding: "0 12px",
                    border: "1px solid var(--neuron-ui-border)", borderRadius: "8px",
                    background: "none", cursor: "pointer",
                    fontSize: "13px", fontWeight: 500, color: "var(--neuron-ink-secondary)",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--neuron-state-hover)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                >
                  Change password
                </button>
              )}
              {showPasswordForm && (
                <button
                  onClick={() => { setShowPasswordForm(false); setNewPassword(""); setConfirmPassword(""); setPasswordErrors({ new: "", confirm: "" }); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--neuron-ink-muted)", display: "flex" }}
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {showPasswordForm && (
              <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid var(--neuron-ui-border)" }}>
                <div style={{ marginBottom: "16px" }}>
                  <FieldLabel required>New password</FieldLabel>
                  <TextInput
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={setNewPassword}
                    onBlur={validateNewPassword}
                    error={passwordErrors.new}
                    rightElement={
                      <button onClick={() => setShowNew((v) => !v)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--neuron-ink-muted)", display: "flex" }}>
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
                      <button onClick={() => setShowConfirm((v) => !v)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--neuron-ink-muted)", display: "flex" }}>
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    }
                  />
                  <FieldError message={passwordErrors.confirm} />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    onClick={handleUpdatePassword}
                    disabled={savingPassword}
                    style={{
                      height: "36px", padding: "0 16px", borderRadius: "8px",
                      border: "none", background: "var(--neuron-action-primary)",
                      fontSize: "13px", fontWeight: 600, color: "var(--neuron-action-primary-text)",
                      cursor: savingPassword ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", gap: "6px",
                      opacity: savingPassword ? 0.8 : 1,
                    }}
                  >
                    {savingPassword && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
                    {savingPassword ? "Updating…" : "Update password"}
                  </button>
                </div>
              </div>
            )}
          </Card>

        </div>
      </div>
    </div>
  );
}
