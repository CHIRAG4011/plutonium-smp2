import { useState, useEffect } from "react";
import { useGetStoreItems, useAdminCreateStoreItem, useAdminUpdateStoreItem, useAdminDeleteStoreItem, StoreItem } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Pencil, Image, X, GripVertical, Search, Tag, Edit2, FolderOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function authFetch(path: string, opts: RequestInit = {}) {
  const token = localStorage.getItem("plutonium_token") || "";
  return fetch(`${window.location.origin}/api${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(opts.headers || {}) },
  });
}

const BUILTIN_CATEGORIES = [
  { value: "ranks", label: "Ranks" },
  { value: "crate_keys", label: "Crate Keys" },
  { value: "cosmetics", label: "Cosmetics" },
  { value: "coins", label: "Coins" },
  { value: "boosts", label: "Boosts" },
  { value: "bundles", label: "Bundles" },
  { value: "seasonal", label: "Seasonal" },
  { value: "permissions", label: "Permissions" },
];

const EMPTY_FORM = {
  name: "",
  description: "",
  category: "ranks",
  price: "",
  currency: "usd",
  imageUrl: "",
  images: [] as string[],
  features: [] as string[],
  isActive: true,
  isFeatured: false,
  badge: "",
  badgeColor: "",
  sortOrder: "0",
};
type FormState = typeof EMPTY_FORM;

function ImageListEditor({ images, onChange }: { images: string[]; onChange: (v: string[]) => void }) {
  const [newUrl, setNewUrl] = useState("");
  const add = () => { if (newUrl.trim()) { onChange([...images, newUrl.trim()]); setNewUrl(""); } };
  return (
    <div className="space-y-2">
      <div className="space-y-1">
        {images.map((url, i) => (
          <div key={i} className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-2">
            <Image className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground flex-1 truncate">{url}</span>
            <button type="button" onClick={() => onChange(images.filter((_, j) => j !== i))}>
              <X className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input value={newUrl} onChange={e => setNewUrl(e.target.value)}
          onKeyDown={e => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder="https://example.com/image.png" className="bg-background text-xs h-8" />
        <Button type="button" size="sm" variant="outline" onClick={add} className="h-8 shrink-0">Add</Button>
      </div>
    </div>
  );
}

function FeaturesEditor({ features, onChange }: { features: string[]; onChange: (v: string[]) => void }) {
  const [newFeat, setNewFeat] = useState("");
  const add = () => { if (newFeat.trim()) { onChange([...features, newFeat.trim()]); setNewFeat(""); } };
  return (
    <div className="space-y-2">
      <div className="space-y-1">
        {features.map((feat, i) => (
          <div key={i} className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-2">
            <GripVertical className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
            <span className="text-xs flex-1">{feat}</span>
            <button type="button" onClick={() => onChange(features.filter((_, j) => j !== i))}>
              <X className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input value={newFeat} onChange={e => setNewFeat(e.target.value)}
          onKeyDown={e => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder="Feature description..." className="bg-background text-xs h-8" />
        <Button type="button" size="sm" variant="outline" onClick={add} className="h-8 shrink-0">Add</Button>
      </div>
    </div>
  );
}

const EMPTY_CAT_FORM = { name: "", value: "", icon: "", color: "#6366f1", sortOrder: "0" };

function CategoryManager({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const [cats, setCats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [form, setForm] = useState(EMPTY_CAT_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = async () => {
    try {
      const r = await authFetch("/admin/store-categories");
      if (r.ok) setCats(await r.json());
    } catch { } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const isEdit = !!editTarget;
      const url = isEdit ? `/admin/store-categories/${editTarget.id}` : "/admin/store-categories";
      const method = isEdit ? "PUT" : "POST";
      const body = isEdit
        ? { name: form.name, icon: form.icon, color: form.color, sortOrder: Number(form.sortOrder) }
        : { ...form, sortOrder: Number(form.sortOrder) };
      const r = await authFetch(url, { method, body: JSON.stringify(body) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      toast({ title: isEdit ? "Category updated" : "Category created" });
      setCreateOpen(false);
      setEditTarget(null);
      setForm(EMPTY_CAT_FORM);
      load();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleDelete = async (cat: any) => {
    if (!confirm(`Delete category "${cat.name}"? Items in this category will not be deleted.`)) return;
    setDeleting(cat.id);
    try {
      const r = await authFetch(`/admin/store-categories/${cat.id}`, { method: "DELETE" });
      if (!r.ok) throw new Error((await r.json()).error);
      toast({ title: "Category deleted" });
      load();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally { setDeleting(null); }
  };

  const openEdit = (cat: any) => {
    setEditTarget(cat);
    setForm({ name: cat.name, value: cat.value, icon: cat.icon || "", color: cat.color || "#6366f1", sortOrder: String(cat.sortOrder ?? 0) });
    setCreateOpen(true);
  };

  const s = (field: keyof typeof EMPTY_CAT_FORM) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [field]: e.target.value }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Custom categories extend the built-in ones below.</p>
        <Button size="sm" onClick={() => { setEditTarget(null); setForm(EMPTY_CAT_FORM); setCreateOpen(true); }}>
          <Plus className="w-3.5 h-3.5 mr-1.5" /> New Category
        </Button>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-2.5 bg-background/50 border-b border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Built-in Categories</p>
        </div>
        <div className="divide-y divide-border">
          {BUILTIN_CATEGORIES.map(c => (
            <div key={c.value} className="flex items-center px-4 py-2.5 gap-3">
              <span className="text-sm font-medium flex-1">{c.label}</span>
              <span className="text-xs font-mono text-muted-foreground">{c.value}</span>
              <Badge variant="outline" className="text-xs">Built-in</Badge>
            </div>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Loading custom categories...</div>
      ) : cats.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-border rounded-xl">
          <FolderOpen className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No custom categories yet.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-2.5 bg-background/50 border-b border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Custom Categories</p>
          </div>
          <div className="divide-y divide-border">
            {cats.map(cat => (
              <div key={cat.id} className="flex items-center px-4 py-3 gap-3">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium">{cat.name}</span>
                  <span className="text-xs font-mono text-muted-foreground ml-2">{cat.value}</span>
                </div>
                <Badge variant="outline" className="text-xs" style={{ borderColor: cat.color, color: cat.color }}>Custom</Badge>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(cat)}>
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(cat)}
                    disabled={deleting === cat.id}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={v => { setCreateOpen(v); if (!v) { setEditTarget(null); setForm(EMPTY_CAT_FORM); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editTarget ? "Edit Category" : "Create Category"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Category Name *</Label>
              <Input required placeholder="e.g. Potions" value={form.name} onChange={s("name")} />
            </div>
            {!editTarget && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Slug (auto-generated) *</Label>
                <Input
                  required
                  placeholder="e.g. potions"
                  value={form.value}
                  onChange={e => setForm(p => ({ ...p, value: e.target.value.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "") }))}
                />
                <p className="text-xs text-muted-foreground">Used in URLs and filters. Cannot be changed after creation.</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Icon (emoji)</Label>
                <Input placeholder="🧪" value={form.icon} onChange={s("icon")} className="text-center text-lg" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Color</Label>
                <div className="flex gap-2 items-center">
                  <Input type="color" value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))} className="w-10 h-9 p-0.5 rounded cursor-pointer" />
                  <Input placeholder="#6366f1" value={form.color} onChange={s("color")} className="flex-1" />
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Sort Order</Label>
              <Input type="number" value={form.sortOrder} onChange={s("sortOrder")} />
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" className="flex-1" disabled={saving}>
                {saving ? "Saving..." : editTarget ? "Save" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminStore() {
  const { data: items, refetch } = useGetStoreItems();
  const { mutate: create, isPending: creating } = useAdminCreateStoreItem();
  const { mutate: update, isPending: updating } = useAdminUpdateStoreItem();
  const { mutate: del } = useAdminDeleteStoreItem();
  const { toast } = useToast();

  const [tab, setTab] = useState<"items" | "categories">("items");
  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<StoreItem | null>(null);
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCurrency, setFilterCurrency] = useState("all");

  const [customCats, setCustomCats] = useState<any[]>([]);

  const loadCustomCats = async () => {
    try {
      const r = await authFetch("/admin/store-categories");
      if (r.ok) setCustomCats(await r.json());
    } catch {}
  };
  useEffect(() => { loadCustomCats(); }, []);

  const allCategories = [
    { value: "all", label: "All Categories" },
    ...BUILTIN_CATEGORIES,
    ...customCats.map(c => ({ value: c.value, label: c.name })),
  ];

  const filtered = (items || []).filter(item => {
    const q = search.toLowerCase();
    const matchSearch = !q || item.name.toLowerCase().includes(q) || item.category.includes(q);
    const matchCat = filterCategory === "all" || item.category === filterCategory;
    const matchStatus = filterStatus === "all"
      || (filterStatus === "active" && item.isActive)
      || (filterStatus === "inactive" && !item.isActive)
      || (filterStatus === "featured" && item.isFeatured);
    const matchCurrency = filterCurrency === "all" || item.currency === filterCurrency;
    return matchSearch && matchCat && matchStatus && matchCurrency;
  });

  const openCreate = () => { setEditItem(null); setForm({ ...EMPTY_FORM }); setOpen(true); };
  const openEdit = (item: StoreItem) => {
    setEditItem(item);
    setForm({
      name: item.name, description: item.description, category: item.category,
      price: String(item.price), currency: item.currency, imageUrl: item.imageUrl || "",
      images: item.images || [], features: item.features || [],
      isActive: item.isActive, isFeatured: item.isFeatured,
      badge: item.badge || "", badgeColor: item.badgeColor || "",
      sortOrder: String(item.sortOrder ?? 0),
    });
    setOpen(true);
  };

  const f = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: any = {
      ...form, price: Number(form.price), sortOrder: Number(form.sortOrder),
      imageUrl: form.imageUrl || undefined, badge: form.badge || undefined,
      badgeColor: form.badgeColor || undefined,
    };
    if (editItem) {
      update({ id: editItem.id, data }, {
        onSuccess: () => { toast({ title: "Item updated" }); setOpen(false); refetch(); },
        onError: () => toast({ title: "Failed to update item", variant: "destructive" }),
      });
    } else {
      create({ data }, {
        onSuccess: () => { toast({ title: "Item created" }); setOpen(false); refetch(); },
        onError: () => toast({ title: "Failed to create item", variant: "destructive" }),
      });
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete "${name}"?`)) {
      del({ id }, { onSuccess: () => { toast({ title: "Item deleted" }); refetch(); } });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold">Store Items</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage packages available in the shop.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setTab(tab === "categories" ? "items" : "categories")}>
            <Tag className="w-4 h-4 mr-2" />
            {tab === "categories" ? "View Items" : "Manage Categories"}
          </Button>
          {tab === "items" && (
            <Button onClick={openCreate} className="bg-primary text-primary-foreground font-bold">
              <Plus className="w-4 h-4 mr-2" /> Add Item
            </Button>
          )}
        </div>
      </div>

      {tab === "categories" ? (
        <CategoryManager onClose={() => setTab("items")} />
      ) : (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-2 items-center p-4 bg-card border border-border rounded-xl">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-44 h-9"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                {allCategories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="featured">Featured</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterCurrency} onValueChange={setFilterCurrency}>
              <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Currency" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Currencies</SelectItem>
                <SelectItem value="usd">USD ($)</SelectItem>
                <SelectItem value="owo">OWO Coins</SelectItem>
              </SelectContent>
            </Select>
            {(search || filterCategory !== "all" || filterStatus !== "all" || filterCurrency !== "all") && (
              <Button
                variant="ghost" size="sm"
                onClick={() => { setSearch(""); setFilterCategory("all"); setFilterStatus("all"); setFilterCurrency("all"); }}
                className="text-muted-foreground h-9"
              >
                <X className="w-3.5 h-3.5 mr-1.5" /> Clear
              </Button>
            )}
            <span className="text-xs text-muted-foreground ml-auto">{filtered.length} / {items?.length ?? 0} items</span>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <Table>
              <TableHeader className="bg-background/50">
                <TableRow className="border-border">
                  <TableHead>Item</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                      {items?.length ? "No items match your filters." : 'No items yet. Click "Add Item" to get started.'}
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map(item => (
                  <TableRow key={item.id} className="border-border">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt="" className="w-10 h-10 object-contain rounded-lg bg-background border border-border p-1" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center">
                            <Image className="w-4 h-4 text-muted-foreground/40" />
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-sm">{item.name}</div>
                          {item.badge && <Badge variant="outline" className="text-xs mt-0.5 text-primary border-primary/40">{item.badge}</Badge>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{item.category.replace(/_/g, " ")}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {item.currency === "usd" ? `$${(item.price / 100).toFixed(2)}` : `${item.price} OWO`}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1.5">
                        {item.isActive ? (
                          <Badge variant="outline" className="text-green-500 border-green-500/30 bg-green-500/10 text-xs">Active</Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground text-xs">Inactive</Badge>
                        )}
                        {item.isFeatured && <Badge variant="outline" className="text-primary border-primary/30 text-xs">Featured</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(item)} className="text-muted-foreground hover:text-foreground">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id, item.name)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem ? "Edit Item" : "New Store Item"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label>Name *</Label>
                <Input required value={form.name} onChange={f("name")} className="bg-background" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Description *</Label>
                <Textarea required value={form.description} onChange={f("description")} className="bg-background min-h-[90px] resize-none" />
              </div>
              <div className="space-y-1.5">
                <Label>Category *</Label>
                <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                  <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BUILTIN_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    {customCats.map(c => <SelectItem key={c.value} value={c.value}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Currency *</Label>
                <Select value={form.currency} onValueChange={v => setForm(p => ({ ...p, currency: v }))}>
                  <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usd">USD ($)</SelectItem>
                    <SelectItem value="owo">OWO Coins</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Price * {form.currency === "usd" ? "(in cents, e.g. 999 = $9.99)" : "(OWO coins)"}</Label>
                <Input required type="number" min="0" value={form.price} onChange={f("price")} className="bg-background" />
              </div>
              <div className="space-y-1.5">
                <Label>Sort Order</Label>
                <Input type="number" value={form.sortOrder} onChange={f("sortOrder")} className="bg-background" />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Primary Image URL</Label>
                <Input value={form.imageUrl} onChange={f("imageUrl")} placeholder="https://..." className="bg-background" />
                {form.imageUrl && (
                  <img src={form.imageUrl} alt="" className="h-20 object-contain rounded-lg border border-border bg-background p-2 mt-1" />
                )}
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Additional Images</Label>
                <ImageListEditor images={form.images} onChange={imgs => setForm(p => ({ ...p, images: imgs }))} />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label>Features / Perks</Label>
                <FeaturesEditor features={form.features} onChange={feats => setForm(p => ({ ...p, features: feats }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Badge Text</Label>
                <Input value={form.badge} onChange={f("badge")} placeholder='e.g. "SALE", "NEW"' className="bg-background" />
              </div>
              <div className="space-y-1.5">
                <Label>Badge Color</Label>
                <Input value={form.badgeColor} onChange={f("badgeColor")} placeholder="e.g. #ff5500" className="bg-background" />
              </div>
            </div>
            <div className="flex gap-6">
              <div className="flex items-center gap-3">
                <Switch id="isActive" checked={form.isActive} onCheckedChange={v => setForm(p => ({ ...p, isActive: v }))} />
                <Label htmlFor="isActive" className="cursor-pointer">Active (visible in store)</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch id="isFeatured" checked={form.isFeatured} onCheckedChange={v => setForm(p => ({ ...p, isFeatured: v }))} />
                <Label htmlFor="isFeatured" className="cursor-pointer">Featured</Label>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancel</Button>
              <Button type="submit" disabled={creating || updating} className="flex-1 bg-primary text-primary-foreground font-bold">
                {creating || updating ? "Saving..." : editItem ? "Save Changes" : "Create Item"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
