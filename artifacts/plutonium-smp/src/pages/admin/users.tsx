import { useState, useEffect } from "react";
import { useAdminGetUsers, useAdminBanUser, useAdminUnbanUser, useAdminSetUserRole } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { Search, ShieldBan, ShieldCheck, ShieldAlert, UserCog, Trophy, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

const ROLE_COLORS: Record<string, string> = {
  owner: "border-red-500/50 text-red-400 bg-red-500/10",
  admin: "border-green-500/50 text-green-400 bg-green-500/10",
  moderator: "border-blue-500/50 text-blue-400 bg-blue-500/10",
  user: "border-border text-muted-foreground",
};

function authFetch(path: string, opts: RequestInit = {}) {
  const token = localStorage.getItem("plutonium_token") || "";
  return fetch(`${window.location.origin}/api${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(opts.headers || {}) },
  });
}

interface RankRoleEdit {
  userId: string;
  username: string;
  activeRank: string;
  minecraftUsername: string;
  customRole: string;
}

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const { data, refetch } = useAdminGetUsers({ query: { search, limit: 50 } });
  const { mutate: banUser, isPending: isBanning } = useAdminBanUser();
  const { mutate: unbanUser, isPending: isUnbanning } = useAdminUnbanUser();
  const { mutate: setRole, isPending: isSettingRole } = useAdminSetUserRole();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const [rankRoleEdit, setRankRoleEdit] = useState<RankRoleEdit | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [ranks, setRanks] = useState<any[]>([]);
  const [customRoles, setCustomRoles] = useState<any[]>([]);

  useEffect(() => {
    authFetch("/admin/ranks").then(r => r.ok ? r.json() : []).then(setRanks).catch(() => {});
    authFetch("/admin/custom-roles").then(r => r.ok ? r.json() : []).then(setCustomRoles).catch(() => {});
  }, []);

  const handleBanToggle = (user: any) => {
    if (user.isBanned) {
      unbanUser({ id: user.id }, {
        onSuccess: () => { toast({ title: "User unbanned" }); refetch(); }
      });
    } else {
      const reason = window.prompt("Enter ban reason:");
      if (reason) {
        banUser({ id: user.id, data: { reason } }, {
          onSuccess: () => { toast({ title: "User banned", variant: "destructive" }); refetch(); }
        });
      }
    }
  };

  const handleRoleChange = (userId: string, username: string, newRole: "user" | "moderator" | "admin") => {
    setRole({ userId, role: newRole }, {
      onSuccess: () => {
        toast({ title: "Role updated", description: `${username} is now ${newRole}` });
        refetch();
      },
      onError: (err: any) => {
        toast({ title: "Failed to update role", description: err?.message || "An error occurred", variant: "destructive" });
      },
    });
  };

  const openEdit = (u: any) => {
    setRankRoleEdit({
      userId: u.id,
      username: u.username,
      activeRank: u.activeRank || "",
      minecraftUsername: u.minecraftUsername || "",
      customRole: u.customRole || "",
    });
  };

  const handleSave = async () => {
    if (!rankRoleEdit) return;
    setIsSaving(true);
    try {
      const res = await authFetch(`/admin/users/${rankRoleEdit.userId}/rank`, {
        method: "PUT",
        body: JSON.stringify({
          activeRank: rankRoleEdit.activeRank || null,
          minecraftUsername: rankRoleEdit.minecraftUsername || null,
          customRole: rankRoleEdit.customRole || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast({ title: "User updated", description: `${rankRoleEdit.username}'s rank and role saved.` });
      setRankRoleEdit(null);
      refetch();
    } catch {
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-2">
            <UserCog className="w-8 h-8 text-primary" />
            Manage Users
          </h1>
          <p className="text-muted-foreground">View, manage roles, ranks and moderate player accounts.</p>
        </div>
        <div className="relative w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
          <Input
            className="pl-9 bg-card border-border"
            placeholder="Search username/email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader className="bg-background/50">
            <TableRow className="border-border">
              <TableHead>User</TableHead>
              <TableHead>System Role</TableHead>
              <TableHead>Custom Role</TableHead>
              <TableHead>Rank</TableHead>
              <TableHead>OWO</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.users.map((u: any) => {
              const isOwner = u.role === "owner";
              const canChangeRole = !isOwner && u.id !== currentUser?.id;
              return (
                <TableRow key={u.id} className="border-border">
                  <TableCell>
                    <div className="font-bold">{u.username}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                    {u.discordUsername && (
                      <div className="text-xs text-[#5865F2] mt-0.5">Discord: {u.discordUsername}</div>
                    )}
                    {u.minecraftUsername && (
                      <div className="text-xs text-green-400 mt-0.5">MC: {u.minecraftUsername}</div>
                    )}
                    {u.isBanned && (
                      <Badge variant="destructive" className="text-[10px] mt-1">
                        <ShieldBan className="w-2.5 h-2.5 mr-1" />Banned: {u.banReason}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {canChangeRole ? (
                      <Select
                        value={u.role}
                        onValueChange={(val) => handleRoleChange(u.id, u.username, val as any)}
                        disabled={isSettingRole}
                      >
                        <SelectTrigger className={`w-32 h-8 text-xs border ${ROLE_COLORS[u.role] || ""}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="moderator">Moderator</SelectItem>
                          {currentUser?.role === "owner" && (
                            <SelectItem value="admin">Admin</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline" className={`capitalize ${ROLE_COLORS[u.role] || ""}`}>
                        {u.role === "owner" && <ShieldAlert className="w-3 h-3 mr-1" />}
                        {u.role}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {u.customRole ? (
                      (() => {
                        const cr = customRoles.find(r => r.id === u.customRole);
                        return cr ? (
                          <Badge variant="outline" className="text-xs" style={{ borderColor: cr.color, color: cr.color }}>
                            <Shield className="w-2.5 h-2.5 mr-1" />{cr.name}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground font-mono">{u.customRole.slice(0, 8)}…</span>
                        );
                      })()
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {u.activeRank ? (
                      (() => {
                        const r = ranks.find(rk => rk.name === u.activeRank);
                        return (
                          <Badge className="text-xs" style={{ background: r ? `${r.color}20` : undefined, color: r?.color, borderColor: r?.color }}>
                            <Trophy className="w-2.5 h-2.5 mr-1" />{u.activeRank}
                          </Badge>
                        );
                      })()
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-primary">{u.owoBalance.toLocaleString()}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(u.createdAt), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(u)}
                        className="gap-1 h-8 px-2 text-xs"
                        title="Edit rank & role"
                      >
                        <Trophy className="w-3 h-3 text-yellow-500" />
                        Edit
                      </Button>
                      <Button
                        variant={u.isBanned ? "outline" : "destructive"}
                        size="sm"
                        onClick={() => handleBanToggle(u)}
                        disabled={isOwner || isBanning || isUnbanning}
                        className="w-20 h-8"
                      >
                        {u.isBanned
                          ? <><ShieldCheck className="w-3.5 h-3.5 mr-1" />Unban</>
                          : <><ShieldBan className="w-3.5 h-3.5 mr-1" />Ban</>}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!rankRoleEdit} onOpenChange={(open) => !open && setRankRoleEdit(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Edit — {rankRoleEdit?.username}
            </DialogTitle>
          </DialogHeader>
          {rankRoleEdit && (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-sm">
                  <Trophy className="w-3.5 h-3.5 text-yellow-500" /> Rank
                </Label>
                <Select
                  value={rankRoleEdit.activeRank || "__none__"}
                  onValueChange={(val) => setRankRoleEdit({ ...rankRoleEdit, activeRank: val === "__none__" ? "" : val })}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select a rank..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— No rank —</SelectItem>
                    {ranks.map(r => (
                      <SelectItem key={r.id} value={r.name}>
                        <span className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: r.color }} />
                          {r.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Ranks are cosmetic — no special permissions.</p>
              </div>

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-sm">
                  <Shield className="w-3.5 h-3.5 text-primary" /> Custom Role
                </Label>
                <Select
                  value={rankRoleEdit.customRole || "__none__"}
                  onValueChange={(val) => setRankRoleEdit({ ...rankRoleEdit, customRole: val === "__none__" ? "" : val })}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select a role..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— No custom role —</SelectItem>
                    {customRoles.map(r => (
                      <SelectItem key={r.id} value={r.id}>
                        <span className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: r.color }} />
                          {r.name} ({r.permissions?.length ?? 0} perms)
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Roles grant admin panel permissions.</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">Minecraft Username</Label>
                <Input
                  value={rankRoleEdit.minecraftUsername}
                  placeholder="Steve123 (leave blank to clear)"
                  onChange={(e) => setRankRoleEdit({ ...rankRoleEdit, minecraftUsername: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRankRoleEdit(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
