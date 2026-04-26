import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit2, Trash2, Check, Search } from "lucide-react";

const ALL_PERMISSIONS = [
  // Dashboard
  { key: "view_dashboard",        label: "View Dashboard",           group: "Dashboard",     desc: "Access the admin dashboard and stats" },

  // Tickets
  { key: "view_tickets",          label: "View Tickets",              group: "Tickets",       desc: "See all support tickets" },
  { key: "reply_tickets",         label: "Reply to Tickets",          group: "Tickets",       desc: "Post replies inside tickets" },
  { key: "manage_tickets",        label: "Manage Tickets",            group: "Tickets",       desc: "Update ticket status and category" },
  { key: "close_tickets",         label: "Close Tickets",             group: "Tickets",       desc: "Close open support tickets" },
  { key: "reopen_tickets",        label: "Reopen Tickets",            group: "Tickets",       desc: "Reopen closed tickets" },
  { key: "assign_tickets",        label: "Assign Tickets",            group: "Tickets",       desc: "Assign tickets to staff members" },
  { key: "delete_tickets",        label: "Delete Tickets",            group: "Tickets",       desc: "Permanently delete tickets" },

  // Purchases
  { key: "view_purchases",        label: "View Purchases",            group: "Purchases",     desc: "See the purchase log list" },
  { key: "view_purchase_details", label: "View Purchase Details",     group: "Purchases",     desc: "Open individual order detail pages" },
  { key: "manage_purchases",      label: "Manage Purchases",          group: "Purchases",     desc: "Update purchase status and admin notes" },
  { key: "verify_payment",        label: "Verify Payment",            group: "Purchases",     desc: "Approve pending payments and complete orders" },
  { key: "refund_purchases",      label: "Refund Purchases",          group: "Purchases",     desc: "Issue refunds on completed orders" },
  { key: "delete_purchases",      label: "Delete Purchases",          group: "Purchases",     desc: "Permanently delete purchase records" },

  // Users
  { key: "view_users",            label: "View Users",                group: "Users",         desc: "Browse and search the user list" },
  { key: "view_user_profile",     label: "View User Profiles",        group: "Users",         desc: "Open individual user profile pages" },
  { key: "manage_users",          label: "Manage Users",              group: "Users",         desc: "Edit user profiles and assign custom roles" },
  { key: "edit_user_profile",     label: "Edit User Profile",         group: "Users",         desc: "Change username, email, Minecraft username" },
  { key: "ban_users",             label: "Ban Users",                 group: "Users",         desc: "Restrict user accounts with a reason" },
  { key: "unban_users",           label: "Unban Users",               group: "Users",         desc: "Restore banned user accounts" },
  { key: "change_user_role",      label: "Change User Role",          group: "Users",         desc: "Promote or demote user system roles" },
  { key: "delete_users",          label: "Delete Users",              group: "Users",         desc: "Permanently delete user accounts" },
  { key: "view_user_purchases",   label: "View User Purchases",       group: "Users",         desc: "See purchase history of any user" },
  { key: "view_user_history",     label: "View User History",         group: "Users",         desc: "See login history and activity logs" },
  { key: "reset_user_owo",        label: "Reset User OWO Balance",    group: "Users",         desc: "Set a user's OWO balance to zero" },

  // Store
  { key: "view_store",               label: "View Store Items",           group: "Store",         desc: "See all store products in admin" },
  { key: "manage_store",             label: "Manage Store Items",         group: "Store",         desc: "Create, edit, and update store items" },
  { key: "manage_store_categories",  label: "Manage Store Categories",    group: "Store",         desc: "Create, edit, and delete store categories" },
  { key: "feature_store_items",      label: "Feature Store Items",        group: "Store",         desc: "Mark items as featured in the store" },
  { key: "view_store_analytics",     label: "View Store Analytics",       group: "Store",         desc: "See sales data and revenue charts" },

  // Coupons
  { key: "view_coupons",          label: "View Coupons",              group: "Coupons",       desc: "See all discount codes" },
  { key: "manage_coupons",        label: "Manage Coupons",            group: "Coupons",       desc: "Create and edit discount codes" },
  { key: "delete_coupons",        label: "Delete Coupons",            group: "Coupons",       desc: "Permanently delete coupons" },
  { key: "apply_coupons",         label: "Apply Coupons Manually",    group: "Coupons",       desc: "Manually apply coupons to orders" },
  { key: "view_coupon_stats",     label: "View Coupon Stats",         group: "Coupons",       desc: "See usage statistics for coupons" },

  // Announcements
  { key: "view_announcements",    label: "View Announcements",        group: "Announcements", desc: "See all announcements in admin" },
  { key: "manage_announcements",  label: "Manage Announcements",      group: "Announcements", desc: "Create and edit announcements" },
  { key: "pin_announcements",     label: "Pin Announcements",         group: "Announcements", desc: "Pin or unpin announcements" },
  { key: "delete_announcements",  label: "Delete Announcements",      group: "Announcements", desc: "Permanently delete announcements" },
  { key: "schedule_announcements",label: "Schedule Announcements",    group: "Announcements", desc: "Schedule announcements for future dates" },

  // Leaderboard
  { key: "view_leaderboard",      label: "View Leaderboard",          group: "Leaderboard",   desc: "See the admin leaderboard" },
  { key: "manage_leaderboard",    label: "Manage Leaderboard",        group: "Leaderboard",   desc: "Edit player tier and stats" },
  { key: "reset_leaderboard",     label: "Reset Leaderboard",         group: "Leaderboard",   desc: "Reset all leaderboard stats" },
  { key: "edit_player_stats",     label: "Edit Player Stats",         group: "Leaderboard",   desc: "Change individual player kills and tier" },

  // Ranks
  { key: "view_ranks",            label: "View Ranks",                group: "Ranks",         desc: "See cosmetic rank definitions" },
  { key: "create_ranks",          label: "Create Ranks",              group: "Ranks",         desc: "Create new cosmetic ranks" },
  { key: "manage_ranks",          label: "Manage Ranks",              group: "Ranks",         desc: "Edit existing rank definitions" },
  { key: "delete_ranks",          label: "Delete Ranks",              group: "Ranks",         desc: "Permanently delete ranks" },
  { key: "assign_ranks",          label: "Assign Ranks to Players",   group: "Ranks",         desc: "Give or remove ranks from users" },

  // Roles
  { key: "view_roles",            label: "View Custom Roles",         group: "Roles",         desc: "See staff role definitions" },
  { key: "manage_roles",          label: "Manage Custom Roles",       group: "Roles",         desc: "Create and edit custom roles" },
  { key: "delete_roles",          label: "Delete Custom Roles",       group: "Roles",         desc: "Permanently delete custom roles" },
  { key: "assign_roles",          label: "Assign Custom Roles",       group: "Roles",         desc: "Assign custom roles to users" },

  // Currency
  { key: "view_currency",         label: "View Currency",             group: "Currency",      desc: "See OWO coin balances" },
  { key: "manage_currency",       label: "Add Currency",              group: "Currency",      desc: "Add OWO coins to players" },
  { key: "deduct_currency",       label: "Deduct Currency",           group: "Currency",      desc: "Remove OWO coins from players" },
  { key: "transfer_currency",     label: "Transfer Currency",         group: "Currency",      desc: "Transfer OWO coins between players" },
  { key: "view_currency_logs",    label: "View Currency Logs",        group: "Currency",      desc: "See transaction history for OWO coins" },

  // Moderation
  { key: "mute_players",          label: "Mute Players",              group: "Moderation",    desc: "Mute players in game or chat" },
  { key: "unmute_players",        label: "Unmute Players",            group: "Moderation",    desc: "Remove mutes from players" },
  { key: "kick_players",          label: "Kick Players",              group: "Moderation",    desc: "Kick players from the server" },
  { key: "warn_players",          label: "Warn Players",              group: "Moderation",    desc: "Issue warnings to players" },
  { key: "view_reports",          label: "View Reports",              group: "Moderation",    desc: "See player-submitted reports" },
  { key: "manage_reports",        label: "Manage Reports",            group: "Moderation",    desc: "Resolve and archive player reports" },
  { key: "view_audit_logs",       label: "View Audit Logs",           group: "Moderation",    desc: "See all admin action history" },

  // Settings
  { key: "view_settings",         label: "View Settings",             group: "Settings",      desc: "See server configuration page" },
  { key: "manage_settings",       label: "Manage Settings",           group: "Settings",      desc: "Edit server-wide configuration" },
  { key: "manage_server_ip",      label: "Manage Server IP/Port",     group: "Settings",      desc: "Change the displayed server address" },
  { key: "manage_voting_sites",   label: "Manage Voting Sites",       group: "Settings",      desc: "Add or remove voting site links" },

  // Staff
  { key: "view_staff_activity",   label: "View Staff Activity",       group: "Staff",         desc: "See what staff members are doing" },
  { key: "manage_staff",          label: "Manage Staff",              group: "Staff",         desc: "Add or remove staff members" },
  { key: "view_staff_logs",       label: "View Staff Logs",           group: "Staff",         desc: "See a log of all staff actions" },
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

function PermissionGrid({ selected, onChange }: { selected: string[]; onChange: (p: string[]) => void }) {
  const [search, setSearch] = useState("");
  const toggle = (key: string) =>
    onChange(selected.includes(key) ? selected.filter(k => k !== key) : [...selected, key]);
  const toggleGroup = (group: string) => {
    const keys = ALL_PERMISSIONS.filter(p => p.group === group).map(p => p.key);
    const allSel = keys.every(k => selected.includes(k));
    onChange(allSel ? selected.filter(k => !keys.includes(k)) : Array.from(new Set([...selected, ...keys])));
  };
  const toggleAll = () => {
    const allKeys = ALL_PERMISSIONS.map(p => p.key);
    const allSel = allKeys.every(k => selected.includes(k));
    onChange(allSel ? [] : allKeys);
  };

  const filtered = search.trim()
    ? ALL_PERMISSIONS.filter(p =>
        p.label.toLowerCase().includes(search.toLowerCase()) ||
        p.group.toLowerCase().includes(search.toLowerCase()) ||
        p.desc.toLowerCase().includes(search.toLowerCase())
      )
    : ALL_PERMISSIONS;

  const filteredGroups = Array.from(new Set(filtered.map(p => p.group)));
  const allSel = ALL_PERMISSIONS.map(p => p.key).every(k => selected.includes(k));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search permissions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs bg-background"
          />
        </div>
        <button
          type="button"
          onClick={toggleAll}
          className="text-xs text-primary hover:underline whitespace-nowrap"
        >
          {allSel ? "Deselect all" : "Select all"} ({ALL_PERMISSIONS.length})
        </button>
      </div>
      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {filteredGroups.map(group => {
          const perms = filtered.filter(p => p.group === group);
          const groupKeys = ALL_PERMISSIONS.filter(p => p.group === group).map(p => p.key);
          const allGroupSel = groupKeys.every(k => selected.includes(k));
          return (
            <div key={group}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{group}</span>
                <button type="button" onClick={() => toggleGroup(group)} className="text-xs text-primary hover:underline">
                  {allGroupSel ? "Deselect" : "Select"} all
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1">
                {perms.map(p => (
                  <button
                    key={p.key}
                    type="button"
                    title={p.desc}
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
                    <span className="truncate">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
        {filteredGroups.length === 0 && (
          <p className="text-center text-xs text-muted-foreground py-4">No permissions match "{search}"</p>
        )}
      </div>
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
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { loadRoles(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await authFetch("/admin/custom-roles", { method: "POST", body: JSON.stringify(form) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      toast({ title: "Role created" });
      setCreateOpen(false);
      setForm(DEFAULT_FORM);
      loadRoles();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await authFetch(`/admin/custom-roles/${editTarget.id}`, { method: "PUT", body: JSON.stringify(editForm) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      toast({ title: "Role updated" });
      setEditOpen(false);
      loadRoles();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
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
    } finally { setDeleting(null); }
  };

  function openEdit(role: any) {
    setEditTarget(role);
    setEditForm({ name: role.name, color: role.color, permissions: role.permissions || [] });
    setEditOpen(true);
  }

  function RoleFormBody({ f, setF }: { f: typeof DEFAULT_FORM; setF: (v: typeof DEFAULT_FORM) => void }) {
    return (
      <div className="space-y-4">
        <div>
          <label className="text-sm text-muted-foreground mb-1.5 block">Role Name</label>
          <Input required placeholder="e.g. Helper, Trial Mod, Builder" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">Color</label>
          <div className="flex items-center gap-2 flex-wrap">
            {PRESET_COLORS.map(c => (
              <button key={c} type="button" onClick={() => setF({ ...f, color: c })}
                className="w-6 h-6 rounded-full transition-transform hover:scale-110 border-2"
                style={{ background: c, borderColor: f.color === c ? "white" : "transparent" }}
              />
            ))}
            <Input type="color" value={f.color} onChange={e => setF({ ...f, color: e.target.value })} className="w-10 h-8 p-0.5 rounded cursor-pointer" />
            <span className="text-xs font-mono px-2 py-1 bg-muted rounded" style={{ color: f.color }}>{f.color}</span>
          </div>
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-2 block">
            Permissions <span className="text-primary font-semibold">({f.permissions.length} / {ALL_PERMISSIONS.length} selected)</span>
          </label>
          <PermissionGrid selected={f.permissions} onChange={p => setF({ ...f, permissions: p })} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Custom Roles</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Create staff roles with fine-grained permissions ({ALL_PERMISSIONS.length} available). Assign them to users from the Users panel.
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
                    {role.permissions?.length ?? 0} / {ALL_PERMISSIONS.length} perms
                  </Badge>
                </div>
                {/* Group summary */}
                {role.permissions?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {GROUPS.filter(g => ALL_PERMISSIONS.filter(p => p.group === g).some(p => role.permissions.includes(p.key))).map(g => {
                      const groupPerms = ALL_PERMISSIONS.filter(p => p.group === g);
                      const count = groupPerms.filter(p => role.permissions.includes(p.key)).length;
                      return (
                        <span key={g} className="text-xs px-2 py-0.5 rounded-md font-medium"
                          style={{ background: `${role.color}20`, color: role.color }}>
                          {g} ({count}/{groupPerms.length})
                        </span>
                      );
                    })}
                  </div>
                )}
                {(!role.permissions || role.permissions.length === 0) && (
                  <span className="text-xs text-muted-foreground italic">No permissions assigned</span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button variant="outline" size="sm" onClick={() => openEdit(role)}>
                  <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Edit
                </Button>
                <Button
                  variant="outline" size="sm"
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
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create Custom Role</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-5">
            <RoleFormBody f={form} setF={setForm} />
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" className="flex-1" disabled={saving}>{saving ? "Creating..." : "Create Role"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Role: {editTarget?.name}</DialogTitle></DialogHeader>
          <form onSubmit={handleEdit} className="space-y-5">
            <RoleFormBody f={editForm} setF={setEditForm} />
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit" className="flex-1" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
