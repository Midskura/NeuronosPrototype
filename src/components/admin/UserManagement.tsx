import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../utils/supabase/client";
import { queryKeys } from "../../lib/queryKeys";
import { useUser } from "../../hooks/useUser";
import { toast } from "sonner@2.0.3";
import {
  Plus, Users, Shield, UsersRound,
  ChevronDown, ChevronRight, Edit, Trash2, RefreshCw, Search,
} from "lucide-react";
import { DataTable, ColumnDef } from "../common/DataTable";
import { CreateUserPanel } from "./CreateUserPanel";
import { EditUserPanel, type UserRow } from "./EditUserPanel";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

// ─── Types ────────────────────────────────────────────────────────────────────

type Department = "Business Development" | "Pricing" | "Operations" | "Accounting" | "Executive" | "HR";
type Role = "staff" | "team_leader" | "manager";
type ServiceType = "Forwarding" | "Brokerage" | "Trucking" | "Marine Insurance" | "Others";

interface Team {
  id: string;
  name: string;
  department: string;
  leader_id: string | null;
}

interface TeamWithMembers extends Team {
  members: { id: string; name: string; role: Role; email: string }[];
}

type OverrideScope = "department_wide" | "cross_department" | "full";

interface PermissionOverride {
  id: string;
  user_id: string;
  scope: OverrideScope;
  departments: string[] | null;
  granted_by: string | null;
  notes: string | null;
  created_at: string;
  user?: { name: string; email: string; department: string; role: Role };
  grantor?: { name: string } | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEPARTMENTS: Department[] = ["Business Development", "Pricing", "Operations", "Accounting", "Executive", "HR"];
const ROLES: { value: Role; label: string }[] = [
  { value: "staff", label: "Staff" },
  { value: "team_leader", label: "Team Leader" },
  { value: "manager", label: "Manager" },
];
const SERVICE_TYPES: ServiceType[] = ["Forwarding", "Brokerage", "Trucking", "Marine Insurance", "Others"];

const DEPT_COLORS: Record<string, { bg: string; text: string }> = {
  "Business Development": { bg: "#DBEAFE", text: "#1D4ED8" },
  Pricing:               { bg: "var(--theme-status-success-bg)", text: "#065F46" },
  Operations:            { bg: "var(--theme-status-warning-bg)", text: "var(--theme-status-warning-fg)" },
  Accounting:            { bg: "#FCE7F3", text: "#9D174D" },
  Executive:             { bg: "#F3E8FF", text: "#7E22CE" },
  HR:                    { bg: "#E0E7FF", text: "#3730A3" },
};

const ROLE_COLORS: Record<Role, { bg: string; text: string }> = {
  manager:     { bg: "#F3E8FF", text: "#7E22CE" },
  team_leader: { bg: "var(--theme-status-warning-bg)", text: "var(--theme-status-warning-fg)" },
  staff:       { bg: "var(--theme-bg-surface-subtle)", text: "#374151" },
};

const SCOPE_LABELS: Record<OverrideScope, { label: string; description: string; bg: string; text: string }> = {
  full:             { label: "Full Access", description: "Sees everything across all departments.", bg: "#F3E8FF", text: "#7E22CE" },
  department_wide:  { label: "Department Wide", description: "Sees all records in their own department (bypasses team/staff restriction).", bg: "var(--theme-status-warning-bg)", text: "var(--theme-status-warning-fg)" },
  cross_department: { label: "Cross Department", description: "Sees records in selected departments.", bg: "#E0E7FF", text: "#3730A3" },
};

const DEPT_BADGE: Record<string, { bg: string; text: string }> = {
  "Business Development": { bg: "var(--neuron-dept-bd-bg)",         text: "var(--neuron-dept-bd-text)" },
  "Pricing":             { bg: "var(--neuron-dept-pricing-bg)",     text: "var(--neuron-dept-pricing-text)" },
  "Operations":          { bg: "var(--neuron-dept-ops-bg)",         text: "var(--neuron-dept-ops-text)" },
  "Accounting":          { bg: "var(--neuron-dept-accounting-bg)",  text: "var(--neuron-dept-accounting-text)" },
  "HR":                  { bg: "var(--neuron-dept-hr-bg)",          text: "var(--neuron-dept-hr-text)" },
  "Executive":           { bg: "var(--neuron-dept-executive-bg)",   text: "var(--neuron-dept-executive-text)" },
};

// ─── Shared helpers (Users tab) ───────────────────────────────────────────────

function DeptBadge({ dept }: { dept: string }) {
  const colors = DEPT_BADGE[dept] || { bg: "var(--neuron-dept-default-bg)", text: "var(--neuron-dept-default-text)" };
  return (
    <span style={{ borderRadius: "999px", padding: "2px 10px", fontSize: "12px", fontWeight: 500, backgroundColor: colors.bg, color: colors.text }}>
      {dept}
    </span>
  );
}

function StatusDot({ active }: { active: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: active ? "var(--neuron-toggle-active-bg)" : "var(--neuron-toggle-inactive-bg)", flexShrink: 0 }} />
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
      <div style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "var(--neuron-brand-green-100)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
        {user.avatar_url
          ? <img src={user.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--neuron-action-primary)" }}>{initials}</span>}
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

// ─── Users Tab ────────────────────────────────────────────────────────────────

function UsersTab() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<UserRow | null>(null);

  const { data: users = [], isLoading: loading } = useQuery({
    queryKey: queryKeys.users.list(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, email, name, department, role, team_id, is_active, avatar_url, teams(name)")
        .order("name", { ascending: true });
      if (error) {
        console.error("[UserManagement] Failed to fetch users:", error);
        throw error;
      }
      return (data ?? []) as unknown as UserRow[];
    },
  });

  const fetchUsers = () => queryClient.invalidateQueries({ queryKey: queryKeys.users.list() });

  const columns: ColumnDef<UserRow>[] = [
    { header: "Name",       width: "220px", cell: (u) => <AvatarCell user={u} /> },
    { header: "Email",      width: "200px", cell: (u) => <span style={{ fontSize: "13px", color: "var(--neuron-ink-muted)" }}>{u.email}</span> },
    { header: "Department", width: "150px", cell: (u) => <DeptBadge dept={u.department} /> },
    { header: "Role",       width: "100px", cell: (u) => <span style={{ fontSize: "13px", color: "var(--neuron-ink-muted)" }}>{formatRole(u.role)}</span> },
    { header: "Team",       width: "140px", cell: (u) => <span style={{ fontSize: "13px", color: "var(--neuron-ink-muted)" }}>{u.teams?.name || "—"}</span> },
    { header: "Status",     width: "80px",  cell: (u) => <StatusDot active={u.is_active} /> },
  ];

  const emptyMessage = (
    <div style={{ textAlign: "center", padding: "64px 0" }}>
      <Users size={40} style={{ color: "var(--neuron-ui-muted)", margin: "0 auto 16px" }} />
      <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--neuron-ink-primary)", marginBottom: "4px" }}>No team members yet</p>
      <p style={{ fontSize: "13px", color: "var(--neuron-ink-muted)", marginBottom: "20px" }}>Create an account to add someone to your workspace.</p>
      <button
        onClick={() => setShowCreate(true)}
        style={{ height: "40px", padding: "0 20px", borderRadius: "8px", background: "var(--neuron-bg-elevated)", border: "1px solid var(--neuron-action-primary)", color: "var(--neuron-action-primary)", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
      >
        <Plus size={16} />Create Account
      </button>
    </div>
  );

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <p style={{ fontSize: "20px", fontWeight: 600, color: "var(--neuron-ink-primary)" }}>
          Members <span style={{ fontWeight: 400, color: "var(--neuron-ink-muted)" }}>({users.length})</span>
        </p>
        <button
          onClick={() => setShowCreate(true)}
          style={{ height: "40px", padding: "0 16px", borderRadius: "8px", background: "var(--neuron-action-primary)", border: "none", color: "var(--neuron-action-primary-text)", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--neuron-action-primary-hover)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--neuron-action-primary)"; }}
        >
          <Plus size={16} />Create Account
        </button>
      </div>

      <DataTable<UserRow>
        data={users}
        columns={columns}
        isLoading={loading}
        emptyMessage={emptyMessage}
        onRowClick={(u) => setEditUser(u)}
      />

      {showCreate && (
        <CreateUserPanel isOpen={showCreate} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); fetchUsers(); }} />
      )}
      {editUser && (
        <EditUserPanel isOpen={!!editUser} user={editUser} onClose={() => setEditUser(null)} onSaved={() => { setEditUser(null); fetchUsers(); }} />
      )}
    </>
  );
}

// ─── Teams Tab ────────────────────────────────────────────────────────────────

function EditTeamDialog({ team, onClose, onSaved }: { team: Team | null; onClose: () => void; onSaved: () => void }) {
  const [newName, setNewName] = useState(team?.name ?? "");
  const [newDept, setNewDept] = useState<Department>((team?.department as Department) ?? "Business Development");
  const [newLeaderId, setNewLeaderId] = useState(team?.leader_id ?? "");
  const [saving, setSaving] = useState(false);

  const { data: allUsers = [] } = useQuery({
    queryKey: ["users", "active-list"],
    queryFn: async () => {
      const { data } = await supabase.from("users").select("id, name, department").eq("is_active", true).order("name");
      return (data as { id: string; name: string; department: string }[]) ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const deptUsers = allUsers.filter((u) => u.department === newDept);

  const handleSave = async () => {
    if (!team || !newName.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("teams").update({ name: newName.trim(), department: newDept, leader_id: newLeaderId || null }).eq("id", team.id);
    setSaving(false);
    if (error) { toast.error("Failed to update team."); return; }
    toast.success("Team updated.");
    onSaved();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent style={{ maxWidth: "440px" }}>
        <DialogHeader>
          <DialogTitle style={{ fontSize: "18px", color: "var(--theme-text-primary)" }}>Edit Team</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label style={{ fontSize: "13px", marginBottom: "6px", display: "block" }}>Team Name</Label>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus />
          </div>
          <div>
            <Label style={{ fontSize: "13px", marginBottom: "6px", display: "block" }}>Department</Label>
            <Select value={newDept} onValueChange={(v) => { setNewDept(v as Department); setNewLeaderId(""); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label style={{ fontSize: "13px", marginBottom: "6px", display: "block" }}>Team Leader</Label>
            <Select value={newLeaderId} onValueChange={setNewLeaderId}>
              <SelectTrigger><SelectValue placeholder="No leader assigned" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">No leader</SelectItem>
                {deptUsers.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
            <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-[var(--theme-action-primary-bg)] hover:bg-[var(--theme-action-primary-border)] text-white">
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TeamsTab() {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [newName, setNewName] = useState("");
  const [newDept, setNewDept] = useState<Department>("Business Development");
  const [newLeaderId, setNewLeaderId] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: teams = [], refetch: fetchTeams } = useQuery({
    queryKey: ["teams"],
    queryFn: async () => {
      const { data } = await supabase.from("teams").select("id, name, department, leader_id").order("department").order("name");
      return (data as Team[]) ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["users", "active-list"],
    queryFn: async () => {
      const { data } = await supabase.from("users").select("id, name, role, department, email, team_id").eq("is_active", true).order("name");
      return (data as { id: string; name: string; role: Role; department: string; email: string; team_id: string | null }[]) ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const teamsWithMembers: TeamWithMembers[] = teams.map((t) => ({
    ...t,
    members: allUsers.filter((u) => u.team_id === t.id).map((u) => ({ id: u.id, name: u.name, role: u.role, email: u.email })),
  }));

  const byDept = DEPARTMENTS.reduce<Record<string, TeamWithMembers[]>>((acc, dept) => {
    acc[dept] = teamsWithMembers.filter((t) => t.department === dept);
    return acc;
  }, {});

  const deptUsersFor = (dept: Department) => allUsers.filter((u) => u.department === dept);

  const handleCreate = async () => {
    if (!newName.trim()) { toast.error("Team name is required."); return; }
    setSaving(true);
    const { error } = await supabase.from("teams").insert({ name: newName.trim(), department: newDept, leader_id: newLeaderId || null });
    setSaving(false);
    if (error) { toast.error("Failed to create team."); return; }
    toast.success(`Team "${newName}" created.`);
    setCreating(false);
    setNewName(""); setNewDept("Business Development"); setNewLeaderId("");
    fetchTeams();
  };

  const handleDelete = async (teamId: string, teamName: string) => {
    if (!confirm(`Delete team "${teamName}"? Members will be unassigned from this team.`)) return;
    setDeletingId(teamId);
    await supabase.from("users").update({ team_id: null }).eq("team_id", teamId);
    const { error } = await supabase.from("teams").delete().eq("id", teamId);
    setDeletingId(null);
    if (error) { toast.error("Failed to delete team."); return; }
    toast.success(`Team "${teamName}" deleted.`);
    fetchTeams();
    queryClient.invalidateQueries({ queryKey: queryKeys.users.list() });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Header */}
      <div style={{ background: "var(--theme-bg-surface)", border: "1px solid var(--theme-border-default)", borderRadius: "16px", padding: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--theme-text-primary)", marginBottom: "4px" }}>Teams</h3>
            <p style={{ fontSize: "13px", color: "var(--theme-text-muted)" }}>Create teams, assign leaders, and manage members per department.</p>
          </div>
          <button
            onClick={() => { setCreating(true); setNewName(""); setNewDept("Business Development"); setNewLeaderId(""); }}
            style={{ height: "38px", padding: "0 16px", borderRadius: "10px", background: "#0F766E", border: "none", color: "white", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Plus size={14} />New Team
          </button>
        </div>
      </div>

      {/* Department sections */}
      {DEPARTMENTS.map((dept) => {
        const deptTeams = byDept[dept] ?? [];
        return (
          <div key={dept} style={{ background: "var(--theme-bg-surface)", border: "1px solid var(--theme-border-default)", borderRadius: "16px", overflow: "hidden" }}>
            <div style={{ padding: "16px 24px", borderBottom: deptTeams.length > 0 ? "1px solid var(--theme-border-default)" : "none", display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ display: "inline-flex", padding: "3px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: 500, backgroundColor: DEPT_COLORS[dept]?.bg ?? "#F3F4F6", color: DEPT_COLORS[dept]?.text ?? "#374151" }}>
                {dept}
              </span>
              <span style={{ fontSize: "13px", color: "var(--theme-text-muted)" }}>{deptTeams.length} {deptTeams.length === 1 ? "team" : "teams"}</span>
            </div>

            {deptTeams.length === 0 ? (
              <div style={{ padding: "16px 24px", fontSize: "13px", color: "var(--theme-text-muted)" }}>No teams yet.</div>
            ) : (
              <div>
                {deptTeams.map((team, idx) => {
                  const isExpanded = expanded === team.id;
                  const leader = allUsers.find((u) => u.id === team.leader_id);
                  return (
                    <div key={team.id} style={{ borderTop: idx > 0 ? "1px solid var(--theme-border-subtle)" : undefined }}>
                      <div
                        style={{ padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
                        onClick={() => setExpanded(isExpanded ? null : team.id)}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          {isExpanded ? <ChevronDown size={14} style={{ color: "var(--theme-text-muted)" }} /> : <ChevronRight size={14} style={{ color: "var(--theme-text-muted)" }} />}
                          <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--theme-text-primary)" }}>{team.name}</span>
                          <span style={{ fontSize: "12px", color: "var(--theme-text-muted)" }}>{team.members.length} member{team.members.length !== 1 ? "s" : ""}</span>
                          {leader && (
                            <span style={{ fontSize: "12px", color: "var(--theme-action-primary-bg)", background: "var(--theme-bg-surface-tint)", padding: "2px 8px", borderRadius: "999px" }}>
                              Leader: {leader.name}
                            </span>
                          )}
                        </div>
                        <div style={{ display: "flex", gap: "4px" }} onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => setEditingTeam(team)} style={{ padding: "6px", background: "transparent", border: "none", cursor: "pointer", color: "var(--theme-text-muted)" }} title="Edit team">
                            <Edit size={14} />
                          </button>
                          <button onClick={() => handleDelete(team.id, team.name)} disabled={deletingId === team.id} style={{ padding: "6px", background: "transparent", border: "none", cursor: "pointer", color: "var(--theme-status-danger-fg)" }} title="Delete team">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div style={{ padding: "0 24px 16px 48px" }}>
                          {team.members.length === 0 ? (
                            <p style={{ fontSize: "13px", color: "var(--theme-text-muted)" }}>No members assigned yet. Edit a user and set their team to add them here.</p>
                          ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                              {team.members.map((m) => {
                                const rc = ROLE_COLORS[m.role] ?? { bg: "var(--theme-bg-surface-subtle)", text: "#374151" };
                                return (
                                  <div key={m.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", background: "var(--theme-bg-page)", borderRadius: "8px" }}>
                                    <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--theme-text-primary)", flex: 1 }}>{m.name}</span>
                                    <span style={{ fontSize: "12px", color: "var(--theme-text-muted)" }}>{m.email}</span>
                                    <span style={{ fontSize: "11px", fontWeight: 500, padding: "2px 8px", borderRadius: "999px", backgroundColor: rc.bg, color: rc.text }}>
                                      {ROLES.find((r) => r.value === m.role)?.label ?? m.role}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Create Team Dialog */}
      {creating && (
        <Dialog open onOpenChange={() => setCreating(false)}>
          <DialogContent style={{ maxWidth: "440px" }}>
            <DialogHeader>
              <DialogTitle style={{ fontSize: "18px", color: "var(--theme-text-primary)" }}>Create New Team</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label style={{ fontSize: "13px", marginBottom: "6px", display: "block" }}>Team Name</Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g., North Luzon BD Team" autoFocus />
              </div>
              <div>
                <Label style={{ fontSize: "13px", marginBottom: "6px", display: "block" }}>Department</Label>
                <Select value={newDept} onValueChange={(v) => { setNewDept(v as Department); setNewLeaderId(""); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label style={{ fontSize: "13px", marginBottom: "6px", display: "block" }}>Team Leader <span style={{ color: "var(--theme-text-muted)", fontWeight: 400 }}>(optional)</span></Label>
                <Select value={newLeaderId} onValueChange={setNewLeaderId}>
                  <SelectTrigger><SelectValue placeholder="Assign leader later" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No leader yet</SelectItem>
                    {deptUsersFor(newDept).map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                <Button variant="outline" onClick={() => setCreating(false)} disabled={saving}>Cancel</Button>
                <Button onClick={handleCreate} disabled={saving} className="bg-[var(--theme-action-primary-bg)] hover:bg-[var(--theme-action-primary-border)] text-white">
                  {saving ? "Creating…" : "Create Team"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {editingTeam && (
        <EditTeamDialog team={editingTeam} onClose={() => setEditingTeam(null)} onSaved={() => { setEditingTeam(null); fetchTeams(); }} />
      )}
    </div>
  );
}

// ─── Access Overrides Tab ─────────────────────────────────────────────────────

function AccessOverridesTab() {
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const [formUserId, setFormUserId] = useState("");
  const [formScope, setFormScope] = useState<OverrideScope>("department_wide");
  const [formDepts, setFormDepts] = useState<string[]>([]);
  const [formNotes, setFormNotes] = useState("");

  const { user: currentUser } = useUser();

  const { data: overrides = [], isFetching: loading } = useQuery({
    queryKey: ["permission_overrides"],
    queryFn: async () => {
      const { data } = await supabase
        .from("permission_overrides")
        .select("*, user:user_id(name, email, department, role), grantor:granted_by(name)")
        .order("created_at", { ascending: false });
      return (data as PermissionOverride[]) ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["users", "active-list"],
    queryFn: async () => {
      const { data } = await supabase.from("users").select("id, name, email, department, role").eq("is_active", true).order("name");
      return (data as { id: string; name: string; email: string; department: string; role: Role }[]) ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const handleAdd = async () => {
    if (!formUserId) { toast.error("Select a user."); return; }
    if (formScope === "cross_department" && formDepts.length === 0) { toast.error("Select at least one department."); return; }
    setSaving(true);
    const payload = {
      user_id: formUserId,
      scope: formScope,
      departments: formScope === "cross_department" ? formDepts : null,
      granted_by: currentUser?.id ?? null,
      notes: formNotes.trim() || null,
    };
    const { error } = await supabase.from("permission_overrides").upsert(payload, { onConflict: "user_id" });
    setSaving(false);
    if (error) { toast.error("Failed to save override."); return; }
    toast.success("Access override saved.");
    setAdding(false);
    setFormUserId(""); setFormScope("department_wide"); setFormDepts([]); setFormNotes("");
    queryClient.invalidateQueries({ queryKey: ["permission_overrides"] });
  };

  const handleRevoke = async (override: PermissionOverride) => {
    if (!confirm(`Revoke override for ${override.user?.name ?? "this user"}?`)) return;
    setRevokingId(override.id);
    const { error } = await supabase.from("permission_overrides").delete().eq("id", override.id);
    setRevokingId(null);
    if (error) { toast.error("Failed to revoke override."); return; }
    toast.success("Override revoked.");
    queryClient.invalidateQueries({ queryKey: ["permission_overrides"] });
  };

  const toggleDept = (dept: string) => {
    setFormDepts((prev) => prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept]);
  };

  const existingOverrideUserIds = new Set(overrides.map((o) => o.user_id));
  const eligibleUsers = allUsers.filter((u) => !existingOverrideUserIds.has(u.id));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Header */}
      <div style={{ background: "var(--theme-bg-surface)", border: "1px solid var(--theme-border-default)", borderRadius: "16px", padding: "24px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--theme-text-primary)", marginBottom: "4px" }}>Access Overrides</h3>
            <p style={{ fontSize: "13px", color: "var(--theme-text-muted)", maxWidth: "560px" }}>
              Grant specific users elevated data visibility without changing their role. Overrides take precedence over normal role-based scoping.
            </p>
          </div>
          <button
            onClick={() => setAdding(true)}
            style={{ height: "38px", padding: "0 16px", borderRadius: "10px", background: "#0F766E", border: "none", color: "white", fontSize: "13px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap" }}
          >
            <Plus size={14} />Grant Override
          </button>
        </div>

        {/* Scope legend */}
        <div style={{ display: "flex", gap: "12px", marginTop: "16px", flexWrap: "wrap" }}>
          {(Object.entries(SCOPE_LABELS) as [OverrideScope, typeof SCOPE_LABELS[OverrideScope]][]).map(([key, val]) => (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", border: "1px solid var(--theme-border-default)", borderRadius: "8px", background: "var(--theme-bg-page)" }}>
              <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "999px", backgroundColor: val.bg, color: val.text }}>{val.label}</span>
              <span style={{ fontSize: "12px", color: "var(--theme-text-muted)" }}>{val.description}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Overrides table */}
      <div style={{ background: "var(--theme-bg-surface)", border: "1px solid var(--theme-border-default)", borderRadius: "16px", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "48px", textAlign: "center", color: "var(--theme-text-muted)", fontSize: "14px" }}>Loading…</div>
        ) : overrides.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center" }}>
            <Shield size={28} style={{ color: "var(--theme-border-default)", margin: "0 auto 12px" }} />
            <p style={{ fontSize: "14px", color: "var(--theme-text-muted)" }}>No access overrides configured.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Departments</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Granted By</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overrides.map((ov) => {
                const scopeMeta = SCOPE_LABELS[ov.scope];
                return (
                  <TableRow key={ov.id}>
                    <TableCell>
                      <div>
                        <p style={{ fontWeight: 500, color: "var(--theme-text-primary)", fontSize: "14px" }}>{ov.user?.name ?? ov.user_id}</p>
                        <p style={{ color: "var(--theme-text-muted)", fontSize: "12px" }}>{ov.user?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span style={{ fontSize: "12px", fontWeight: 500, padding: "3px 10px", borderRadius: "999px", backgroundColor: scopeMeta.bg, color: scopeMeta.text }}>
                        {scopeMeta.label}
                      </span>
                    </TableCell>
                    <TableCell style={{ fontSize: "13px", color: "var(--theme-text-muted)" }}>
                      {ov.scope === "cross_department" && ov.departments?.length ? ov.departments.join(", ") : "—"}
                    </TableCell>
                    <TableCell style={{ fontSize: "13px", color: "var(--theme-text-muted)", maxWidth: "200px" }}>{ov.notes ?? "—"}</TableCell>
                    <TableCell style={{ fontSize: "13px", color: "var(--theme-text-muted)" }}>{ov.grantor?.name ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <button
                        onClick={() => handleRevoke(ov)}
                        disabled={revokingId === ov.id}
                        style={{ padding: "6px 12px", borderRadius: "8px", border: "1px solid #FCA5A5", background: "transparent", color: "var(--theme-status-danger-fg)", fontSize: "12px", fontWeight: 500, cursor: revokingId === ov.id ? "not-allowed" : "pointer" }}
                      >
                        {revokingId === ov.id ? "Revoking…" : "Revoke"}
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Add Override Dialog */}
      {adding && (
        <Dialog open onOpenChange={() => setAdding(false)}>
          <DialogContent style={{ maxWidth: "480px" }}>
            <DialogHeader>
              <DialogTitle style={{ fontSize: "18px", color: "var(--theme-text-primary)" }}>Grant Access Override</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label style={{ fontSize: "13px", marginBottom: "6px", display: "block" }}>User</Label>
                <Select value={formUserId} onValueChange={setFormUserId}>
                  <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                  <SelectContent>
                    {eligibleUsers.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name} <span style={{ color: "var(--theme-text-muted)" }}>· {u.department} · {ROLES.find((r) => r.value === u.role)?.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label style={{ fontSize: "13px", marginBottom: "6px", display: "block" }}>Scope</Label>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {(Object.entries(SCOPE_LABELS) as [OverrideScope, typeof SCOPE_LABELS[OverrideScope]][]).map(([key, val]) => (
                    <button
                      key={key}
                      onClick={() => setFormScope(key)}
                      style={{
                        display: "flex", alignItems: "flex-start", gap: "10px", padding: "10px 14px",
                        border: `1px solid ${formScope === key ? "#0F766E" : "#E5E9F0"}`,
                        borderRadius: "10px", background: formScope === key ? "#F0FDF9" : "white", cursor: "pointer", textAlign: "left",
                      }}
                    >
                      <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "999px", backgroundColor: val.bg, color: val.text, whiteSpace: "nowrap", marginTop: "1px" }}>{val.label}</span>
                      <span style={{ fontSize: "12px", color: "var(--theme-text-muted)" }}>{val.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              {formScope === "cross_department" && (
                <div>
                  <Label style={{ fontSize: "13px", marginBottom: "6px", display: "block" }}>Visible Departments</Label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {DEPARTMENTS.map((d) => (
                      <button
                        key={d}
                        onClick={() => toggleDept(d)}
                        style={{
                          padding: "4px 12px", borderRadius: "999px", fontSize: "12px", fontWeight: 500, cursor: "pointer",
                          border: `1px solid ${formDepts.includes(d) ? "#0F766E" : "#E5E9F0"}`,
                          background: formDepts.includes(d) ? "#F0FDF9" : "white",
                          color: formDepts.includes(d) ? "#0F766E" : "#667085",
                        }}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label style={{ fontSize: "13px", marginBottom: "6px", display: "block" }}>Notes <span style={{ color: "var(--theme-text-muted)", fontWeight: 400 }}>(optional)</span></Label>
                <Input value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="Reason for override…" />
              </div>

              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                <Button variant="outline" onClick={() => setAdding(false)} disabled={saving}>Cancel</Button>
                <Button onClick={handleAdd} disabled={saving} className="bg-[var(--theme-action-primary-bg)] hover:bg-[var(--theme-action-primary-border)] text-white">
                  {saving ? "Saving…" : "Grant Override"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ─── Tab navigation ───────────────────────────────────────────────────────────

type Tab = "users" | "teams" | "overrides";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "users",    label: "Users",            icon: Users },
  { id: "teams",    label: "Teams",            icon: UsersRound },
  { id: "overrides", label: "Access Overrides", icon: Shield },
];

// ─── UserManagement (main export) ─────────────────────────────────────────────

export function UserManagement() {
  const [activeTab, setActiveTab] = useState<Tab>("users");

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", backgroundColor: "var(--neuron-bg-elevated)" }}>
      {/* Page Header */}
      <div style={{ padding: "32px 48px 0", borderBottom: "1px solid var(--neuron-ui-border)" }}>
        <h1 style={{ fontSize: "32px", fontWeight: 600, color: "var(--neuron-ink-primary)", letterSpacing: "-1.2px", marginBottom: "4px" }}>
          Users
        </h1>
        <p style={{ fontSize: "14px", color: "var(--neuron-ink-muted)", marginBottom: "20px" }}>
          Manage workspace accounts, teams, and access permissions
        </p>

        {/* Tab nav */}
        <div style={{ display: "flex", gap: "8px" }}>
          {TABS.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                style={{
                  height: "40px",
                  padding: "0 16px",
                  borderRadius: "12px 12px 0 0",
                  border: "1px solid var(--neuron-ui-border)",
                  borderBottom: isActive ? "1px solid var(--neuron-bg-elevated)" : "1px solid var(--neuron-ui-border)",
                  background: isActive ? "var(--neuron-bg-elevated)" : "var(--neuron-bg-page)",
                  color: isActive ? "var(--neuron-action-primary)" : "var(--neuron-ink-muted)",
                  fontWeight: isActive ? 600 : 400,
                  fontSize: "14px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  marginBottom: "-1px",
                  position: "relative",
                  zIndex: isActive ? 1 : 0,
                }}
              >
                <Icon size={14} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, overflow: "auto", padding: "32px 48px" }}>
        {activeTab === "users" && <UsersTab />}
        {activeTab === "teams" && <TeamsTab />}
        {activeTab === "overrides" && <AccessOverridesTab />}
      </div>
    </div>
  );
}
