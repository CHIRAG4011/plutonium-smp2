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
import { Plus, Trash2, Pencil, Image, X, GripVertical, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

function authFetch(path: string, opts: RequestInit = {}) {
  const token = localStorage.getItem("plutonium_token") || "";
  return fetch(`${window.location.origin}/api${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(opts.headers || {}) },
  });
}

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

export default function AdminStore() {
  const { data: items, refetch } = useGetStoreItems();
  const { mutate: create, isPending: creating } = useAdminCreateStoreItem();
  const { mutate: update, isPending: updating } = useAdminUpdateStoreItem();
  const { mutate: del } = useAdminDeleteStoreItem();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [editItem, setEditItem] = useState<StoreItem | null>(null);
  const [form, setForm] = useState<FormState>({ ...EMPTY_FORM });

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCurrency, setFilterCurrency] = useState("all");

  const [allCategories, setAllCategories] = useState<{ value: string; label: string }[]>([
    { value: "all", label: "All Categories" },
  ]);

  useEffect(() => {
    authFetch("/admin/store-categories")
      .then(r => r.ok ? r.json() : [])
      .then((cats: any[]) => {
        setAllCategories([
          { value: "all", label: "All Categories" },
          ...cats.map(c => ({ value: c.value, label: c.name })),
        ]);
      })
      .catch(() => {});
  }, []);

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

  const hasFilters = search || filterCategory !== "all" || filterStatus !== "all" || filterCurrency !== "all";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Store Items</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage packages available in the shop.{" "}
            <Link href="/admin/categories" className="text-primary hover:underline">
              Manage categories →
            </Link>
          </p>
        </div>
        <Button onClick={openCreate} className="bg-primary text-primary-foreground font-bold shrink-0">
          <Plus className="w-4 h-4 mr-2" /> Add Item
        </Button>
      </div>

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
        {hasFilters && (
          <Button
            variant="ghost" size="sm"
            onClick={() => { setSearch(""); setFilterCategory("all"); setFilterStatus("all"); setFilterCurrency("all"); }}
            className="text-muted-foreground h-9"
          >
            <X className="w-3.5 h-3.5 mr-1.5" /> Clear
          </Button>
        )}
        <span className="text-xs text-muted-foreground ml-auto">
          {filtered.length} / {items?.length ?? 0} items
        </span>
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
                  <Badge variant="outline" className="capitalize">
                    {allCategories.find(c => c.value === item.category)?.label || item.category.replace(/_/g, " ")}
                  </Badge>
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
                    {allCategories.filter(c => c.value !== "all").map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
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
