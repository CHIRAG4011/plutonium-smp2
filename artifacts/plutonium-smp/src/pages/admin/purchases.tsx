import { useState } from "react";
import { useAdminGetPurchases } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { format } from "date-fns";
import { CheckCircle, Clock, XCircle, RotateCcw, ExternalLink, Search } from "lucide-react";

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

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { icon: JSX.Element; className: string }> = {
    completed: { icon: <CheckCircle className="w-3 h-3" />, className: "text-primary border-primary bg-primary/10" },
    pending:   { icon: <Clock className="w-3 h-3" />,       className: "text-yellow-500 border-yellow-500 bg-yellow-500/10" },
    failed:    { icon: <XCircle className="w-3 h-3" />,     className: "text-destructive border-destructive bg-destructive/10" },
    refunded:  { icon: <RotateCcw className="w-3 h-3" />,   className: "text-blue-400 border-blue-400 bg-blue-400/10" },
  };
  const s = map[status] || { icon: <Clock className="w-3 h-3" />, className: "" };
  return (
    <Badge variant="outline" className={`flex items-center gap-1 ${s.className}`}>
      {s.icon}{status}
    </Badge>
  );
}

export default function AdminPurchases() {
  const { data: purchases, isLoading, refetch } = useAdminGetPurchases();
  const { toast } = useToast();
  const { user } = useAuth();
  const [selected, setSelected] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const isAdmin = user?.role === "admin" || user?.role === "owner";

  const openDetail = async (p: any) => {
    setSelected(p);
    setStatusUpdate(p.status);
    setNotes(p.notes || "");
    setDetailOpen(true);
    try {
      const r = await authFetch(`/admin/purchases/${p.id}`);
      if (r.ok) {
        const detail = await r.json();
        setSelected(detail);
      }
    } catch { }
  };

  const handleSaveStatus = async () => {
    if (!selected || !isAdmin) return;
    setSaving(true);
    try {
      const r = await authFetch(`/admin/purchases/${selected.id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: statusUpdate, notes }),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      toast({ title: "Status updated" });
      refetch();
      setDetailOpen(false);
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const filtered = purchases?.filter(p => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.id.toLowerCase().includes(q) ||
      p.itemName.toLowerCase().includes(q) ||
      (p as any).username?.toLowerCase().includes(q) ||
      p.userId.toLowerCase().includes(q)
    );
  }) ?? [];

  if (isLoading) return <div className="p-8 text-muted-foreground">Loading purchases...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Purchase Log</h1>
          <p className="text-muted-foreground text-sm mt-1">{purchases?.length ?? 0} total orders</p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader className="bg-background/50">
            <TableRow className="border-border">
              <TableHead>Order ID</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Date</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(p => (
              <TableRow key={p.id} className="border-border hover:bg-border/20 cursor-pointer" onClick={() => openDetail(p)}>
                <TableCell className="font-mono text-xs text-muted-foreground">{p.id.slice(0, 10)}…</TableCell>
                <TableCell>
                  <div>
                    <span className="font-medium">{(p as any).username || "—"}</span>
                    <p className="text-xs text-muted-foreground font-mono">{p.userId.slice(0, 8)}…</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <span className="font-bold">{p.itemName}</span>
                    <p className="text-xs text-muted-foreground capitalize">{p.itemCategory.replace("_", " ")}</p>
                  </div>
                </TableCell>
                <TableCell className="font-bold">${(p.pricePaid / 100).toFixed(2)}</TableCell>
                <TableCell><StatusBadge status={p.status} /></TableCell>
                <TableCell className="text-right text-sm text-muted-foreground">
                  {format(new Date(p.createdAt), "MMM d, yyyy")}
                </TableCell>
                <TableCell>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  {search ? "No matching orders found" : "No purchases yet"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="bg-muted/30 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order ID</span>
                  <span className="font-mono text-xs">{selected.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer</span>
                  <span className="font-medium">{selected.username || selected.userId}</span>
                </div>
                {selected.user?.email && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email</span>
                    <span>{selected.user.email}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Item</span>
                  <span className="font-bold">{selected.itemName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category</span>
                  <span className="capitalize">{selected.itemCategory?.replace("_", " ")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-bold text-primary">${(selected.pricePaid / 100).toFixed(2)}</span>
                </div>
                {selected.couponUsed && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Coupon</span>
                    <span className="font-mono text-primary">{selected.couponUsed}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Placed</span>
                  <span>{format(new Date(selected.createdAt), "MMM d, yyyy h:mm a")}</span>
                </div>
              </div>

              {isAdmin && (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-muted-foreground mb-1.5 block">Update Status</label>
                    <Select value={statusUpdate} onValueChange={setStatusUpdate}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="refunded">Refunded</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1.5 block">Admin Notes</label>
                    <Textarea
                      placeholder="Internal notes about this order..."
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      rows={2}
                    />
                  </div>
                  <Button onClick={handleSaveStatus} disabled={saving} className="w-full">
                    {saving ? "Saving..." : "Update Order"}
                  </Button>
                </div>
              )}

              {!isAdmin && (
                <div className="text-center text-sm text-muted-foreground py-2">
                  <StatusBadge status={selected.status} />
                  <p className="mt-2">Contact an admin to update this order's status.</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
