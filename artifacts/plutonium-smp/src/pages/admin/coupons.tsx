import { useState } from "react";
import { useAdminGetCoupons, useAdminCreateCoupon } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { Plus, Trash2, ToggleLeft, ToggleRight, Copy, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

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

const STORE_CATEGORIES = [
  { value: "ranks", label: "Ranks" },
  { value: "crate_keys", label: "Crate Keys" },
  { value: "cosmetics", label: "Cosmetics" },
  { value: "coins", label: "Coins" },
  { value: "boosts", label: "Boosts" },
  { value: "bundles", label: "Bundles" },
  { value: "seasonal", label: "Seasonal" },
  { value: "permissions", label: "Permissions" },
];

const DEFAULT_FORM = {
  code: "",
  discountType: "percent",
  discountPercent: "10",
  discountFixed: "",
  usageLimit: "",
  maxUsesPerUser: "",
  expiresAt: "",
  minCartValue: "",
  description: "",
  firstTimeOnly: false,
  applicableCategories: [] as string[],
};

export default function AdminCoupons() {
  const { data, refetch } = useAdminGetCoupons();
  const { mutate: createCoupon, isPending: creating } = useAdminCreateCoupon();
  const { toast } = useToast();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [toggling, setToggling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const isAdmin = user?.role === "admin" || user?.role === "owner";

  const toggleCategory = (cat: string) => {
    setForm(f => ({
      ...f,
      applicableCategories: f.applicableCategories.includes(cat)
        ? f.applicableCategories.filter(c => c !== cat)
        : [...f.applicableCategories, cat],
    }));
  };

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    setForm(f => ({ ...f, code }));
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim()) return;
    const payload: any = {
      code: form.code.trim().toUpperCase(),
      discountType: form.discountType,
      discountPercent: form.discountType === "percent" ? Number(form.discountPercent) : 0,
      discountFixed: form.discountType === "fixed" ? Number(form.discountFixed) : undefined,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
      expiresAt: form.expiresAt || undefined,
      minCartValue: form.minCartValue ? Number(form.minCartValue) * 100 : undefined,
      description: form.description || undefined,
    };
    createCoupon({ data: payload }, {
      onSuccess: () => {
        toast({ title: "Coupon created", description: `Code: ${payload.code}` });
        setOpen(false);
        setForm(DEFAULT_FORM);
        refetch();
      },
      onError: (err: any) => toast({ title: "Failed", description: err.message, variant: "destructive" }),
    });
  };

  const handleToggle = async (id: string) => {
    setToggling(id);
    try {
      const r = await authFetch(`/admin/coupons/${id}/toggle`, { method: "PATCH" });
      if (!r.ok) throw new Error((await r.json()).error);
      refetch();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setToggling(null);
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Delete coupon "${code}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      const r = await authFetch(`/admin/coupons/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error((await r.json()).error);
      toast({ title: "Coupon deleted" });
      refetch();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Coupons</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {data?.length ?? 0} total · {data?.filter(c => c.isActive).length ?? 0} active
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Create Coupon
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader className="bg-background/50">
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Min Cart</TableHead>
              <TableHead>Uses</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.map(c => (
              <TableRow key={c.id} className={!c.isActive ? "opacity-50" : ""}>
                <TableCell>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-primary">{c.code}</span>
                      <button
                        onClick={() => copyCode(c.code)}
                        className="text-muted-foreground hover:text-primary transition-colors"
                        title="Copy code"
                      >
                        {copied === c.code ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    {(c as any).description && (
                      <p className="text-xs text-muted-foreground mt-0.5 max-w-48 truncate">{(c as any).description}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-bold">
                  {(c as any).discountType === "fixed"
                    ? `$${((c as any).discountFixed / 100).toFixed(2)} off`
                    : `${c.discountPercent}% off`}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {(c as any).minCartValue ? `$${((c as any).minCartValue / 100).toFixed(2)}` : "—"}
                </TableCell>
                <TableCell>
                  <span className={`text-sm font-medium ${c.usageLimit && c.usageCount >= c.usageLimit ? "text-destructive" : ""}`}>
                    {c.usageCount}{c.usageLimit ? `/${c.usageLimit}` : ""}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {c.expiresAt ? (
                    <span className={new Date(c.expiresAt) < new Date() ? "text-destructive" : ""}>
                      {format(new Date(c.expiresAt), "MMM d, yyyy")}
                    </span>
                  ) : "Never"}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={c.isActive ? "text-primary border-primary bg-primary/10" : "text-muted-foreground"}>
                    {c.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleToggle(c.id)} disabled={toggling === c.id}>
                      {c.isActive ? <ToggleRight className="w-4 h-4 text-primary" /> : <ToggleLeft className="w-4 h-4" />}
                    </Button>
                    {isAdmin && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(c.id, c.code)} disabled={deleting === c.id}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {data?.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-12">No coupons yet</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Coupon</DialogTitle>
            <DialogDescription>Configure a discount code for your store.</DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label>Coupon Code <span className="text-destructive">*</span></Label>
              <div className="flex gap-2">
                <Input
                  required
                  placeholder="SUMMER25"
                  className="font-mono uppercase"
                  value={form.code}
                  onChange={e => setForm({ ...form, code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") })}
                />
                <Button type="button" variant="outline" onClick={generateCode} className="shrink-0">
                  Generate
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Description <span className="text-xs text-muted-foreground">(internal note)</span></Label>
              <Textarea
                placeholder="e.g. Summer sale 2025 - 25% off everything"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="resize-none"
              />
            </div>

            <Separator />

            <div>
              <p className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Discount</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <Select value={form.discountType} onValueChange={v => setForm({ ...form, discountType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>{form.discountType === "percent" ? "Percentage" : "Amount ($)"}</Label>
                  {form.discountType === "percent" ? (
                    <div className="relative">
                      <Input
                        type="number" min={1} max={100}
                        placeholder="25"
                        value={form.discountPercent}
                        onChange={e => setForm({ ...form, discountPercent: e.target.value })}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                    </div>
                  ) : (
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                      <Input
                        type="number" min={0.01} step={0.01}
                        placeholder="5.00"
                        value={form.discountFixed}
                        onChange={e => setForm({ ...form, discountFixed: e.target.value })}
                        className="pl-7"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Restrictions</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Min Cart Value ($)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                    <Input
                      type="number" min={0} step={0.01}
                      placeholder="10.00 (optional)"
                      value={form.minCartValue}
                      onChange={e => setForm({ ...form, minCartValue: e.target.value })}
                      className="pl-7"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Total Usage Limit</Label>
                  <Input
                    type="number" min={1}
                    placeholder="Unlimited"
                    value={form.usageLimit}
                    onChange={e => setForm({ ...form, usageLimit: e.target.value })}
                  />
                </div>
              </div>

              <div className="mt-3 space-y-1.5">
                <Label>Expiry Date</Label>
                <Input
                  type="datetime-local"
                  value={form.expiresAt}
                  onChange={e => setForm({ ...form, expiresAt: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Leave empty for no expiry</p>
              </div>

              <div className="mt-3 flex items-center gap-3">
                <Switch id="first-time" checked={form.firstTimeOnly} onCheckedChange={v => setForm({ ...form, firstTimeOnly: v })} />
                <label htmlFor="first-time" className="text-sm cursor-pointer select-none">First-time purchase only</label>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
                Applicable Categories
                <span className="text-xs font-normal ml-2">(leave empty for all)</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {STORE_CATEGORIES.map(cat => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => toggleCategory(cat.value)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      form.applicableCategories.includes(cat.value)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={creating}>
              {creating ? "Creating..." : "Create Coupon"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
