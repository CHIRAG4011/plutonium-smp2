import { useState } from "react";
import { useAdminGetAnnouncements, useAdminCreateAnnouncement } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import {
  Plus, Edit2, Trash2, Pin, PinOff, Eye, EyeOff, ExternalLink,
  Calendar, Palette, Tag, Users, Zap,
} from "lucide-react";
import { format } from "date-fns";

const TYPE_COLORS: Record<string, string> = {
  info: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  warning: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  update: "bg-primary/20 text-primary border-primary/30",
  event: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  maintenance: "bg-orange-500/20 text-orange-400 border-orange-500/30",
};

const TYPE_EMOJI: Record<string, string> = {
  info: "ℹ️", warning: "⚠️", update: "🔔", event: "🎉", maintenance: "🔧",
};

const PRIORITY_STYLES: Record<string, string> = {
  normal: "",
  high: "text-orange-400 border-orange-400/30 bg-orange-400/10",
  urgent: "text-red-400 border-red-400/30 bg-red-400/10",
};

const PRESET_COLORS = [
  { label: "Green (Default)", value: "#22c55e" },
  { label: "Blue", value: "#3b82f6" },
  { label: "Purple", value: "#a855f7" },
  { label: "Orange", value: "#f97316" },
  { label: "Red", value: "#ef4444" },
  { label: "Yellow", value: "#eab308" },
  { label: "Cyan", value: "#06b6d4" },
  { label: "Pink", value: "#ec4899" },
];

const AUDIENCE_OPTIONS = [
  { value: "all", label: "Everyone" },
  { value: "members", label: "Registered Members" },
  { value: "vip", label: "VIP & Above" },
  { value: "mvp", label: "MVP & Above" },
  { value: "legend", label: "Legend Only" },
];

const EMPTY_FORM = {
  title: "",
  content: "",
  type: "info",
  priority: "normal",
  audience: "all",
  imageUrl: "",
  bannerColor: "",
  pinned: false,
  isActive: true,
  callToActionUrl: "",
  callToActionText: "",
  expiresAt: "",
  scheduledAt: "",
  tags: "",
};

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

function AnnouncementForm({
  form, setForm, onSubmit, submitting, submitLabel,
}: {
  form: typeof EMPTY_FORM;
  setForm: (f: typeof EMPTY_FORM) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  submitLabel: string;
}) {
  const f = form;
  const set = (k: string, v: any) => setForm({ ...f, [k]: v });

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label>Title <span className="text-destructive">*</span></Label>
        <Input required placeholder="e.g. Server update v2.5 is live!" value={f.title} onChange={e => set("title", e.target.value)} />
      </div>

      <div className="space-y-1.5">
        <Label>Content <span className="text-destructive">*</span></Label>
        <Textarea
          required
          rows={4}
          placeholder="Write the announcement details here..."
          value={f.content}
          onChange={e => set("content", e.target.value)}
          className="resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Type</Label>
          <Select value={f.type} onValueChange={v => set("type", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="info">ℹ️ Info</SelectItem>
              <SelectItem value="warning">⚠️ Warning</SelectItem>
              <SelectItem value="update">🔔 Update</SelectItem>
              <SelectItem value="event">🎉 Event</SelectItem>
              <SelectItem value="maintenance">🔧 Maintenance</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> Priority</Label>
          <Select value={f.priority} onValueChange={v => set("priority", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="high">🔶 High</SelectItem>
              <SelectItem value="urgent">🔴 Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Audience</Label>
          <Select value={f.audience} onValueChange={v => set("audience", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {AUDIENCE_OPTIONS.map(a => (
                <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5"><Palette className="w-3.5 h-3.5" /> Banner Color</Label>
          <div className="flex gap-1.5 flex-wrap items-center">
            {PRESET_COLORS.map(c => (
              <button
                key={c.value}
                type="button"
                title={c.label}
                onClick={() => set("bannerColor", f.bannerColor === c.value ? "" : c.value)}
                className="w-5 h-5 rounded-full border-2 transition-all flex-shrink-0"
                style={{
                  backgroundColor: c.value,
                  borderColor: f.bannerColor === c.value ? "white" : "transparent",
                  outline: f.bannerColor === c.value ? `2px solid ${c.value}` : "none",
                  outlineOffset: "2px",
                }}
              />
            ))}
            <Input
              type="color"
              value={f.bannerColor || "#22c55e"}
              onChange={e => set("bannerColor", e.target.value)}
              className="w-7 h-5 p-0 border rounded cursor-pointer"
              title="Custom color"
            />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> Tags <span className="text-xs text-muted-foreground font-normal">(comma-separated)</span></Label>
        <Input
          placeholder="e.g. update, pvp, season-3"
          value={f.tags}
          onChange={e => set("tags", e.target.value)}
        />
        {f.tags && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {f.tags.split(",").map(t => t.trim()).filter(Boolean).map(t => (
              <span key={t} className="px-2 py-0.5 rounded-full bg-border text-xs font-medium">#{t}</span>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Image URL <span className="text-xs text-muted-foreground">(optional)</span></Label>
        <Input placeholder="https://example.com/image.png" value={f.imageUrl} onChange={e => set("imageUrl", e.target.value)} />
        {f.imageUrl && (
          <img src={f.imageUrl} alt="Preview" className="mt-1 h-24 w-full object-cover rounded-lg border border-border" onError={e => (e.currentTarget.style.display = "none")} />
        )}
      </div>

      <Separator />

      <div>
        <p className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Call to Action</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5"><ExternalLink className="w-3 h-3" /> Button URL</Label>
            <Input placeholder="https://discord.gg/..." value={f.callToActionUrl} onChange={e => set("callToActionUrl", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Button Text</Label>
            <Input placeholder="e.g. Join Discord" value={f.callToActionText} onChange={e => set("callToActionText", e.target.value)} />
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <p className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Scheduling</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Schedule Publish</Label>
            <Input type="datetime-local" value={f.scheduledAt} onChange={e => set("scheduledAt", e.target.value)} />
            <p className="text-xs text-muted-foreground">Leave empty to publish now</p>
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Expires At</Label>
            <Input type="datetime-local" value={f.expiresAt} onChange={e => set("expiresAt", e.target.value)} />
            <p className="text-xs text-muted-foreground">Auto-hide after this date</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 pt-1">
        <div className="flex items-center gap-3">
          <Switch id="pinned-sw" checked={f.pinned} onCheckedChange={v => set("pinned", v)} />
          <label htmlFor="pinned-sw" className="text-sm cursor-pointer select-none">Pin to the top</label>
        </div>
        <div className="flex items-center gap-3">
          <Switch id="active-sw" checked={f.isActive} onCheckedChange={v => set("isActive", v)} />
          <label htmlFor="active-sw" className="text-sm cursor-pointer select-none">
            Publish immediately <span className="text-xs text-muted-foreground">(uncheck to save as draft)</span>
          </label>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? `${submitLabel}...` : submitLabel}
      </Button>
    </form>
  );
}

export default function AdminAnnouncements() {
  const { data, refetch } = useAdminGetAnnouncements();
  const { mutate: createAnnouncement, isPending: creating } = useAdminCreateAnnouncement();
  const { toast } = useToast();
  const { user } = useAuth();

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const isAdmin = user?.role === "admin" || user?.role === "owner";

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createAnnouncement({
      data: {
        ...form,
        imageUrl: form.imageUrl || undefined,
        bannerColor: form.bannerColor || undefined,
        callToActionUrl: form.callToActionUrl || undefined,
        callToActionText: form.callToActionText || undefined,
        expiresAt: form.expiresAt || undefined,
        scheduledAt: form.scheduledAt || undefined,
        tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : undefined,
      } as any,
    }, {
      onSuccess: () => {
        toast({ title: "Announcement published" });
        setCreateOpen(false);
        setForm(EMPTY_FORM);
        refetch();
      },
      onError: (err: any) => toast({ title: "Failed", description: err.message, variant: "destructive" }),
    });
  };

  const onEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditSaving(true);
    try {
      const r = await authFetch(`/admin/announcements/${editTarget.id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...editForm,
          imageUrl: editForm.imageUrl || null,
          bannerColor: editForm.bannerColor || null,
          callToActionUrl: editForm.callToActionUrl || null,
          callToActionText: editForm.callToActionText || null,
          expiresAt: editForm.expiresAt || null,
          scheduledAt: editForm.scheduledAt || null,
          tags: editForm.tags ? editForm.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
        }),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      toast({ title: "Announcement updated" });
      setEditOpen(false);
      refetch();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setEditSaving(false);
    }
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
      title: a.title,
      content: a.content,
      type: a.type,
      priority: (a as any).priority || "normal",
      audience: (a as any).audience || "all",
      imageUrl: a.imageUrl || "",
      bannerColor: a.bannerColor || "",
      pinned: a.pinned,
      isActive: a.isActive,
      callToActionUrl: a.callToActionUrl || "",
      callToActionText: a.callToActionText || "",
      expiresAt: a.expiresAt ? new Date(a.expiresAt).toISOString().slice(0, 16) : "",
      scheduledAt: a.scheduledAt ? new Date(a.scheduledAt).toISOString().slice(0, 16) : "",
      tags: Array.isArray((a as any).tags) ? (a as any).tags.join(", ") : ((a as any).tags || ""),
    });
    setEditOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold">Announcements</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {data?.length ?? 0} total · {data?.filter(a => a.pinned).length ?? 0} pinned · {data?.filter(a => a.isActive).length ?? 0} visible
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> New Post
        </Button>
      </div>

      <div className="grid gap-4">
        {data?.map(a => (
          <div
            key={a.id}
            className={`bg-card border rounded-xl overflow-hidden transition-opacity ${!a.isActive ? "opacity-50" : ""} ${a.pinned ? "border-primary/50" : "border-border"}`}
            style={a.bannerColor ? { borderLeftColor: a.bannerColor, borderLeftWidth: "4px" } : {}}
          >
            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {a.pinned && <Pin className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                  <Badge variant="outline" className={`${TYPE_COLORS[a.type] ?? ""} text-xs`}>
                    {TYPE_EMOJI[a.type]} {a.type}
                  </Badge>
                  {(a as any).priority && (a as any).priority !== "normal" && (
                    <Badge variant="outline" className={`text-xs ${PRIORITY_STYLES[(a as any).priority] || ""}`}>
                      {(a as any).priority === "urgent" ? "🔴" : "🔶"} {(a as any).priority}
                    </Badge>
                  )}
                  {!a.isActive && <Badge variant="outline" className="text-xs">Draft</Badge>}
                  {(a as any).expiresAt && (
                    <Badge variant="outline" className="text-xs text-orange-400 border-orange-400/30">
                      Expires {format(new Date((a as any).expiresAt), "MMM d")}
                    </Badge>
                  )}
                  {(a as any).audience && (a as any).audience !== "all" && (
                    <Badge variant="outline" className="text-xs text-blue-400 border-blue-400/30">
                      <Users className="w-2.5 h-2.5 mr-1" />
                      {AUDIENCE_OPTIONS.find(o => o.value === (a as any).audience)?.label || (a as any).audience}
                    </Badge>
                  )}
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
              <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">{a.content}</p>

              {a.imageUrl && (
                <img src={a.imageUrl} alt="" className="rounded-lg max-h-48 object-cover w-full border border-border" />
              )}

              {Array.isArray((a as any).tags) && (a as any).tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {(a as any).tags.map((t: string) => (
                    <span key={t} className="px-2 py-0.5 rounded-full bg-border/60 text-xs text-muted-foreground">#{t}</span>
                  ))}
                </div>
              )}

              {((a as any).callToActionUrl) && (
                <a
                  href={(a as any).callToActionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  {(a as any).callToActionText || "Learn More"}
                </a>
              )}
            </div>
          </div>
        ))}
        {data?.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">No announcements yet. Create the first one!</div>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New Announcement</DialogTitle></DialogHeader>
          <AnnouncementForm form={form} setForm={setForm} onSubmit={onSubmit} submitting={creating} submitLabel="Publish" />
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Announcement</DialogTitle></DialogHeader>
          <AnnouncementForm form={editForm} setForm={setEditForm} onSubmit={onEdit} submitting={editSaving} submitLabel="Save Changes" />
        </DialogContent>
      </Dialog>
    </div>
  );
}
