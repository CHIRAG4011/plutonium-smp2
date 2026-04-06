import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Edit2, Trash2, FolderOpen, Search, X, Lock,
  Check, RefreshCw, AlertTriangle,
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
}: {
  form: FormState;
  setForm: (v: FormState) => void;
  isEdit: boolean;
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
    <div className="space-y-6">
      {/* Name + Slug Section */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold">
            Category Name <span className="text-destructive">*</span>
          </Label>
          <Input
            required
            placeholder="e.g. Potions, Weapons, Special"
            value={form.name}
            onChange={handleNameChange}
            className="bg-background h-10"
          />
        </div>

        {!isEdit && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">
                Slug <span className="text-destructive">*</span>
                <span className="ml-1 text-xs font-normal text-muted-foreground">(URL key)</span>
              </Label>
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
                className={`bg-background h-10 font-mono text-sm pr-9 ${!slugManual ? "text-muted-foreground" : ""}`}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Lock className="w-3.5 h-3.5 text-muted-foreground/40" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Used as a filter key in the store. <strong>Cannot be changed after creation.</strong>
            </p>
          </div>
        )}

        {isEdit && (
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-muted-foreground">
              Slug <span className="text-xs font-normal">(cannot be changed)</span>
            </Label>
            <div className="relative">
              <Input
                value={form.value}
                readOnly
                className="bg-muted/30 h-10 font-mono text-sm text-muted-foreground pr-9"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Lock className="w-3.5 h-3.5 text-muted-foreground/40" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Appearance */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-2.5 bg-muted/30 border-b border-border">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Appearance</p>
        </div>
        <div className="p-4 space-y-5">
          {/* Icon */}
          <div className="space-y-2.5">
            <Label className="text-sm font-semibold">Icon</Label>
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-xl border-2 flex items-center justify-center text-2xl flex-shrink-0 transition-all"
                style={{ background: `${form.color}18`, borderColor: `${form.color}50` }}
              >
                {form.icon || "📦"}
              </div>
              <div className="flex-1">
                <Input
                  value={form.icon}
                  onChange={e => setForm({ ...form, icon: e.target.value })}
                  placeholder="Paste emoji..."
                  className="bg-background text-center text-lg h-10 w-36"
                />
                <p className="text-xs text-muted-foreground mt-1">Or pick from presets below</p>
              </div>
            </div>
            <div className="grid grid-cols-12 gap-1 p-2 bg-muted/20 rounded-lg border border-border/50">
              {ICON_PRESETS.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setForm({ ...form, icon: emoji })}
                  className={`h-8 w-8 rounded-lg flex items-center justify-center text-base transition-all hover:scale-110 ${
                    form.icon === emoji
                      ? "ring-2 ring-primary bg-primary/10"
                      : "hover:bg-muted"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div className="space-y-2.5">
            <Label className="text-sm font-semibold">Accent Color</Label>
            <div className="flex items-center gap-2 flex-wrap p-2 bg-muted/20 rounded-lg border border-border/50">
              {COLOR_PRESETS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm({ ...form, color: c })}
                  className="w-7 h-7 rounded-full transition-all hover:scale-110 border-2 flex-shrink-0 flex items-center justify-center"
                  style={{
                    background: c,
                    borderColor: form.color === c ? "white" : "transparent",
                    boxShadow: form.color === c ? `0 0 0 2px ${c}` : "none",
                  }}
                >
                  {form.color === c && <Check className="w-3 h-3 text-white drop-shadow" />}
                </button>
              ))}
              <div className="flex items-center gap-2 ml-auto">
                <Input
                  type="color"
                  value={form.color}
                  onChange={e => setForm({ ...form, color: e.target.value })}
                  className="w-10 h-8 p-0.5 rounded cursor-pointer border-border"
                />
                <code
                  className="text-xs px-2 py-1 rounded bg-background border border-border font-mono"
                  style={{ color: form.color }}
                >
                  {form.color}
                </code>
              </div>
            </div>
          </div>

          {/* Live Preview */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-muted-foreground">Live Preview</Label>
            <div className="flex gap-2 flex-wrap items-center p-3 bg-muted/20 rounded-lg border border-border/50">
              <span
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border"
                style={{ background: form.color, borderColor: form.color, color: "white" }}
              >
                {form.icon} {form.name || "Category Name"}
              </span>
              <span
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border"
                style={{ background: `${form.color}18`, borderColor: `${form.color}50`, color: form.color }}
              >
                {form.icon} {form.name || "Category Name"}
              </span>
              <span className="text-xs text-muted-foreground ml-1">Solid · Outline</span>
            </div>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-2.5 bg-muted/30 border-b border-border">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Settings</p>
        </div>
        <div className="p-4 grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Sort Order</Label>
            <Input
              type="number"
              value={form.sortOrder}
              onChange={e => setForm({ ...form, sortOrder: e.target.value })}
              className="bg-background h-10"
            />
            <p className="text-xs text-muted-foreground">Lower number = shown first</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Visibility</Label>
            <div className="flex items-center gap-3 h-10 px-3 rounded-lg bg-muted/20 border border-border/50">
              <Switch
                checked={form.isActive}
                onCheckedChange={v => setForm({ ...form, isActive: v })}
              />
              <span className={`text-sm font-medium ${form.isActive ? "text-green-500" : "text-muted-foreground"}`}>
                {form.isActive ? "Visible" : "Hidden"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Show as a filter tab in store</p>
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
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

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

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const r = await authFetch(`/admin/store-categories/${deleteTarget.id}`, { method: "DELETE" });
      if (!r.ok) throw new Error((await r.json()).error);
      toast({ title: "Category deleted", description: `"${deleteTarget.name}" has been removed.` });
      setDeleteTarget(null);
      load();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally { setDeleting(false); }
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
            Manage filter tabs in your store. All categories — built-in and custom — can be edited or deleted.
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
                    onDelete={setDeleteTarget}
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
                    onDelete={setDeleteTarget}
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
                <><Edit2 className="w-4 h-4 text-primary" /> Edit "{editTarget.name}"</>
              ) : (
                <><Plus className="w-4 h-4 text-primary" /> New Category</>
              )}
            </DialogTitle>
            <DialogDescription>
              {editTarget?.isBuiltin
                ? "Edit the name, icon, color, sort order, and visibility of this built-in category."
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
            />
            <div className="flex gap-3 pt-2 border-t border-border">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={saving}>
                {saving ? "Saving..." : editTarget ? "Save Changes" : "Create Category"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Delete "{deleteTarget?.name}"?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                This will permanently remove the <strong>{deleteTarget?.name}</strong> filter tab from the store.
              </span>
              {deleteTarget?.isBuiltin && (
                <span className="block mt-2 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-600 dark:text-amber-400 text-xs font-medium">
                  This is a built-in category. Deleting it will remove it permanently.
                </span>
              )}
              <span className="block mt-1 text-sm">
                Store items in this category will still exist — only the filter tab will be removed.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete Category"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CategoryRow({ cat, onEdit, onDelete }: {
  cat: any;
  onEdit: (cat: any) => void;
  onDelete: (cat: any) => void;
}) {
  return (
    <div className="flex items-center gap-4 px-4 py-3 bg-card border border-border rounded-xl hover:border-primary/30 transition-colors group">
      {/* Color + icon */}
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
        style={{ background: `${cat.color}20`, border: `1px solid ${cat.color}40` }}
      >
        {cat.icon || "📦"}
      </div>

      {/* Name + slug */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm">{cat.name}</span>
          {cat.isBuiltin && (
            <Badge variant="outline" className="text-xs py-0 h-4 text-muted-foreground border-muted-foreground/30">built-in</Badge>
          )}
          {!cat.isActive && (
            <Badge variant="outline" className="text-xs py-0 h-4 text-muted-foreground/60 border-muted-foreground/20">hidden</Badge>
          )}
        </div>
        <span className="text-xs font-mono text-muted-foreground">{cat.value}</span>
      </div>

      {/* Color swatch */}
      <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0">
        <div className="w-3.5 h-3.5 rounded-full" style={{ background: cat.color }} />
        <code className="text-xs text-muted-foreground font-mono">{cat.color}</code>
      </div>

      {/* Sort order */}
      <span className="hidden sm:block text-xs text-muted-foreground w-10 text-center flex-shrink-0">
        #{cat.sortOrder ?? 0}
      </span>

      {/* Active indicator */}
      <div className="hidden sm:flex items-center flex-shrink-0 w-16">
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
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
          onClick={() => onEdit(cat)}
        >
          <Edit2 className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => onDelete(cat)}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
