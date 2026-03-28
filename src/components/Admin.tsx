import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "../hooks/useUser";
import { cleanupDuplicates } from "../utils/cleanupDuplicates";
import { toast } from "sonner@2.0.3";
import { supabase } from "../utils/supabase/client";
import { queryKeys } from "../lib/queryKeys";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Plus, Edit, Trash2, RefreshCw, Search, Users, Shield, UsersRound, ChevronDown, ChevronRight } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Department = "Business Development" | "Pricing" | "Operations" | "Accounting" | "Executive" | "HR";
type Role = "staff" | "team_leader" | "manager";
type ServiceType = "Forwarding" | "Brokerage" | "Trucking" | "Marine Insurance" | "Others";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  department: Department;
  role: Role;
  is_active: boolean;
  team_id: string | null;
  service_type: ServiceType | null;
  operations_role: string | null;
  created_at: string;
}

interface Team {
  id: string;
  name: string;
  department: string;
  leader_id: string | null;
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

// ─── Shared tab trigger style ─────────────────────────────────────────────────
const tabTriggerStyle = {
  borderRadius: "12px",
  padding: "10px 20px",
  fontSize: "14px",
  fontWeight: 500,
  border: "1px solid var(--theme-border-default)",
  background: "var(--theme-bg-surface)",
  color: "var(--theme-text-muted)",
  transition: "all 150ms ease",
} as const;
const tabActiveClass = "data-[state=active]:bg-[var(--theme-action-primary-bg)] data-[state=active]:text-white data-[state=active]:border-[var(--theme-action-primary-bg)]";

// ─── EditUserDialog ───────────────────────────────────────────────────────────

interface EditUserDialogProps {
  user: AdminUser | null;
  teams: Team[];
  onClose: () => void;
  onSaved: () => void;
}

function EditUserDialog({ user, teams, onClose, onSaved }: EditUserDialogProps) {
  const [dept, setDept] = useState<Department>(user?.department ?? "Business Development");
  const [role, setRole] = useState<Role>(user?.role ?? "staff");
  const [teamId, setTeamId] = useState<string>(user?.team_id ?? "");
  const [serviceType, setServiceType] = useState<string>(user?.service_type ?? "");
  const [isActive, setIsActive] = useState<boolean>(user?.is_active ?? true);
  const [saving, setSaving] = useState(false);

  const deptTeams = teams.filter((t) => t.department === dept);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const payload: Record<string, unknown> = {
      department: dept,
      role,
      team_id: teamId || null,
      is_active: isActive,
      service_type: dept === "Operations" && serviceType ? serviceType : null,
    };
    const { error } = await supabase.from("users").update(payload).eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error("Failed to update user.");
      return;
    }
    toast.success("User updated.");
    onSaved();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent style={{ maxWidth: "480px" }}>
        <DialogHeader>
          <DialogTitle style={{ fontSize: "18px", color: "var(--theme-text-primary)" }}>
            Edit User — {user?.name}
          </DialogTitle>
          <p style={{ fontSize: "13px", color: "var(--theme-text-muted)", marginTop: "2px" }}>{user?.email}</p>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Department */}
          <div>
            <Label style={{ marginBottom: "6px", display: "block", fontSize: "13px" }}>Department</Label>
            <Select value={dept} onValueChange={(v) => { setDept(v as Department); setTeamId(""); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Role */}
          <div>
            <Label style={{ marginBottom: "6px", display: "block", fontSize: "13px" }}>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Team */}
          <div>
            <Label style={{ marginBottom: "6px", display: "block", fontSize: "13px" }}>
              Team {role === "team_leader" && <span style={{ color: "var(--theme-status-danger-fg)" }}>*</span>}
            </Label>
            <Select value={teamId} onValueChange={setTeamId}>
              <SelectTrigger><SelectValue placeholder="No team assigned" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">No team</SelectItem>
                {deptTeams.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {role === "team_leader" && !teamId && (
              <p style={{ fontSize: "12px", color: "var(--theme-status-danger-fg)", marginTop: "4px" }}>
                Team Leaders must be assigned to a team.
              </p>
            )}
          </div>

          {/* Service Type (Ops only) */}
          {dept === "Operations" && (
            <div>
              <Label style={{ marginBottom: "6px", display: "block", fontSize: "13px" }}>Service Type</Label>
              <Select value={serviceType} onValueChange={setServiceType}>
                <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
                <SelectContent>
                  {SERVICE_TYPES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Active toggle */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", border: "1px solid var(--theme-border-default)", borderRadius: "10px" }}>
            <div>
              <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--theme-text-primary)" }}>Account Active</p>
              <p style={{ fontSize: "12px", color: "var(--theme-text-muted)" }}>Inactive users cannot log in.</p>
            </div>
            <button
              onClick={() => setIsActive(!isActive)}
              style={{
                width: "44px", height: "24px", borderRadius: "999px", border: "none", cursor: "pointer",
                background: isActive ? "#0F766E" : "#D1D5DB",
                position: "relative", transition: "background 150ms ease",
              }}
            >
              <span style={{
                position: "absolute", top: "3px",
                left: isActive ? "23px" : "3px",
                width: "18px", height: "18px", borderRadius: "50%",
                background: "var(--theme-bg-surface)", transition: "left 150ms ease",
              }} />
            </button>
          </div>

          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", paddingTop: "4px" }}>
            <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={saving || (role === "team_leader" && !teamId)}
              className="bg-[var(--theme-action-primary-bg)] hover:bg-[var(--theme-action-primary-border)] text-white"
            >
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── PermissionsHubUsersTab ───────────────────────────────────────────────────

interface UsersTabProps {
  teams: Team[];
  onTeamChange: () => void;
}

function PermissionsHubUsersTab({ teams, onTeamChange: _onTeamChange }: UsersTabProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [editing, setEditing] = useState<AdminUser | null>(null);

  const { data: users = [], isFetching: loading, refetch: fetchUsers } = useQuery({
    queryKey: queryKeys.users.list(),
    queryFn: async () => {
      const { data } = await supabase
        .from("users")
        .select("id, name, email, department, role, is_active, team_id, service_type, operations_role, created_at")
        .order("department")
        .order("name");
      return (data as AdminUser[]) ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const teamName = (teamId: string | null) => {
    if (!teamId) return null;
    return teams.find((t) => t.id === teamId)?.name ?? null;
  };

  const filtered = users.filter((u) => {
    const matchSearch = !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === "all" || u.department === deptFilter;
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchDept && matchRole;
  });

  return (
    <div style={{ background: "var(--theme-bg-surface)", border: "1px solid var(--theme-border-default)", borderRadius: "16px", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "24px", borderBottom: "1px solid var(--theme-border-default)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px" }}>
          <div>
            <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--theme-text-primary)", marginBottom: "4px" }}>User Management</h3>
            <p style={{ fontSize: "13px", color: "var(--theme-text-muted)" }}>
              Manage roles, team assignments, and account status. New accounts are created via the signup page.
            </p>
          </div>
          <button
            onClick={fetchUsers}
            style={{
              height: "36px", width: "36px", borderRadius: "10px",
              background: "var(--theme-bg-surface)", border: "1px solid var(--theme-border-default)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "var(--theme-text-muted)",
            }}
            title="Refresh"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
            <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--theme-text-muted)" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or email…"
              style={{
                width: "100%", height: "36px", paddingLeft: "32px", paddingRight: "12px",
                border: "1px solid var(--theme-border-default)", borderRadius: "10px",
                fontSize: "13px", color: "var(--theme-text-primary)", background: "var(--theme-bg-page)", outline: "none",
              }}
            />
          </div>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            style={{ height: "36px", padding: "0 12px", border: "1px solid var(--theme-border-default)", borderRadius: "10px", fontSize: "13px", color: "var(--theme-text-primary)", background: "var(--theme-bg-surface)", cursor: "pointer" }}
          >
            <option value="all">All Departments</option>
            {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ height: "36px", padding: "0 12px", border: "1px solid var(--theme-border-default)", borderRadius: "10px", fontSize: "13px", color: "var(--theme-text-primary)", background: "var(--theme-bg-surface)", cursor: "pointer" }}
          >
            <option value="all">All Roles</option>
            {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ padding: "48px", textAlign: "center", color: "var(--theme-text-muted)", fontSize: "14px" }}>Loading users…</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Team</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} style={{ textAlign: "center", color: "var(--theme-text-muted)", padding: "32px", fontSize: "14px" }}>
                  No users found.
                </TableCell>
              </TableRow>
            ) : filtered.map((u) => {
              const deptColor = DEPT_COLORS[u.department] ?? { bg: "var(--theme-bg-surface-subtle)", text: "#374151" };
              const roleColor = ROLE_COLORS[u.role] ?? { bg: "var(--theme-bg-surface-subtle)", text: "#374151" };
              const team = teamName(u.team_id);
              return (
                <TableRow key={u.id}>
                  <TableCell>
                    <div>
                      <p style={{ fontWeight: 500, color: "var(--theme-text-primary)", fontSize: "14px" }}>{u.name}</p>
                      <p style={{ color: "var(--theme-text-muted)", fontSize: "12px" }}>{u.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span style={{ display: "inline-flex", padding: "3px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: 500, backgroundColor: deptColor.bg, color: deptColor.text }}>
                      {u.department}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span style={{ display: "inline-flex", padding: "3px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: 500, backgroundColor: roleColor.bg, color: roleColor.text }}>
                      {ROLES.find((r) => r.value === u.role)?.label ?? u.role}
                    </span>
                  </TableCell>
                  <TableCell style={{ fontSize: "13px", color: team ? "#12332B" : "#9CA3AF" }}>
                    {team ?? "—"}
                  </TableCell>
                  <TableCell>
                    <span style={{
                      display: "inline-flex", padding: "3px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: 500,
                      backgroundColor: u.is_active ? "#E8F5E9" : "#F3F4F6",
                      color: u.is_active ? "#10b981" : "#6B7280",
                    }}>
                      {u.is_active ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={() => setEditing(u)}
                      style={{ padding: "6px", background: "transparent", border: "none", cursor: "pointer", color: "var(--theme-text-muted)" }}
                      title="Edit user"
                    >
                      <Edit size={15} />
                    </button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {/* Count footer */}
      {!loading && (
        <div style={{ padding: "12px 24px", borderTop: "1px solid var(--theme-border-default)", fontSize: "12px", color: "var(--theme-text-muted)" }}>
          {filtered.length} of {users.length} users
        </div>
      )}

      {/* Edit dialog */}
      {editing && (
        <EditUserDialog
          user={editing}
          teams={teams}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); queryClient.invalidateQueries({ queryKey: queryKeys.users.all() }); }}
        />
      )}
    </div>
  );
}

// ─── PermissionsHubTeamsTab ───────────────────────────────────────────────────

interface TeamWithMembers extends Team {
  members: { id: string; name: string; role: Role; email: string }[];
}

interface TeamsTabProps {
  teams: Team[];
  onChanged: () => void;
}

function PermissionsHubTeamsTab({ teams, onChanged }: TeamsTabProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [newName, setNewName] = useState("");
  const [newDept, setNewDept] = useState<Department>("Business Development");
  const [newLeaderId, setNewLeaderId] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: allUsers = [] } = useQuery({
    queryKey: ["users", "active-list"],
    queryFn: async () => {
      const { data } = await supabase
        .from("users")
        .select("id, name, role, department, email, team_id")
        .eq("is_active", true)
        .order("name");
      return (data as { id: string; name: string; role: Role; department: string; email: string; team_id: string | null }[]) ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Build teams with members
  const teamsWithMembers: TeamWithMembers[] = teams.map((t) => ({
    ...t,
    members: allUsers.filter((u) => u.team_id === t.id).map((u) => ({ id: u.id, name: u.name, role: u.role, email: u.email })),
  }));

  // Group by department
  const byDept = DEPARTMENTS.reduce<Record<string, TeamWithMembers[]>>((acc, dept) => {
    acc[dept] = teamsWithMembers.filter((t) => t.department === dept);
    return acc;
  }, {});

  const deptUsersFor = (dept: Department) => allUsers.filter((u) => u.department === dept);

  const handleCreate = async () => {
    if (!newName.trim()) { toast.error("Team name is required."); return; }
    setSaving(true);
    const { error } = await supabase.from("teams").insert({
      name: newName.trim(),
      department: newDept,
      leader_id: newLeaderId || null,
    });
    setSaving(false);
    if (error) { toast.error("Failed to create team."); return; }
    toast.success(`Team "${newName}" created.`);
    setCreating(false);
    setNewName(""); setNewDept("Business Development"); setNewLeaderId("");
    onChanged();
  };

  const handleUpdate = async () => {
    if (!editingTeam || !newName.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("teams").update({
      name: newName.trim(),
      department: newDept,
      leader_id: newLeaderId || null,
    }).eq("id", editingTeam.id);
    setSaving(false);
    if (error) { toast.error("Failed to update team."); return; }
    toast.success("Team updated.");
    setEditingTeam(null);
    onChanged();
  };

  const handleDelete = async (teamId: string, teamName: string) => {
    if (!confirm(`Delete team "${teamName}"? Members will be unassigned from this team.`)) return;
    setDeletingId(teamId);
    await supabase.from("users").update({ team_id: null }).eq("team_id", teamId);
    const { error } = await supabase.from("teams").delete().eq("id", teamId);
    setDeletingId(null);
    if (error) { toast.error("Failed to delete team."); return; }
    toast.success(`Team "${teamName}" deleted.`);
    onChanged();
  };

  const openEdit = (team: Team) => {
    setEditingTeam(team);
    setNewName(team.name);
    setNewDept(team.department as Department);
    setNewLeaderId(team.leader_id ?? "");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Header card */}
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
            <div style={{ padding: "16px 24px", borderBottom: deptTeams.length > 0 ? "1px solid var(--theme-border-default)" : "none", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ display: "inline-flex", padding: "3px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: 500, backgroundColor: DEPT_COLORS[dept]?.bg ?? "#F3F4F6", color: DEPT_COLORS[dept]?.text ?? "#374151" }}>
                  {dept}
                </span>
                <span style={{ fontSize: "13px", color: "var(--theme-text-muted)" }}>{deptTeams.length} {deptTeams.length === 1 ? "team" : "teams"}</span>
              </div>
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
                          <button onClick={() => openEdit(team)} style={{ padding: "6px", background: "transparent", border: "none", cursor: "pointer", color: "var(--theme-text-muted)" }} title="Edit team">
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

      {/* Edit Team Dialog */}
      {editingTeam && (
        <Dialog open onOpenChange={() => setEditingTeam(null)}>
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
                    {deptUsersFor(newDept).map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                <Button variant="outline" onClick={() => setEditingTeam(null)} disabled={saving}>Cancel</Button>
                <Button onClick={handleUpdate} disabled={saving} className="bg-[var(--theme-action-primary-bg)] hover:bg-[var(--theme-action-primary-border)] text-white">
                  {saving ? "Saving…" : "Save Changes"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ─── PermissionsHubOverridesTab ───────────────────────────────────────────────

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

const SCOPE_LABELS: Record<OverrideScope, { label: string; description: string; bg: string; text: string }> = {
  full:               { label: "Full Access", description: "Sees everything across all departments.", bg: "#F3E8FF", text: "#7E22CE" },
  department_wide:    { label: "Department Wide", description: "Sees all records in their own department (bypasses team/staff restriction).", bg: "var(--theme-status-warning-bg)", text: "var(--theme-status-warning-fg)" },
  cross_department:   { label: "Cross Department", description: "Sees records in selected departments.", bg: "#E0E7FF", text: "#3730A3" },
};

function PermissionsHubOverridesTab() {
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  // Form state
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
      const { data } = await supabase
        .from("users")
        .select("id, name, email, department, role")
        .eq("is_active", true)
        .order("name");
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

  // Users who don't already have an override
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
                      {ov.scope === "cross_department" && ov.departments?.length
                        ? ov.departments.join(", ")
                        : "—"}
                    </TableCell>
                    <TableCell style={{ fontSize: "13px", color: "var(--theme-text-muted)", maxWidth: "200px" }}>
                      {ov.notes ?? "—"}
                    </TableCell>
                    <TableCell style={{ fontSize: "13px", color: "var(--theme-text-muted)" }}>
                      {ov.grantor?.name ?? "—"}
                    </TableCell>
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

// ─── Admin (main component) ───────────────────────────────────────────────────

export function Admin() {
  // Settings tab state
  const [expenseTypes, setExpenseTypes] = useState(["Fuel", "Toll", "Maintenance", "Other"]);
  const [documentTypes, setDocumentTypes] = useState(["Booking Details", "Expense Entries", "Invoice", "Receipt"]);
  const [trackingFormat, setTrackingFormat] = useState("ND-{YYYY}-{####}");
  const [newExpenseType, setNewExpenseType] = useState("");
  const [newDocumentType, setNewDocumentType] = useState("");

  // System tab state
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [isMigratingStatuses, setIsMigratingStatuses] = useState(false);
  const [isMigratingServices, setIsMigratingServices] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isClearingSeed, setIsClearingSeed] = useState(false);
  const [isMigratingContactNames, setIsMigratingContactNames] = useState(false);
  const [isSeedingUsers, setIsSeedingUsers] = useState(false);
  const [isSeedingBalanceSheet, setIsSeedingBalanceSheet] = useState(false);
  const [isSeedingIncomeStatement, setIsSeedingIncomeStatement] = useState(false);

  const queryClient = useQueryClient();

  // Teams — loaded once and shared between Users and Teams tabs
  const { data: teams = [], refetch: fetchTeams } = useQuery({
    queryKey: ["teams"],
    queryFn: async () => {
      const { data } = await supabase.from("teams").select("id, name, department, leader_id").order("department").order("name");
      return (data as Team[]) ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Settings handlers
  const handleAddExpenseType = () => {
    if (newExpenseType && !expenseTypes.includes(newExpenseType)) {
      setExpenseTypes([...expenseTypes, newExpenseType]);
      setNewExpenseType("");
    }
  };
  const handleAddDocumentType = () => {
    if (newDocumentType && !documentTypes.includes(newDocumentType)) {
      setDocumentTypes([...documentTypes, newDocumentType]);
      setNewDocumentType("");
    }
  };
  const handleDeleteExpenseType = (type: string) => setExpenseTypes(expenseTypes.filter((t) => t !== type));
  const handleDeleteDocumentType = (type: string) => setDocumentTypes(documentTypes.filter((t) => t !== type));

  // System handlers
  const handleCleanupDuplicates = async () => {
    setIsCleaningUp(true);
    const result = await cleanupDuplicates();
    if (result.success) toast.success("Duplicates cleaned up successfully!");
    else toast.error("Failed to clean up duplicates.");
    setIsCleaningUp(false);
  };
  const handleMigrateQuotationStatuses = async () => {
    setIsMigratingStatuses(true);
    toast.info("Quotation status migration should be run via Supabase SQL Editor.");
    setIsMigratingStatuses(false);
  };
  const handleMigrateServicesMetadata = async () => {
    setIsMigratingServices(true);
    toast.info("Services metadata migration should be run via Supabase SQL Editor.");
    setIsMigratingServices(false);
  };
  const handleSeedComprehensiveData = async () => {
    setIsSeeding(true);
    toast.info("Comprehensive seeding should be run via Supabase SQL Editor or dashboard.");
    setIsSeeding(false);
  };
  const handleClearSeedData = async () => {
    setIsClearingSeed(true);
    try {
      await Promise.all([
        supabase.from("contacts").delete().neq("id", ""),
        supabase.from("customers").delete().neq("id", ""),
        supabase.from("quotations").delete().neq("id", ""),
        supabase.from("projects").delete().neq("id", ""),
      ]);
      toast.success("All data cleared successfully!");
    } catch {
      toast.error("Failed to clear seed data.");
    }
    setIsClearingSeed(false);
  };
  const handleMigrateContactNames = async () => {
    setIsMigratingContactNames(true);
    toast.info("Contact name migration should be run via Supabase SQL Editor.");
    setIsMigratingContactNames(false);
  };
  const handleSeedUsers = async () => {
    setIsSeedingUsers(true);
    toast.info("User seeding should be run via Supabase Auth dashboard.");
    setIsSeedingUsers(false);
  };
  const handleSeedBalanceSheet = async () => {
    setIsSeedingBalanceSheet(true);
    toast.info("Balance Sheet COA seeding should be run via Supabase SQL Editor.");
    setIsSeedingBalanceSheet(false);
  };
  const handleSeedIncomeStatement = async () => {
    setIsSeedingIncomeStatement(true);
    toast.info("Income Statement COA seeding should be run via Supabase SQL Editor.");
    setIsSeedingIncomeStatement(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--theme-bg-surface)" }}>
      <div style={{ padding: "32px 48px", maxWidth: "100%", margin: "0 auto" }}>
        {/* Page Header */}
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ fontSize: "32px", fontWeight: 600, color: "var(--theme-text-primary)", marginBottom: "4px", letterSpacing: "-1.2px" }}>
            Settings
          </h1>
          <p style={{ fontSize: "14px", color: "var(--theme-text-muted)" }}>
            System administration, permissions, and configuration
          </p>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList style={{ background: "transparent", padding: 0, marginBottom: "24px", gap: "8px", height: "auto", display: "flex", flexWrap: "wrap" }}>
            <TabsTrigger value="users" style={tabTriggerStyle} className={tabActiveClass}>
              <Users size={14} className="mr-1.5" />Users
            </TabsTrigger>
            <TabsTrigger value="teams" style={tabTriggerStyle} className={tabActiveClass}>
              <UsersRound size={14} className="mr-1.5" />Teams
            </TabsTrigger>
            <TabsTrigger value="overrides" style={tabTriggerStyle} className={tabActiveClass}>
              <Shield size={14} className="mr-1.5" />Access Overrides
            </TabsTrigger>
            <TabsTrigger value="settings" style={tabTriggerStyle} className={tabActiveClass}>
              Settings
            </TabsTrigger>
            <TabsTrigger value="system" style={tabTriggerStyle} className={tabActiveClass}>
              System Info
            </TabsTrigger>
          </TabsList>

          {/* ── Users Tab ── */}
          <TabsContent value="users">
            <PermissionsHubUsersTab teams={teams} onTeamChange={fetchTeams} />
          </TabsContent>

          {/* ── Teams Tab ── */}
          <TabsContent value="teams">
            <PermissionsHubTeamsTab teams={teams} onChanged={fetchTeams} />
          </TabsContent>

          {/* ── Access Overrides Tab ── */}
          <TabsContent value="overrides">
            <PermissionsHubOverridesTab />
          </TabsContent>

          {/* ── Settings Tab (unchanged) ── */}
          <TabsContent value="settings">
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Expense Types */}
              <div style={{ background: "var(--theme-bg-surface)", border: "1px solid var(--theme-border-default)", borderRadius: "16px", padding: "24px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--theme-text-primary)", marginBottom: "16px" }}>Expense Types</h3>
                <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                  <Input value={newExpenseType} onChange={(e) => setNewExpenseType(e.target.value)} placeholder="Add new expense type" onKeyPress={(e) => e.key === "Enter" && handleAddExpenseType()} style={{ flex: 1 }} />
                  <button onClick={handleAddExpenseType} style={{ height: "40px", width: "40px", borderRadius: "12px", background: "#0F766E", border: "none", color: "#FFFFFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {expenseTypes.map((type) => (
                    <span key={type} style={{ display: "inline-flex", alignItems: "center", padding: "6px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: 500, backgroundColor: "var(--theme-bg-surface-subtle)", color: "var(--theme-text-secondary)", border: "1px solid var(--theme-border-default)" }}>
                      {type}
                      <button onClick={() => handleDeleteExpenseType(type)} style={{ marginLeft: "8px", background: "transparent", border: "none", color: "var(--theme-status-danger-fg)", cursor: "pointer", fontSize: "18px", lineHeight: "1", padding: 0 }}>×</button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Document Types */}
              <div style={{ background: "var(--theme-bg-surface)", border: "1px solid var(--theme-border-default)", borderRadius: "16px", padding: "24px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--theme-text-primary)", marginBottom: "16px" }}>Document Types</h3>
                <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                  <Input value={newDocumentType} onChange={(e) => setNewDocumentType(e.target.value)} placeholder="Add new document type" onKeyPress={(e) => e.key === "Enter" && handleAddDocumentType()} style={{ flex: 1 }} />
                  <button onClick={handleAddDocumentType} style={{ height: "40px", width: "40px", borderRadius: "12px", background: "#0F766E", border: "none", color: "#FFFFFF", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {documentTypes.map((type) => (
                    <span key={type} style={{ display: "inline-flex", alignItems: "center", padding: "6px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: 500, backgroundColor: "var(--theme-bg-surface-subtle)", color: "var(--theme-text-secondary)", border: "1px solid var(--theme-border-default)" }}>
                      {type}
                      <button onClick={() => handleDeleteDocumentType(type)} style={{ marginLeft: "8px", background: "transparent", border: "none", color: "var(--theme-status-danger-fg)", cursor: "pointer", fontSize: "18px", lineHeight: "1", padding: 0 }}>×</button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Tracking Number Format */}
              <div style={{ background: "var(--theme-bg-surface)", border: "1px solid var(--theme-border-default)", borderRadius: "16px", padding: "24px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--theme-text-primary)", marginBottom: "16px" }}>Tracking Number Format</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div>
                    <Label style={{ marginBottom: "6px", display: "block" }}>Format Pattern</Label>
                    <Input value={trackingFormat} onChange={(e) => setTrackingFormat(e.target.value)} placeholder="e.g., ND-{YYYY}-{####}" />
                    <p style={{ fontSize: "12px", color: "var(--theme-text-muted)", marginTop: "8px" }}>Use {"{YYYY}"} for year, {"{####}"} for sequential number</p>
                  </div>
                  <div style={{ padding: "12px", background: "var(--theme-bg-page)", borderRadius: "8px", border: "1px solid var(--theme-border-default)" }}>
                    <p style={{ fontSize: "14px", color: "var(--theme-text-muted)" }}>Example: ND-2025-0001</p>
                  </div>
                </div>
              </div>

              {/* Chart of Accounts Configuration */}
              <div style={{ background: "var(--theme-bg-surface)", border: "1px solid var(--theme-border-default)", borderRadius: "16px", padding: "24px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--theme-text-primary)", marginBottom: "16px" }}>Chart of Accounts Configuration</h3>
                <p style={{ fontSize: "14px", color: "var(--theme-text-muted)", marginBottom: "16px" }}>Initialize or reset the Chart of Accounts (COA) structure.</p>
                <div style={{ display: "flex", gap: "12px" }}>
                  <button onClick={handleSeedBalanceSheet} disabled={isSeedingBalanceSheet} style={{ height: "40px", padding: "0 20px", borderRadius: "12px", background: isSeedingBalanceSheet ? "#F3F4F6" : "#0F766E", border: "none", color: isSeedingBalanceSheet ? "#9CA3AF" : "#FFFFFF", fontSize: "14px", fontWeight: 600, cursor: isSeedingBalanceSheet ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                    <RefreshCw className={`w-4 h-4 ${isSeedingBalanceSheet ? "animate-spin" : ""}`} />
                    {isSeedingBalanceSheet ? "Seeding…" : "Seed Balance Sheet"}
                  </button>
                  <button onClick={handleSeedIncomeStatement} disabled={isSeedingIncomeStatement} style={{ height: "40px", padding: "0 20px", borderRadius: "12px", background: isSeedingIncomeStatement ? "#F3F4F6" : "#0F766E", border: "none", color: isSeedingIncomeStatement ? "#9CA3AF" : "#FFFFFF", fontSize: "14px", fontWeight: 600, cursor: isSeedingIncomeStatement ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                    <RefreshCw className={`w-4 h-4 ${isSeedingIncomeStatement ? "animate-spin" : ""}`} />
                    {isSeedingIncomeStatement ? "Seeding…" : "Seed Income Statement"}
                  </button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ── System Info Tab (unchanged) ── */}
          <TabsContent value="system">
            <div style={{ background: "var(--theme-bg-surface)", border: "1px solid var(--theme-border-default)", borderRadius: "16px", padding: "24px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--theme-text-primary)", marginBottom: "24px" }}>System Information</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {[
                  { label: "Platform", value: "JJB OS - Logistics Management System" },
                  { label: "Version", value: "v1.0.0" },
                  { label: "Hosted By", value: "JJB Logistics" },
                ].map(({ label, value }) => (
                  <div key={label} style={{ padding: "16px", background: "var(--theme-bg-page)", borderRadius: "12px", border: "1px solid var(--theme-border-default)" }}>
                    <p style={{ fontSize: "13px", color: "var(--theme-text-muted)", marginBottom: "4px" }}>{label}</p>
                    <p style={{ fontSize: "15px", color: "var(--theme-text-primary)", fontWeight: 500 }}>{value}</p>
                  </div>
                ))}

                <div style={{ padding: "16px", background: "var(--theme-bg-page)", borderRadius: "12px", border: "1px solid var(--theme-border-default)" }}>
                  <p style={{ fontSize: "13px", color: "var(--theme-text-muted)", marginBottom: "8px" }}>Database Backup</p>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <p style={{ fontSize: "14px", color: "var(--theme-text-primary)" }}>Last backup: {new Date().toLocaleDateString()}</p>
                    <button style={{ height: "32px", padding: "0 16px", borderRadius: "8px", background: "var(--theme-bg-surface)", border: "1px solid var(--theme-border-default)", color: "var(--theme-text-primary)", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>Backup Now</button>
                  </div>
                </div>

                <div style={{ padding: "16px", background: "#E8F5E9", borderRadius: "12px", border: "1px solid #C8E6C9" }}>
                  <p style={{ fontSize: "13px", color: "#2E7D32", marginBottom: "8px" }}>System Status</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981" }} />
                    <p style={{ fontSize: "14px", color: "#10b981", fontWeight: 500 }}>All systems operational</p>
                  </div>
                </div>

                {/* Database Cleanup */}
                <div style={{ padding: "16px", background: "#FFF4E5", borderRadius: "12px", border: "1px solid #FFE0B2" }}>
                  <p style={{ fontSize: "13px", color: "#E65100", marginBottom: "8px" }}>Database Maintenance</p>
                  <p style={{ fontSize: "14px", color: "var(--theme-text-muted)", marginBottom: "12px" }}>Remove duplicate contacts and customers from the database</p>
                  <button onClick={handleCleanupDuplicates} disabled={isCleaningUp} style={{ height: "36px", padding: "0 20px", borderRadius: "8px", background: isCleaningUp ? "#F3F4F6" : "#EF4444", border: "none", color: isCleaningUp ? "#9CA3AF" : "#FFFFFF", fontSize: "13px", fontWeight: 600, cursor: isCleaningUp ? "not-allowed" : "pointer" }}>
                    {isCleaningUp ? "Cleaning up…" : "Clean Up Duplicates"}
                  </button>
                </div>

                {/* Quotation Status Migration */}
                <div style={{ padding: "16px", background: "#F0F9FF", borderRadius: "12px", border: "1px solid #BAE6FD" }}>
                  <p style={{ fontSize: "13px", color: "#0369A1", marginBottom: "8px" }}>Quotation Status Migration</p>
                  <p style={{ fontSize: "14px", color: "var(--theme-text-muted)", marginBottom: "12px" }}>Update old quotation statuses to new naming convention</p>
                  <button onClick={handleMigrateQuotationStatuses} disabled={isMigratingStatuses} style={{ height: "36px", padding: "0 20px", borderRadius: "8px", background: isMigratingStatuses ? "#F3F4F6" : "#0F766E", border: "none", color: isMigratingStatuses ? "#9CA3AF" : "#FFFFFF", fontSize: "13px", fontWeight: 600, cursor: isMigratingStatuses ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                    <RefreshCw className={`w-4 h-4 ${isMigratingStatuses ? "animate-spin" : ""}`} />
                    {isMigratingStatuses ? "Migrating…" : "Migrate Quotation Statuses"}
                  </button>
                </div>

                {/* Services Metadata Migration */}
                <div style={{ padding: "16px", background: "#FEF3C7", borderRadius: "12px", border: "1px solid #FCD34D" }}>
                  <p style={{ fontSize: "13px", color: "var(--theme-status-warning-fg)", marginBottom: "8px" }}>Fix Services Data Loss Bug</p>
                  <p style={{ fontSize: "14px", color: "var(--theme-text-muted)", marginBottom: "12px" }}>Migrate services_metadata from camelCase to snake_case</p>
                  <button onClick={handleMigrateServicesMetadata} disabled={isMigratingServices} style={{ height: "36px", padding: "0 20px", borderRadius: "8px", background: isMigratingServices ? "#F3F4F6" : "#F59E0B", border: "none", color: isMigratingServices ? "#9CA3AF" : "#FFFFFF", fontSize: "13px", fontWeight: 600, cursor: isMigratingServices ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                    <RefreshCw className={`w-4 h-4 ${isMigratingServices ? "animate-spin" : ""}`} />
                    {isMigratingServices ? "Migrating…" : "Fix Services Metadata Now"}
                  </button>
                </div>

                {/* Seed / Clear Data */}
                <div style={{ padding: "16px", background: "#F0F9FF", borderRadius: "12px", border: "1px solid #BAE6FD" }}>
                  <p style={{ fontSize: "13px", color: "#0369A1", marginBottom: "8px" }}>Seed Data</p>
                  <p style={{ fontSize: "14px", color: "var(--theme-text-muted)", marginBottom: "12px" }}>Populate the database with test data</p>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={handleSeedComprehensiveData} disabled={isSeeding} style={{ height: "36px", padding: "0 20px", borderRadius: "8px", background: isSeeding ? "#F3F4F6" : "#0F766E", border: "none", color: isSeeding ? "#9CA3AF" : "#FFFFFF", fontSize: "13px", fontWeight: 600, cursor: isSeeding ? "not-allowed" : "pointer" }}>
                      {isSeeding ? "Seeding…" : "Seed Data"}
                    </button>
                    <button onClick={handleClearSeedData} disabled={isClearingSeed} style={{ height: "36px", padding: "0 20px", borderRadius: "8px", background: isClearingSeed ? "#F3F4F6" : "#EF4444", border: "none", color: isClearingSeed ? "#9CA3AF" : "#FFFFFF", fontSize: "13px", fontWeight: 600, cursor: isClearingSeed ? "not-allowed" : "pointer" }}>
                      {isClearingSeed ? "Clearing…" : "Clear All Data"}
                    </button>
                  </div>
                </div>

                {/* Misc migration buttons */}
                <div style={{ padding: "16px", background: "var(--theme-bg-page)", borderRadius: "12px", border: "1px solid var(--theme-border-default)" }}>
                  <p style={{ fontSize: "13px", color: "var(--theme-text-muted)", marginBottom: "12px" }}>Other Migrations</p>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <button onClick={handleMigrateContactNames} disabled={isMigratingContactNames} style={{ height: "36px", padding: "0 16px", borderRadius: "8px", background: "var(--theme-bg-surface)", border: "1px solid var(--theme-border-default)", color: "var(--theme-text-primary)", fontSize: "13px", cursor: isMigratingContactNames ? "not-allowed" : "pointer" }}>
                      {isMigratingContactNames ? "Migrating…" : "Migrate Contact Names"}
                    </button>
                    <button onClick={handleSeedUsers} disabled={isSeedingUsers} style={{ height: "36px", padding: "0 16px", borderRadius: "8px", background: "var(--theme-bg-surface)", border: "1px solid var(--theme-border-default)", color: "var(--theme-text-primary)", fontSize: "13px", cursor: isSeedingUsers ? "not-allowed" : "pointer" }}>
                      {isSeedingUsers ? "Seeding…" : "Seed Users"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
