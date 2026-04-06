import { useState } from "react";
import { useAdminGetPurchases } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { CheckCircle, Clock, XCircle, RotateCcw, Search, ExternalLink, ImageIcon } from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { icon: React.ReactNode; className: string }> = {
    completed: { icon: <CheckCircle className="w-3 h-3" />, className: "text-primary border-primary bg-primary/10" },
    pending:   { icon: <Clock className="w-3 h-3" />,       className: "text-yellow-500 border-yellow-500 bg-yellow-500/10" },
    failed:    { icon: <XCircle className="w-3 h-3" />,     className: "text-destructive border-destructive bg-destructive/10" },
    refunded:  { icon: <RotateCcw className="w-3 h-3" />,   className: "text-blue-400 border-blue-400 bg-blue-400/10" },
  };
  const s = map[status] || { icon: <Clock className="w-3 h-3" />, className: "" };
  return (
    <Badge variant="outline" className={`flex items-center gap-1 ${s.className}`}>
      {s.icon} {status}
    </Badge>
  );
}

export default function AdminPurchases() {
  const { data: purchases, isLoading } = useAdminGetPurchases();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = purchases?.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || (
      p.id.toLowerCase().includes(q) ||
      p.itemName.toLowerCase().includes(q) ||
      (p as any).username?.toLowerCase().includes(q) ||
      p.userId.toLowerCase().includes(q)
    );
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  }) ?? [];

  if (isLoading) return <div className="p-8 text-muted-foreground animate-pulse">Loading purchases...</div>;

  const counts = {
    all: purchases?.length ?? 0,
    pending: purchases?.filter(p => p.status === "pending").length ?? 0,
    completed: purchases?.filter(p => p.status === "completed").length ?? 0,
  };

  const proofCount = purchases?.filter((p: any) => p.paymentProofUrl).length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Purchase Log</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {counts.all} total · {counts.pending} pending · {proofCount} with proof
          </p>
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

      <div className="flex gap-2">
        {[
          { key: "all", label: "All", count: counts.all },
          { key: "pending", label: "Pending", count: counts.pending },
          { key: "completed", label: "Completed", count: counts.completed },
          { key: "failed", label: "Failed", count: purchases?.filter(p => p.status === "failed").length ?? 0 },
          { key: "refunded", label: "Refunded", count: purchases?.filter(p => p.status === "refunded").length ?? 0 },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              statusFilter === tab.key
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${statusFilter === tab.key ? "bg-white/20" : "bg-muted"}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <Table>
          <TableHeader className="bg-background/50">
            <TableRow className="border-border">
              <TableHead>Order ID</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Proof</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Date</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(p => (
              <TableRow
                key={p.id}
                className="border-border hover:bg-muted/20 cursor-pointer transition-colors"
                onClick={() => setLocation(`/admin/purchases/${p.id}`)}
              >
                <TableCell className="font-mono text-xs text-muted-foreground">{p.id.slice(0, 10)}…</TableCell>
                <TableCell>
                  <div>
                    <span className="font-medium">{(p as any).username || "—"}</span>
                    <p className="text-xs text-muted-foreground font-mono">{p.userId.slice(0, 8)}…</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <span className="font-bold text-sm">{p.itemName}</span>
                    <p className="text-xs text-muted-foreground capitalize">{p.itemCategory.replace("_", " ")}</p>
                  </div>
                </TableCell>
                <TableCell className="font-bold">${(p.pricePaid / 100).toFixed(2)}</TableCell>
                <TableCell>
                  {(p as any).paymentProofUrl ? (
                    <Badge variant="outline" className="text-green-500 border-green-500 bg-green-500/10 text-xs gap-1">
                      <ImageIcon className="w-3 h-3" /> Submitted
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
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
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                  {search || statusFilter !== "all" ? "No matching orders found" : "No purchases yet"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
