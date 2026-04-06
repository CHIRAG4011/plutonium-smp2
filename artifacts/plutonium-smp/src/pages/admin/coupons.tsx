import { useState } from "react";
import { useAdminGetCoupons, useAdminCreateCoupon } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { Plus, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
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

const DEFAULT_FORM = {
  code: "", discountType: "percent", discountPercent: 10, discountFixed: "",
  usageLimit: "", expiresAt: "", minCartValue: "", description: "",
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

  const isAdmin = user?.role === "admin" || user?.role === "owner";

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
      minCartValue: form.minCartValue ? Number(form.minCartValue) : undefined,
      description: form.description || undefined,
    };
    createCoupon({ data: payload }, {
      onSuccess: () => {
        toast({ title: "Coupon created" });
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
                    <span className="font-mono font-bold text-primary">{c.code}</span>
                    {(c as any).description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{(c as any).description}</p>
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
                  <span className="text-sm">{c.usageCount}{c.usageLimit ? `/${c.usageLimit}` : ""}</span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {c.expiresAt ? format(new Date(c.expiresAt), "MMM d, yyyy") : "Never"}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={c.isActive ? "text-primary border-primary" : "text-muted-foreground border-muted"}>
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
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Create Coupon</DialogTitle></DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <Input
              placeholder="CODE (e.g. SUMMER25)"
              required
              value={form.code}
              onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
            />
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Discount Type</label>
              <Select value={form.discountType} onValueChange={v => setForm({ ...form, discountType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Percentage (%)</SelectItem>
                  <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.discountType === "percent" ? (
              <Input
                type="number" min={1} max={100}
                placeholder="Discount % (e.g. 25)"
                value={form.discountPercent}
                onChange={e => setForm({ ...form, discountPercent: Number(e.target.value) })}
              />
            ) : (
              <Input
                type="number" min={1}
                placeholder="Fixed discount in cents (e.g. 500 = $5)"
                value={form.discountFixed}
                onChange={e => setForm({ ...form, discountFixed: e.target.value })}
              />
            )}
            <Input
              type="number" min={1}
              placeholder="Usage limit (leave blank for unlimited)"
              value={form.usageLimit}
              onChange={e => setForm({ ...form, usageLimit: e.target.value })}
            />
            <Input
              type="number" min={1}
              placeholder="Minimum cart value in cents (optional)"
              value={form.minCartValue}
              onChange={e => setForm({ ...form, minCartValue: e.target.value })}
            />
            <Input
              type="datetime-local"
              placeholder="Expires at (optional)"
              value={form.expiresAt}
              onChange={e => setForm({ ...form, expiresAt: e.target.value })}
            />
            <Textarea
              placeholder="Description (optional)"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={2}
            />
            <Button type="submit" className="w-full" disabled={creating}>
              {creating ? "Creating..." : "Create Coupon"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
