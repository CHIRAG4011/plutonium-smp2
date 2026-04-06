import { useState } from "react";
import { useAdminGetAnnouncements, useAdminCreateAnnouncement } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { Plus, Edit2, Trash2, Pin, PinOff, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";

const TYPE_COLORS: Record<string, string> = {
  info: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  warning: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  update: "bg-primary/20 text-primary border-primary/30",
  event: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

const TYPE_EMOJI: Record<string, string> = {
  info: "ℹ️", warning: "⚠️", update: "🔔", event: "🎉",
};

const DEFAULT_FORM = { title: "", content: "", type: "info", imageUrl: "", bannerColor: "", pinned: false };

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

export default function AdminAnnouncements() {
  const { data, refetch } = useAdminGetAnnouncements();
  const { mutate: createAnnouncement, isPending: creating } = useAdminCreateAnnouncement();
  const { toast } = useToast();
  const { user } = useAuth();

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [editForm, setEditForm] = useState(DEFAULT_FORM);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const isAdmin = user?.role === "admin" || user?.role === "owner";

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createAnnouncement({ data: { ...form, imageUrl: form.imageUrl || undefined } }, {
      onSuccess: () => {
        toast({ title: "Announcement published" });
        setCreateOpen(false);
        setForm(DEFAULT_FORM);
        refetch();
      },
      onError: (err: any) => toast({ title: "Failed", description: err.message, variant: "destructive" }),
    });
  };

  const onEdit = (e: React.FormEvent) => {
    e.preventDefault();
    authFetch(`/admin/announcements/${editTarget.id}`, {
      method: "PUT",
      body: JSON.stringify(editForm),
    }).then(async r => {
      if (!r.ok) throw new Error((await r.json()).error);
      toast({ title: "Updated" });
      setEditOpen(false);
      refetch();
    }).catch(err => toast({ title: "Failed", description: err.message, variant: "destructive" }));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    setDeleting(id);
    try {
      const r = await authFetch(`/admin/announcements/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error((await r.json()).error);
      toast({ title: "Deleted" });
      refetch();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setDeleting(null);
    }
  };

  const handleToggle = async (id: string) => {
    setToggling(id);
    try {
      const r = await authFetch(`/admin/announcements/${id}/toggle`, { method: "PATCH" });
      if (!r.ok) throw new Error((await r.json()).error);
      refetch();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setToggling(null);
    }
  };

  const handlePin = async (id: string) => {
    try {
      const r = await authFetch(`/admin/announcements/${id}/pin`, { method: "PATCH" });
      if (!r.ok) throw new Error((await r.json()).error);
      refetch();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  function openEdit(a: any) {
    setEditTarget(a);
    setEditForm({
      title: a.title, content: a.content, type: a.type,
      imageUrl: a.imageUrl || "", bannerColor: a.bannerColor || "", pinned: a.pinned,
    });
    setEditOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold">Announcements</h1>
          <p className="text-muted-foreground text-sm mt-1">{data?.length ?? 0} total • {data?.filter(a => a.pinned).length ?? 0} pinned</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> New Post
        </Button>
      </div>

      <div className="grid gap-4">
        {data?.map(a => (
          <div key={a.id} className={`p-4 bg-card border rounded-xl space-y-3 ${!a.isActive ? "opacity-50" : ""} ${a.pinned ? "border-primary/50" : "border-border"}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                {a.pinned && <Pin className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                <Badge variant="outline" className={`${TYPE_COLORS[a.type]} text-xs`}>
                  {TYPE_EMOJI[a.type]} {a.type}
                </Badge>
                {!a.isActive && <Badge variant="outline" className="text-xs">Hidden</Badge>}
                <span className="text-xs text-muted-foreground">{format(new Date(a.createdAt), "MMM d, yyyy")}</span>
                {a.authorName && <span className="text-xs text-muted-foreground">by {a.authorName}</span>}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleToggle(a.id)} disabled={toggling === a.id}>
                  {a.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handlePin(a.id)}>
                  {a.pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(a)}>
                  <Edit2 className="w-3.5 h-3.5" />
                </Button>
                {isAdmin && (
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(a.id)} disabled={deleting === a.id}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
            <h3 className="font-bold text-lg leading-tight">{a.title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">{a.content}</p>
            {a.imageUrl && (
              <img src={a.imageUrl} alt="Announcement" className="rounded-lg max-h-48 object-cover w-full" />
            )}
          </div>
        ))}
        {data?.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">No announcements yet. Create the first one!</div>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Announcement</DialogTitle></DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <Input placeholder="Title" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <Textarea placeholder="Content..." required value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={4} />
            <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="info">ℹ️ Info</SelectItem>
                <SelectItem value="warning">⚠️ Warning</SelectItem>
                <SelectItem value="update">🔔 Update</SelectItem>
                <SelectItem value="event">🎉 Event</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Image URL (optional)" value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} />
            <Input placeholder="Banner Color (optional, e.g. #22c55e)" value={form.bannerColor} onChange={e => setForm({ ...form, bannerColor: e.target.value })} />
            <div className="flex items-center gap-3">
              <Switch checked={form.pinned} onCheckedChange={v => setForm({ ...form, pinned: v })} id="pinned-switch" />
              <label htmlFor="pinned-switch" className="text-sm">Pin this announcement</label>
            </div>
            <Button type="submit" className="w-full" disabled={creating}>
              {creating ? "Publishing..." : "Publish"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Announcement</DialogTitle></DialogHeader>
          <form onSubmit={onEdit} className="space-y-4">
            <Input placeholder="Title" required value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} />
            <Textarea placeholder="Content..." required value={editForm.content} onChange={e => setEditForm({ ...editForm, content: e.target.value })} rows={4} />
            <Select value={editForm.type} onValueChange={v => setEditForm({ ...editForm, type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="info">ℹ️ Info</SelectItem>
                <SelectItem value="warning">⚠️ Warning</SelectItem>
                <SelectItem value="update">🔔 Update</SelectItem>
                <SelectItem value="event">🎉 Event</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Image URL (optional)" value={editForm.imageUrl} onChange={e => setEditForm({ ...editForm, imageUrl: e.target.value })} />
            <Input placeholder="Banner Color (optional)" value={editForm.bannerColor} onChange={e => setEditForm({ ...editForm, bannerColor: e.target.value })} />
            <div className="flex items-center gap-3">
              <Switch checked={editForm.pinned} onCheckedChange={v => setEditForm({ ...editForm, pinned: v })} id="edit-pinned-switch" />
              <label htmlFor="edit-pinned-switch" className="text-sm">Pin this announcement</label>
            </div>
            <Button type="submit" className="w-full">Save Changes</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
