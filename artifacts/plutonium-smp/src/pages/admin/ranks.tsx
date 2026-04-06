import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit2, Trash2, Star, ShoppingBag, X } from "lucide-react";

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

const DEFAULT_FORM = { name: "", color: "#22c55e", description: "", price: "", features: [] as string[] };

export default function AdminRanks() {
  const { toast } = useToast();
  const [ranks, setRanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [editForm, setEditForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [featureInput, setFeatureInput] = useState("");
  const [editFeatureInput, setEditFeatureInput] = useState("");

  const loadRanks = async () => {
    try {
      const r = await authFetch("/admin/ranks");
      if (r.ok) setRanks(await r.json());
    } catch { } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRanks(); }, []);

  const addFeature = (isEdit: boolean) => {
    const val = isEdit ? editFeatureInput.trim() : featureInput.trim();
    if (!val) return;
    if (isEdit) {
      setEditForm(f => ({ ...f, features: [...f.features, val] }));
      setEditFeatureInput("");
    } else {
      setForm(f => ({ ...f, features: [...f.features, val] }));
      setFeatureInput("");
    }
  };

  const removeFeature = (isEdit: boolean, idx: number) => {
    if (isEdit) {
      setEditForm(f => ({ ...f, features: f.features.filter((_, i) => i !== idx) }));
    } else {
      setForm(f => ({ ...f, features: f.features.filter((_, i) => i !== idx) }));
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await authFetch("/admin/ranks", {
        method: "POST",
        body: JSON.stringify({ ...form, price: Math.round(parseFloat(form.price || "0") * 100) }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      toast({ title: "Rank created", description: `${form.name} has been added to the store.` });
      setCreateOpen(false);
      setForm(DEFAULT_FORM);
      setFeatureInput("");
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
        body: JSON.stringify({ ...editForm, price: Math.round(parseFloat(editForm.price || "0") * 100) }),
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
      price: ((rank.price || 0) / 100).toFixed(2),
      features: rank.features || [],
    });
    setEditFeatureInput("");
    setEditOpen(true);
  }

  function RankForm({ values, setValues, featureInput: fi, setFeatureInput: setFi, isEdit }: any) {
    return (
      <div className="space-y-4">
        <div>
          <Label className="text-sm text-muted-foreground mb-1.5 block">Rank Name</Label>
          <Input
            placeholder="e.g. VIP, MVP, Legend"
            required
            value={values.name}
            onChange={e => setValues({ ...values, name: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm text-muted-foreground mb-1.5 block">Price (USD)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="9.99"
              value={values.price}
              onChange={e => setValues({ ...values, price: e.target.value })}
            />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">Color</Label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setValues({ ...values, color: c })}
                  className="w-5 h-5 rounded-full transition-transform hover:scale-110 border-2"
                  style={{ background: c, borderColor: values.color === c ? "white" : "transparent" }}
                />
              ))}
              <Input
                type="color"
                value={values.color}
                onChange={e => setValues({ ...values, color: e.target.value })}
                className="w-9 h-7 p-0.5 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
        <div>
          <Label className="text-sm text-muted-foreground mb-1.5 block">Description</Label>
          <Textarea
            placeholder="Describe what this rank offers..."
            value={values.description}
            onChange={e => setValues({ ...values, description: e.target.value })}
            rows={2}
            className="resize-none text-sm"
          />
        </div>
        <div>
          <Label className="text-sm text-muted-foreground mb-1.5 block">
            Perks / Features ({values.features.length})
          </Label>
          <div className="flex gap-2 mb-2">
            <Input
              placeholder="e.g. 2x OWO multiplier"
              value={fi}
              onChange={e => setFi(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addFeature(isEdit); } }}
            />
            <Button type="button" variant="outline" size="sm" onClick={() => addFeature(isEdit)}>
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {values.features.map((f: string, i: number) => (
              <span
                key={i}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg"
                style={{ background: `${values.color}20`, color: values.color }}
              >
                {f}
                <button type="button" onClick={() => removeFeature(isEdit, i)}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-2">
            <Star className="w-7 h-7 text-primary" />
            Ranks
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Create cosmetic ranks for players. Each rank automatically appears in the store.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> New Rank
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground">Loading ranks...</div>
      ) : ranks.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-xl">
          <Star className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground mb-1">No ranks created yet.</p>
          <p className="text-sm text-muted-foreground/60">Ranks are cosmetic and automatically listed in the store.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {ranks.map(rank => (
            <div key={rank.id} className="bg-card border border-border rounded-xl p-5 flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: rank.color }} />
                  <span className="font-bold text-lg">{rank.name}</span>
                  <Badge variant="outline" className="text-xs ml-auto sm:ml-0 font-bold" style={{ borderColor: rank.color, color: rank.color }}>
                    ${((rank.price || 0) / 100).toFixed(2)}
                  </Badge>
                  {rank.storeItemId && (
                    <span className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
                      <ShoppingBag className="w-3 h-3" /> In Store
                    </span>
                  )}
                </div>
                {rank.description && (
                  <p className="text-sm text-muted-foreground mb-2">{rank.description}</p>
                )}
                <div className="flex flex-wrap gap-1.5">
                  {rank.features?.length > 0 ? rank.features.map((f: string, i: number) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-0.5 rounded-md"
                      style={{ background: `${rank.color}20`, color: rank.color }}
                    >
                      {f}
                    </span>
                  )) : (
                    <span className="text-xs text-muted-foreground italic">No perks added</span>
                  )}
                </div>
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
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="w-4 h-4 text-primary" /> Create Rank
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-5">
            <RankForm values={form} setValues={setForm} featureInput={featureInput} setFeatureInput={setFeatureInput} isEdit={false} />
            <div className="flex gap-3 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button type="submit" className="flex-1" disabled={saving}>
                {saving ? "Creating..." : "Create Rank"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Rank: {editTarget?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-5">
            <RankForm values={editForm} setValues={setEditForm} featureInput={editFeatureInput} setFeatureInput={setEditFeatureInput} isEdit={true} />
            <div className="flex gap-3 pt-1">
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
