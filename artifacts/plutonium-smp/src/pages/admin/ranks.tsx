import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Edit2, Trash2, Star, ShoppingBag, X, Image,
  Terminal, Shield, Tag, Zap, GripVertical, ChevronDown, ChevronUp,
} from "lucide-react";

const PRESET_COLORS = [
  "#22c55e", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444",
  "#06b6d4", "#ec4899", "#84cc16", "#f97316", "#6366f1",
  "#14b8a6", "#a855f7", "#f43f5e", "#0ea5e9", "#eab308",
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

const DEFAULT_FORM = {
  name: "",
  color: "#22c55e",
  description: "",
  price: "",
  currency: "usd",
  imageUrl: "",
  badge: "",
  badgeColor: "",
  isFeatured: false,
  sortOrder: "0",
  prefix: "",
  suffix: "",
  features: [] as string[],
  minecraftPermissions: [] as string[],
  commands: [] as string[],
  isActive: true,
};

type FormState = typeof DEFAULT_FORM;

function ListEditor({
  items, onChange, placeholder, mono = false,
}: { items: string[]; onChange: (v: string[]) => void; placeholder: string; mono?: boolean }) {
  const [val, setVal] = useState("");
  const add = () => { if (val.trim()) { onChange([...items, val.trim()]); setVal(""); } };
  return (
    <div className="space-y-2">
      {items.length > 0 && (
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-1.5">
              <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
              <span className={`text-xs flex-1 ${mono ? "font-mono" : ""}`}>{item}</span>
              <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))}>
                <X className="w-3 h-3 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Input
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder={placeholder}
          className={`bg-background text-xs h-8 ${mono ? "font-mono" : ""}`}
        />
        <Button type="button" size="sm" variant="outline" onClick={add} className="h-8 shrink-0">Add</Button>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children, defaultOpen = true }: any) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-background/50 hover:bg-background/80 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">{title}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div className="p-4 space-y-4 bg-card/30">{children}</div>}
    </div>
  );
}

function RankForm({ values, setValues }: { values: FormState; setValues: (v: FormState) => void }) {
  const s = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues({ ...values, [field]: e.target.value });

  return (
    <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
      {/* Basic Info */}
      <Section title="Basic Info" icon={Star} defaultOpen={true}>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs text-muted-foreground">Rank Name *</Label>
            <Input required placeholder="e.g. VIP, MVP, Legend" value={values.name} onChange={s("name")} className="bg-background" />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs text-muted-foreground">Description</Label>
            <Textarea
              placeholder="Describe what this rank offers..."
              value={values.description}
              onChange={s("description")}
              rows={2}
              className="resize-none text-sm bg-background"
            />
          </div>
          <div className="col-span-2 space-y-2">
            <Label className="text-xs text-muted-foreground">Rank Color</Label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setValues({ ...values, color: c })}
                  className="w-6 h-6 rounded-full transition-transform hover:scale-110 border-2"
                  style={{ background: c, borderColor: values.color === c ? "white" : "transparent" }}
                />
              ))}
              <Input
                type="color"
                value={values.color}
                onChange={e => setValues({ ...values, color: e.target.value })}
                className="w-10 h-8 p-0.5 rounded cursor-pointer"
              />
              <span className="text-xs font-mono text-muted-foreground px-2 py-1 rounded bg-background border border-border" style={{ color: values.color }}>{values.color}</span>
            </div>
          </div>
        </div>
      </Section>

      {/* Pricing */}
      <Section title="Pricing" icon={Tag} defaultOpen={true}>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Currency</Label>
            <Select value={values.currency} onValueChange={v => setValues({ ...values, currency: v })}>
              <SelectTrigger className="bg-background h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="usd">USD ($)</SelectItem>
                <SelectItem value="owo">OWO Coins</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Price {values.currency === "usd" ? "(in cents, e.g. 999 = $9.99)" : "(OWO coins)"}
            </Label>
            <Input
              type="number"
              min="0"
              placeholder={values.currency === "usd" ? "999" : "500"}
              value={values.price}
              onChange={s("price")}
              className="bg-background h-9"
            />
          </div>
        </div>
      </Section>

      {/* Display */}
      <Section title="Store Display" icon={Image} defaultOpen={true}>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs text-muted-foreground">Image URL</Label>
            <Input placeholder="https://example.com/rank-icon.png" value={values.imageUrl} onChange={s("imageUrl")} className="bg-background" />
            {values.imageUrl && (
              <img src={values.imageUrl} alt="" className="h-16 w-auto object-contain rounded-lg border border-border bg-background/50 p-1 mt-1" />
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Badge Text</Label>
            <Input placeholder='e.g. "HOT", "NEW"' value={values.badge} onChange={s("badge")} className="bg-background" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Badge Color</Label>
            <div className="flex gap-2 items-center">
              <Input placeholder="#f59e0b" value={values.badgeColor} onChange={s("badgeColor")} className="bg-background" />
              {values.badgeColor && (
                <div className="w-8 h-8 rounded border border-border flex-shrink-0" style={{ background: values.badgeColor }} />
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Sort Order</Label>
            <Input type="number" value={values.sortOrder} onChange={s("sortOrder")} className="bg-background" />
          </div>
          <div className="flex items-center gap-3 pt-4">
            <Switch
              checked={values.isFeatured}
              onCheckedChange={v => setValues({ ...values, isFeatured: v })}
            />
            <Label className="text-sm cursor-pointer">Featured in store</Label>
          </div>
        </div>
      </Section>

      {/* Perks */}
      <Section title="Perks & Features" icon={Zap} defaultOpen={true}>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Feature list ({values.features.length} items) — press Enter or click Add</Label>
          <ListEditor
            items={values.features}
            onChange={f => setValues({ ...values, features: f })}
            placeholder="e.g. 2x OWO multiplier, Access to /fly"
          />
        </div>
      </Section>

      {/* In-Game */}
      <Section title="In-Game Settings" icon={Terminal} defaultOpen={false}>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Chat Prefix</Label>
            <Input placeholder="[VIP]" value={values.prefix} onChange={s("prefix")} className="bg-background font-mono" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Chat Suffix</Label>
            <Input placeholder="✦" value={values.suffix} onChange={s("suffix")} className="bg-background font-mono" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Permission Nodes ({values.minecraftPermissions.length})</Label>
          <ListEditor
            items={values.minecraftPermissions}
            onChange={p => setValues({ ...values, minecraftPermissions: p })}
            placeholder="e.g. essentials.fly"
            mono
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">On-Purchase Commands ({values.commands.length})</Label>
          <p className="text-xs text-muted-foreground/70">Use {"{{player}}"} as a placeholder for the player's name.</p>
          <ListEditor
            items={values.commands}
            onChange={c => setValues({ ...values, commands: c })}
            placeholder="e.g. lp user {{player}} parent set vip"
            mono
          />
        </div>
      </Section>

      {/* Permissions */}
      <Section title="Status" icon={Shield} defaultOpen={true}>
        <div className="flex items-center gap-3">
          <Switch
            checked={values.isActive}
            onCheckedChange={v => setValues({ ...values, isActive: v })}
          />
          <div>
            <Label className="text-sm cursor-pointer">Active</Label>
            <p className="text-xs text-muted-foreground">Visible in the store and available for purchase</p>
          </div>
        </div>
      </Section>
    </div>
  );
}

export default function AdminRanks() {
  const { toast } = useToast();
  const [ranks, setRanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [form, setForm] = useState<FormState>({ ...DEFAULT_FORM });
  const [editForm, setEditForm] = useState<FormState>({ ...DEFAULT_FORM });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadRanks = async () => {
    try {
      const r = await authFetch("/admin/ranks");
      if (r.ok) setRanks(await r.json());
    } catch { } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRanks(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await authFetch("/admin/ranks", {
        method: "POST",
        body: JSON.stringify({ ...form, price: Number(form.price) || 0, sortOrder: Number(form.sortOrder) || 0 }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      toast({ title: "Rank created", description: `${form.name} has been added.` });
      setCreateOpen(false);
      setForm({ ...DEFAULT_FORM });
      loadRanks();
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
      const r = await authFetch(`/admin/ranks/${editTarget.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...editForm, price: Number(editForm.price) || 0, sortOrder: Number(editForm.sortOrder) || 0 }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      toast({ title: "Rank updated" });
      setEditOpen(false);
      loadRanks();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (rank: any) => {
    if (!confirm(`Delete rank "${rank.name}"? The matching store item will also be removed.`)) return;
    setDeleting(rank.id);
    try {
      const r = await authFetch(`/admin/ranks/${rank.id}`, { method: "DELETE" });
      if (!r.ok) throw new Error((await r.json()).error);
      toast({ title: "Rank deleted" });
      loadRanks();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setDeleting(null);
    }
  };

  function openEdit(rank: any) {
    setEditTarget(rank);
    setEditForm({
      name: rank.name,
      color: rank.color,
      description: rank.description || "",
      price: String(rank.price ?? 0),
      currency: rank.currency || "usd",
      imageUrl: rank.imageUrl || "",
      badge: rank.badge || "",
      badgeColor: rank.badgeColor || "",
      isFeatured: rank.isFeatured || false,
      sortOrder: String(rank.sortOrder ?? 0),
      prefix: rank.prefix || "",
      suffix: rank.suffix || "",
      features: rank.features || [],
      minecraftPermissions: rank.minecraftPermissions || [],
      commands: rank.commands || [],
      isActive: rank.isActive !== false,
    });
    setEditOpen(true);
  }

  const priceDisplay = (rank: any) => {
    if (!rank.price) return "Free";
    return rank.currency === "owo" ? `${rank.price} OWO` : `$${(rank.price / 100).toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-2">
            <Star className="w-7 h-7 text-primary" /> Ranks
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Create cosmetic ranks with in-game perks. Each rank is automatically listed in the store.
          </p>
        </div>
        <Button onClick={() => { setForm({ ...DEFAULT_FORM }); setCreateOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> New Rank
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground animate-pulse">Loading ranks...</div>
      ) : ranks.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-xl">
          <Star className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground mb-1">No ranks created yet.</p>
          <p className="text-sm text-muted-foreground/60">Ranks are listed in the store automatically when created.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {ranks.map(rank => (
            <div key={rank.id} className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-start gap-0">
                {/* Color accent bar */}
                <div className="w-full sm:w-1.5 h-1.5 sm:h-auto rounded-t-2xl sm:rounded-l-2xl sm:rounded-t-none flex-shrink-0" style={{ background: rank.color }} />

                <div className="flex-1 p-5 flex flex-col sm:flex-row sm:items-start gap-4">
                  {/* Image */}
                  {rank.imageUrl && (
                    <img src={rank.imageUrl} alt={rank.name} className="w-14 h-14 object-contain rounded-xl border border-border bg-background/50 p-1 flex-shrink-0" />
                  )}
                  {!rank.imageUrl && (
                    <div className="w-14 h-14 rounded-xl border border-border bg-background/50 flex items-center justify-center flex-shrink-0">
                      <Star className="w-6 h-6" style={{ color: rank.color }} />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className="font-bold text-lg" style={{ color: rank.color }}>{rank.name}</span>
                      {rank.prefix && (
                        <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-border/50 text-muted-foreground">{rank.prefix}</span>
                      )}
                      <Badge variant="outline" className="text-xs font-bold" style={{ borderColor: rank.color, color: rank.color }}>
                        {priceDisplay(rank)}
                      </Badge>
                      {rank.isFeatured && (
                        <Badge variant="outline" className="text-xs text-yellow-500 border-yellow-500/30">Featured</Badge>
                      )}
                      {!rank.isActive && (
                        <Badge variant="outline" className="text-xs text-muted-foreground">Inactive</Badge>
                      )}
                      {rank.storeItemId && (
                        <span className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
                          <ShoppingBag className="w-3 h-3" /> In Store
                        </span>
                      )}
                    </div>

                    {rank.description && <p className="text-sm text-muted-foreground mb-2">{rank.description}</p>}

                    <div className="flex flex-wrap gap-1.5">
                      {rank.features?.slice(0, 5).map((f: string, i: number) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-md" style={{ background: `${rank.color}20`, color: rank.color }}>
                          {f}
                        </span>
                      ))}
                      {rank.features?.length > 5 && (
                        <span className="text-xs text-muted-foreground">+{rank.features.length - 5} more</span>
                      )}
                    </div>

                    {(rank.minecraftPermissions?.length > 0 || rank.commands?.length > 0) && (
                      <div className="flex gap-3 mt-2">
                        {rank.minecraftPermissions?.length > 0 && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Shield className="w-3 h-3" /> {rank.minecraftPermissions.length} perm{rank.minecraftPermissions.length !== 1 ? "s" : ""}
                          </span>
                        )}
                        {rank.commands?.length > 0 && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Terminal className="w-3 h-3" /> {rank.commands.length} command{rank.commands.length !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button variant="outline" size="sm" onClick={() => openEdit(rank)}>
                      <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive border-destructive/50 hover:bg-destructive/10"
                      onClick={() => handleDelete(rank)}
                      disabled={deleting === rank.id}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="w-4 h-4 text-primary" /> Create New Rank
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3">
            <RankForm values={form} setValues={setForm} />
            <div className="flex gap-3 pt-2 border-t border-border">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" className="flex-1" disabled={saving}>
                {saving ? "Creating..." : "Create Rank"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Rank: {editTarget?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-3">
            <RankForm values={editForm} setValues={setEditForm} />
            <div className="flex gap-3 pt-2 border-t border-border">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setEditOpen(false)}>Cancel</Button>
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
