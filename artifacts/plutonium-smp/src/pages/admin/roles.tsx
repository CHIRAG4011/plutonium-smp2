import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit2, Trash2, Check } from "lucide-react";

const ALL_PERMISSIONS = [
  { key: "view_dashboard",       label: "View Dashboard",         group: "Dashboard",     desc: "Access the admin dashboard and stats" },
  { key: "view_tickets",         label: "View Tickets",            group: "Tickets",       desc: "See all support tickets" },
  { key: "manage_tickets",       label: "Manage Tickets",          group: "Tickets",       desc: "Reply to and update tickets" },
  { key: "close_tickets",        label: "Close Tickets",           group: "Tickets",       desc: "Close or reopen support tickets" },
  { key: "view_purchases",       label: "View Purchases",          group: "Purchases",     desc: "See all purchase orders" },
  { key: "manage_purchases",     label: "Manage Purchases",        group: "Purchases",     desc: "Update purchase status and notes" },
  { key: "verify_payment",       label: "Verify Payment",          group: "Purchases",     desc: "Approve pending payments and mark orders complete" },
  { key: "refund_purchases",     label: "Refund Purchases",        group: "Purchases",     desc: "Issue refunds on completed orders" },
  { key: "view_users",           label: "View Users",              group: "Users",         desc: "Browse and search the user list" },
  { key: "manage_users",         label: "Manage Users",            group: "Users",         desc: "Edit user profiles and custom roles" },
  { key: "ban_users",            label: "Ban / Unban Users",       group: "Users",         desc: "Restrict or restore user accounts" },
  { key: "change_user_role",     label: "Change User Role",        group: "Users",         desc: "Promote or demote user system roles" },
  { key: "view_store",           label: "View Store Items",        group: "Store",         desc: "See all store products" },
  { key: "manage_store",         label: "Manage Store",            group: "Store",         desc: "Create, edit, and delete store items" },
  { key: "view_coupons",         label: "View Coupons",            group: "Coupons",       desc: "See all discount codes" },
  { key: "manage_coupons",       label: "Manage Coupons",          group: "Coupons",       desc: "Create, edit, and delete coupons" },
  { key: "view_announcements",   label: "View Announcements",      group: "Announcements", desc: "See all announcements" },
  { key: "manage_announcements", label: "Manage Announcements",    group: "Announcements", desc: "Post, edit, and pin announcements" },
  { key: "view_leaderboard",     label: "View Leaderboard",        group: "Leaderboard",   desc: "See player leaderboard" },
  { key: "manage_leaderboard",   label: "Manage Leaderboard",      group: "Leaderboard",   desc: "Edit player stats and tiers" },
  { key: "view_ranks",           label: "View Ranks",              group: "Ranks",         desc: "See cosmetic rank definitions" },
  { key: "manage_ranks",         label: "Manage Ranks",            group: "Ranks",         desc: "Create and edit cosmetic ranks" },
  { key: "view_roles",           label: "View Custom Roles",       group: "Roles",         desc: "See staff role definitions" },
  { key: "manage_roles",         label: "Manage Custom Roles",     group: "Roles",         desc: "Create and edit custom roles" },
  { key: "view_currency",        label: "View Currency",           group: "Currency",      desc: "See OWO coin balances" },
  { key: "manage_currency",      label: "Manage Currency",         group: "Currency",      desc: "Adjust player OWO coin balances" },
  { key: "view_settings",        label: "View Settings",           group: "Settings",      desc: "See server configuration" },
  { key: "manage_settings",      label: "Manage Settings",         group: "Settings",      desc: "Edit server-wide configuration" },
];

const GROUPS = Array.from(new Set(ALL_PERMISSIONS.map(p => p.group)));

const PRESET_COLORS = [
  "#22c55e", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444",
  "#06b6d4", "#ec4899", "#84cc16", "#f97316", "#6366f1",
];

function getApiBase() {
  return typeof window !== "undefined" ? `${window.location.origin}/api` : "/api";
}

function authFetch(path: string, opts: RequestInit = {}) {
  const token = localStorage.getItem("plutonium_token") || "";
  return fetch(`${getApiBase()}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(opts.headers || {}) },
  });
}

function PermissionGrid({
  selected, onChange,
}: { selected: string[]; onChange: (perms: string[]) => void }) {
  const toggle = (key: string) => {
    onChange(selected.includes(key) ? selected.filter(k => k !== key) : [...selected, key]);
  };

  const toggleGroup = (group: string) => {
    const groupKeys = ALL_PERMISSIONS.filter(p => p.group === group).map(p => p.key);
    const allSelected = groupKeys.every(k => selected.includes(k));
    if (allSelected) {
      onChange(selected.filter(k => !groupKeys.includes(k)));
    } else {
      onChange(Array.from(new Set([...selected, ...groupKeys])));
    }
  };

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
      {GROUPS.map(group => {
        const perms = ALL_PERMISSIONS.filter(p => p.group === group);
        const allSelected = perms.every(p => selected.includes(p.key));
        return (
          <div key={group}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{group}</span>
              <button
                type="button"
                onClick={() => toggleGroup(group)}
                className="text-xs text-primary hover:underline"
              >
                {allSelected ? "Deselect all" : "Select all"}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {perms.map(p => (
                <button
                  key={p.key}
                  type="button"
                  title={(p as any).desc || p.label}
                  onClick={() => toggle(p.key)}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-left transition-colors ${
                    selected.includes(p.key)
                      ? "bg-primary/15 text-primary border border-primary/30"
                      : "bg-muted/50 text-muted-foreground border border-transparent hover:border-border"
                  }`}
                >
                  <div className={`w-3.5 h-3.5 rounded flex items-center justify-center flex-shrink-0 ${
                    selected.includes(p.key) ? "bg-primary" : "border border-muted-foreground"
                  }`}>
                    {selected.includes(p.key) && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                  </div>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const DEFAULT_FORM = { name: "", color: "#22c55e", permissions: [] as string[] };

export default function AdminRoles() {
  const { toast } = useToast();
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [editForm, setEditForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadRoles = async () => {
    try {
      const r = await authFetch("/admin/custom-roles");
      if (r.ok) setRoles(await r.json());
    } catch { } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRoles(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await authFetch("/admin/custom-roles", {
        method: "POST",
        body: JSON.stringify(form),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      toast({ title: "Role created" });
      setCreateOpen(false);
      setForm(DEFAULT_FORM);
      loadRoles();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await authFetch(`/admin/custom-roles/${editTarget.id}`, {
        method: "PUT",
        body: JSON.stringify(editForm),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      toast({ title: "Role updated" });
      setEditOpen(false);
      loadRoles();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (role: any) => {
    if (!confirm(`Delete role "${role.name}"? Users with this role will lose it.`)) return;
    setDeleting(role.id);
    try {
      const r = await authFetch(`/admin/custom-roles/${role.id}`, { method: "DELETE" });
      if (!r.ok) throw new Error((await r.json()).error);
      toast({ title: "Role deleted" });
      loadRoles();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setDeleting(null);
    }
  };

  function openEdit(role: any) {
    setEditTarget(role);
    setEditForm({ name: role.name, color: role.color, permissions: role.permissions || [] });
    setEditOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Custom Roles</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Create staff roles with fine-grained permissions. Assign them to users from the Users panel.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> New Role
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">Loading roles...</div>
      ) : roles.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-xl">
          <p className="text-muted-foreground mb-2">No custom roles yet.</p>
          <p className="text-sm text-muted-foreground/60">Create roles like "Helper", "Trial Mod", or "Builder" with custom permissions.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {roles.map(role => (
            <div key={role.id} className="bg-card border border-border rounded-xl p-5 flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: role.color }} />
                  <span className="font-bold text-lg">{role.name}</span>
                  <Badge variant="outline" className="text-xs ml-auto sm:ml-0">
                    {role.permissions?.length ?? 0} permission{role.permissions?.length !== 1 ? "s" : ""}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {role.permissions?.length > 0 ? role.permissions.map((p: string) => (
                    <span
                      key={p}
                      className="text-xs px-2 py-0.5 rounded-md font-mono"
                      style={{ background: `${role.color}20`, color: role.color }}
                    >
                      {p}
                    </span>
                  )) : (
                    <span className="text-xs text-muted-foreground italic">No permissions assigned</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button variant="outline" size="sm" onClick={() => openEdit(role)}>
                  <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive border-destructive/50 hover:bg-destructive/10"
                  onClick={() => handleDelete(role)}
                  disabled={deleting === role.id}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Create Custom Role</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-5">
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Role Name</label>
              <Input
                placeholder="e.g. Helper, Trial Mod, Builder"
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Color</label>
              <div className="flex items-center gap-2 flex-wrap">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm({ ...form, color: c })}
                    className="w-6 h-6 rounded-full transition-transform hover:scale-110 border-2"
                    style={{ background: c, borderColor: form.color === c ? "white" : "transparent" }}
                  />
                ))}
                <Input
                  type="color"
                  value={form.color}
                  onChange={e => setForm({ ...form, color: e.target.value })}
                  className="w-10 h-8 p-0.5 rounded cursor-pointer"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Permissions ({form.permissions.length} selected)
              </label>
              <PermissionGrid
                selected={form.permissions}
                onChange={perms => setForm({ ...form, permissions: perms })}
              />
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={saving}>
                {saving ? "Creating..." : "Create Role"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Role: {editTarget?.name}</DialogTitle></DialogHeader>
          <form onSubmit={handleEdit} className="space-y-5">
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Role Name</label>
              <Input
                placeholder="Role name"
                required
                value={editForm.name}
                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Color</label>
              <div className="flex items-center gap-2 flex-wrap">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setEditForm({ ...editForm, color: c })}
                    className="w-6 h-6 rounded-full transition-transform hover:scale-110 border-2"
                    style={{ background: c, borderColor: editForm.color === c ? "white" : "transparent" }}
                  />
                ))}
                <Input
                  type="color"
                  value={editForm.color}
                  onChange={e => setEditForm({ ...editForm, color: e.target.value })}
                  className="w-10 h-8 p-0.5 rounded cursor-pointer"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Permissions ({editForm.permissions.length} selected)
              </label>
              <PermissionGrid
                selected={editForm.permissions}
                onChange={perms => setEditForm({ ...editForm, permissions: perms })}
              />
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
