import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Edit2, Trash2, FolderOpen, Search, X, Lock,
  GripVertical, Check, RefreshCw,
} from "lucide-react";

const ICON_PRESETS = [
  "⚔️", "🗝️", "✨", "🪙", "⚡", "📦", "🍃", "🛡️",
  "🔮", "💎", "🎁", "🎮", "🏆", "🌟", "🔥", "❄️",
  "🎯", "🧪", "🎪", "🌈", "🦋", "🏅", "💫", "🎵",
];

const COLOR_PRESETS = [
  "#22c55e", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444",
  "#06b6d4", "#ec4899", "#84cc16", "#f97316", "#6366f1",
  "#10b981", "#a855f7", "#f43f5e", "#0ea5e9", "#eab308",
  "#14b8a6", "#6b7280", "#1d4ed8", "#7c3aed", "#b45309",
];

function authFetch(path: string, opts: RequestInit = {}) {
  const token = localStorage.getItem("plutonium_token") || "";
  return fetch(`${window.location.origin}/api${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(opts.headers || {}) },
  });
}

const EMPTY_FORM = {
  name: "",
  value: "",
  icon: "📦",
  color: "#6366f1",
  sortOrder: "0",
  isActive: true,
};
type FormState = typeof EMPTY_FORM;

function CategoryForm({
  form,
  setForm,
  isEdit,
  isBuiltin,
}: {
  form: FormState;
  setForm: (v: FormState) => void;
  isEdit: boolean;
  isBuiltin: boolean;
}) {
  const [slugManual, setSlugManual] = useState(false);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setForm({
      ...form,
      name,
      value: slugManual || isEdit
        ? form.value
        : name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, ""),
    });
  };

  return (
    <div className="space-y-5">
      {/* Name + Slug */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Category Name <span className="text-destructive">*</span></Label>
          <Input
            required
            placeholder="e.g. Potions, Weapons, Special"
            value={form.name}
            onChange={handleNameChange}
            className="bg-background h-10"
          />
        </div>

        {!isEdit && !isBuiltin && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Slug (URL key) <span className="text-destructive">*</span></Label>
              {!slugManual && (
                <button
                  type="button"
                  onClick={() => setSlugManual(true)}
                  className="text-xs text-primary hover:underline"
                >
                  Edit manually
                </button>
              )}
            </div>
            <div className="relative">
              <Input
                required
                placeholder="e.g. potions"
                value={form.value}
                readOnly={!slugManual}
                onChange={e =>
                  setForm({ ...form, value: e.target.value.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "") })
                }
                className={`bg-background h-10 font-mono text-sm ${!slugManual ? "text-muted-foreground" : ""}`}
              />
              {!slugManual && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Lock className="w-3.5 h-3.5 text-muted-foreground/40" />
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Used to filter items in the store. <strong>Cannot be changed after creation.</strong>
            </p>
          </div>
        )}

        {(isEdit || isBuiltin) && (
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-muted-foreground">Slug</Label>
            <div className="relative">
              <Input
                value={form.value}
                readOnly
                className="bg-muted/30 h-10 font-mono text-sm text-muted-foreground"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Lock className="w-3.5 h-3.5 text-muted-foreground/40" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Slug cannot be changed after creation.</p>
          </div>
        )}
      </div>

      {/* Appearance */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-2.5 bg-background/50 border-b border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Appearance</p>
        </div>
        <div className="p-4 space-y-4">
          {/* Icon */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Icon</Label>
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-xl border-2 border-primary/30 bg-background flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: `${form.color}15` }}
              >
                {form.icon || "📦"}
              </div>
              <Input
                value={form.icon}
                onChange={e => setForm({ ...form, icon: e.target.value })}
                placeholder="Paste emoji..."
                className="bg-background w-32 text-center text-lg h-11"
              />
            </div>
            <div className="grid grid-cols-12 gap-1">
              {ICON_PRESETS.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setForm({ ...form, icon: emoji })}
                  className={`h-8 w-8 rounded-lg flex items-center justify-center text-base transition-all hover:scale-110 ${
                    form.icon === emoji
                      ? "ring-2 ring-primary bg-primary/10"
                      : "hover:bg-muted/50"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Accent Color</Label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_PRESETS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm({ ...form, color: c })}
                  className="w-6 h-6 rounded-full transition-transform hover:scale-110 border-2 flex-shrink-0"
                  style={{ background: c, borderColor: form.color === c ? "white" : "transparent" }}
                />
              ))}
              <Input
                type="color"
                value={form.color}
                onChange={e => setForm({ ...form, color: e.target.value })}
                className="w-10 h-8 p-0.5 rounded cursor-pointer"
              />
              <code
                className="text-xs px-2 py-1 rounded bg-background border border-border font-mono ml-1"
                style={{ color: form.color }}
              >
                {form.color}
              </code>
            </div>
          </div>

          {/* Preview */}
          <div className="pt-1">
            <Label className="text-sm font-medium text-muted-foreground mb-2 block">Preview</Label>
            <div className="flex gap-2 flex-wrap">
              <span
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all"
                style={{ background: form.color, borderColor: form.color, color: "white" }}
              >
                {form.icon} {form.name || "Category Name"}
              </span>
              <span
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all"
                style={{ background: `${form.color}18`, borderColor: `${form.color}50`, color: form.color }}
              >
                {form.icon} {form.name || "Category Name"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-2.5 bg-background/50 border-b border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Settings</p>
        </div>
        <div className="p-4 grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Sort Order</Label>
            <Input
              type="number"
              value={form.sortOrder}
              onChange={e => setForm({ ...form, sortOrder: e.target.value })}
              className="bg-background h-10"
            />
            <p className="text-xs text-muted-foreground">Lower = shown first</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Status</Label>
            <div className="flex items-center gap-3 h-10">
              <Switch
                checked={form.isActive}
                onCheckedChange={v => setForm({ ...form, isActive: v })}
              />
              <span className={`text-sm font-medium ${form.isActive ? "text-green-500" : "text-muted-foreground"}`}>
                {form.isActive ? "Visible" : "Hidden"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Shown as a filter tab in the store</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminCategories() {
  const { toast } = useToast();
  const [cats, setCats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await authFetch("/admin/store-categories");
      if (r.ok) setCats(await r.json());
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditTarget(null);
    setForm({ ...EMPTY_FORM });
    setDialogOpen(true);
  };

  const openEdit = (cat: any) => {
    setEditTarget(cat);
    setForm({
      name: cat.name,
      value: cat.value,
      icon: cat.icon || "📦",
      color: cat.color || "#6366f1",
      sortOrder: String(cat.sortOrder ?? 0),
      isActive: cat.isActive !== false,
    });
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const isEdit = !!editTarget;
      const url = isEdit ? `/admin/store-categories/${editTarget.id}` : "/admin/store-categories";
      const method = isEdit ? "PUT" : "POST";
      const body = isEdit
        ? { name: form.name, icon: form.icon, color: form.color, sortOrder: Number(form.sortOrder), isActive: form.isActive }
        : { name: form.name, value: form.value, icon: form.icon, color: form.color, sortOrder: Number(form.sortOrder), isActive: form.isActive };
      const r = await authFetch(url, { method, body: JSON.stringify(body) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      toast({ title: isEdit ? "Category updated" : "Category created", description: `"${form.name}" was saved.` });
      setDialogOpen(false);
      load();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleDelete = async (cat: any) => {
    const label = cat.isBuiltin ? `the built-in "${cat.name}" category` : `"${cat.name}"`;
    const confirmed = confirm(
      `Delete ${label}?\n\nStore items in this category will still exist, but the filter tab will be removed from the store.`
    );
    if (!confirmed) return;
    setDeleting(cat.id);
    try {
      const r = await authFetch(`/admin/store-categories/${cat.id}`, { method: "DELETE" });
      if (!r.ok) throw new Error((await r.json()).error);
      toast({ title: "Category deleted", description: `"${cat.name}" has been removed.` });
      load();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally { setDeleting(null); }
  };

  const filtered = cats.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.value.includes(search.toLowerCase())
  );

  const builtins = filtered.filter(c => c.isBuiltin);
  const custom = filtered.filter(c => !c.isBuiltin);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-2">
            <FolderOpen className="w-7 h-7 text-primary" /> Store Categories
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage the filter tabs that appear in your store. All categories — built-in and custom — can be edited or deleted.
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" /> New Category
          </Button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-2xl font-bold">{cats.length}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Total Categories</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-2xl font-bold text-primary">{cats.filter(c => c.isActive).length}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Visible in Store</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-2xl font-bold">{cats.filter(c => !c.isBuiltin).length}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Custom Categories</div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search categories..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10 h-10 bg-card"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid gap-3">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="h-16 rounded-xl bg-card animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Built-in */}
          {builtins.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Built-in ({builtins.length})
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="space-y-2">
                {builtins.map(cat => (
                  <CategoryRow
                    key={cat.id}
                    cat={cat}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    deleting={deleting === cat.id}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Custom */}
          {custom.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Custom ({custom.length})
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="space-y-2">
                {custom.map(cat => (
                  <CategoryRow
                    key={cat.id}
                    cat={cat}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    deleting={deleting === cat.id}
                  />
                ))}
              </div>
            </div>
          )}

          {filtered.length === 0 && (
            <div className="text-center py-16 border border-dashed border-border rounded-xl">
              <FolderOpen className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-muted-foreground">
                {search ? `No categories matching "${search}"` : "No categories found."}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={v => { setDialogOpen(v); if (!v) setEditTarget(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              {editTarget ? (
                <>
                  <Edit2 className="w-4 h-4 text-primary" />
                  Edit "{editTarget.name}"
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 text-primary" />
                  Create Category
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {editTarget?.isBuiltin
                ? "You can edit the name, icon, color, sort order, and visibility of this built-in category."
                : editTarget
                ? "Update this category's appearance and settings."
                : "Add a new filter category to your store."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 pt-1">
            <CategoryForm
              form={form}
              setForm={setForm}
              isEdit={!!editTarget}
              isBuiltin={editTarget?.isBuiltin || false}
            />
            <div className="flex gap-3 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={saving}>
                {saving ? "Saving..." : editTarget ? "Save Changes" : "Create Category"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CategoryRow({ cat, onEdit, onDelete, deleting }: {
  cat: any;
  onEdit: (cat: any) => void;
  onDelete: (cat: any) => void;
  deleting: boolean;
}) {
  return (
    <div className="flex items-center gap-4 px-4 py-3 bg-card border border-border rounded-xl hover:border-border/80 transition-colors group">
      <GripVertical className="w-4 h-4 text-muted-foreground/20 flex-shrink-0" />

      {/* Color + icon */}
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
        style={{ background: `${cat.color}20`, border: `1px solid ${cat.color}40` }}
      >
        {cat.icon || "📦"}
      </div>

      {/* Name + slug */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm">{cat.name}</span>
          {cat.isBuiltin && (
            <Badge variant="outline" className="text-xs py-0 h-4 text-muted-foreground">built-in</Badge>
          )}
          {!cat.isActive && (
            <Badge variant="outline" className="text-xs py-0 h-4 text-muted-foreground/60">hidden</Badge>
          )}
        </div>
        <span className="text-xs font-mono text-muted-foreground">{cat.value}</span>
      </div>

      {/* Color swatch */}
      <div className="hidden sm:flex items-center gap-1.5">
        <div className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ background: cat.color }} />
        <code className="text-xs text-muted-foreground font-mono">{cat.color}</code>
      </div>

      {/* Sort order */}
      <span className="hidden sm:block text-xs text-muted-foreground w-10 text-center">
        #{cat.sortOrder ?? 0}
      </span>

      {/* Active indicator */}
      <div className="hidden sm:flex items-center">
        {cat.isActive ? (
          <span className="flex items-center gap-1 text-xs text-green-500">
            <Check className="w-3.5 h-3.5" /> Visible
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/50">Hidden</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(cat)}>
          <Edit2 className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => onDelete(cat)}
          disabled={deleting}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
