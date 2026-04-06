import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  ArrowLeft, CheckCircle, Clock, XCircle, RotateCcw,
  User, ShoppingBag, Tag, Calendar, CreditCard,
  ImageIcon, ExternalLink, AlertCircle, Package,
  FileCheck, Zap,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

function authFetch(path: string, opts: RequestInit = {}) {
  const token = localStorage.getItem("plutonium_token") || "";
  return fetch(`${window.location.origin}/api${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(opts.headers || {}) },
  });
}

const STATUS_MAP = {
  completed: { icon: CheckCircle, label: "Completed", cls: "text-primary",     bg: "bg-primary/10",     border: "border-primary/30",     dot: "bg-primary" },
  pending:   { icon: Clock,       label: "Pending",   cls: "text-yellow-500",  bg: "bg-yellow-500/10",  border: "border-yellow-500/30",  dot: "bg-yellow-500" },
  failed:    { icon: XCircle,     label: "Failed",    cls: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30", dot: "bg-destructive" },
  refunded:  { icon: RotateCcw,   label: "Refunded",  cls: "text-blue-400",    bg: "bg-blue-400/10",    border: "border-blue-400/30",    dot: "bg-blue-400" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status as keyof typeof STATUS_MAP] || STATUS_MAP.pending;
  const Icon = s.icon;
  return (
    <Badge variant="outline" className={`flex items-center gap-1.5 px-3 py-1 text-sm font-semibold ${s.cls} ${s.bg} ${s.border}`}>
      <Icon className="w-4 h-4" /> {s.label}
    </Badge>
  );
}

const ORDER_STAGES = [
  { key: "placed",    label: "Placed",   Icon: Package   },
  { key: "proof",     label: "Proof",    Icon: FileCheck },
  { key: "review",    label: "Review",   Icon: Clock     },
  { key: "completed", label: "Done",     Icon: Zap       },
];

function getStageIndex(p: any): number {
  if (p.status === "completed") return 3;
  if (p.paymentProofUrl) return 2;
  return 0;
}

export default function AdminPurchaseDetail() {
  const [, params] = useRoute("/admin/purchases/:id");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const id = params?.id;

  const isAdmin = user?.role === "admin" || user?.role === "owner";

  const { data: purchase, isLoading, refetch } = useQuery({
    queryKey: ["admin-purchase", id],
    queryFn: async () => {
      const r = await authFetch(`/admin/purchases/${id}`);
      if (!r.ok) throw new Error("Not found");
      return r.json();
    },
    enabled: !!id,
  });

  const [statusUpdate, setStatusUpdate] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSaveStatus = async () => {
    if (!isAdmin) return;
    setSaving(true);
    try {
      const r = await authFetch(`/admin/purchases/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: statusUpdate, notes }),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      toast({ title: "Order updated successfully" });
      refetch();
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!purchase) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto" />
          <p className="text-muted-foreground">Order not found.</p>
          <Button variant="outline" onClick={() => setLocation("/admin/purchases")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Purchases
          </Button>
        </div>
      </div>
    );
  }

  const p = purchase;
  const currentStage = getStageIndex(p);
  const statusCfg = STATUS_MAP[p.status as keyof typeof STATUS_MAP] || STATUS_MAP.pending;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/admin/purchases")} className="gap-2 text-muted-foreground mt-1">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-display font-bold">Order Details</h1>
          <p className="text-muted-foreground text-xs font-mono mt-0.5 flex items-center gap-2">
            <span>{p.id}</span>
          </p>
        </div>
        <StatusBadge status={p.status} />
      </div>

      {/* Stage progress bar */}
      {(p.status === "pending" || p.status === "completed") && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-5">Order Progress</p>
          <div className="flex items-center">
            {ORDER_STAGES.map((stage, i) => {
              const done = i <= currentStage;
              const active = i === currentStage && p.status !== "completed";
              const { Icon } = stage;
              return (
                <div key={stage.key} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-1.5 w-full">
                    <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all ${
                      done ? "bg-primary border-primary text-primary-foreground" : "border-border bg-card text-muted-foreground"
                    } ${active ? "ring-2 ring-primary/40 ring-offset-2 ring-offset-card" : ""}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className={`text-xs font-medium text-center ${done ? "text-foreground" : "text-muted-foreground"}`}>
                      {stage.label}
                    </span>
                  </div>
                  {i < ORDER_STAGES.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-1 rounded-full -mt-4 ${i < currentStage ? "bg-primary" : "bg-border"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Item summary */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2 bg-background/30">
              <ShoppingBag className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">Order Summary</span>
            </div>
            <div className="divide-y divide-border">
              {[
                { icon: <Tag className="w-4 h-4 text-muted-foreground" />, label: "Item", value: <span className="font-bold">{p.itemName}</span> },
                {
                  icon: <ShoppingBag className="w-4 h-4 text-muted-foreground" />,
                  label: "Category",
                  value: <span className="capitalize px-2 py-0.5 bg-border/50 rounded text-xs">{p.itemCategory?.replace("_", " ")}</span>,
                },
                {
                  icon: <CreditCard className="w-4 h-4 text-muted-foreground" />,
                  label: "Amount Paid",
                  value: <span className="font-bold text-primary text-lg">${(p.pricePaid / 100).toFixed(2)}</span>,
                },
                ...(p.couponUsed ? [{
                  icon: <Tag className="w-4 h-4 text-muted-foreground" />,
                  label: "Coupon",
                  value: <span className="font-mono text-primary bg-primary/10 px-2 py-0.5 rounded text-xs">{p.couponUsed}</span>,
                }] : []),
                {
                  icon: <Calendar className="w-4 h-4 text-muted-foreground" />,
                  label: "Placed",
                  value: <span className="text-sm">{format(new Date(p.createdAt), "MMM d, yyyy 'at' h:mm a")}</span>,
                },
              ].map((row, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">{row.icon} {row.label}</div>
                  <div className="text-sm text-right">{row.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer card */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2 bg-background/30">
              <User className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">Customer</span>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-4">
                <Avatar className="w-14 h-14 border-2 border-border">
                  <AvatarImage src={p.user?.discordAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.username}`} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">{(p.username || "?")[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-base">{p.username || "Unknown"}</p>
                  {p.user?.email && (
                    <p className="text-sm text-muted-foreground mt-0.5">{p.user.email}</p>
                  )}
                  <p className="text-xs text-muted-foreground font-mono mt-1 break-all">{p.userId}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Proof */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center gap-2 bg-background/30">
              <ImageIcon className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">Payment Proof</span>
              {p.paymentProofUrl ? (
                <Badge variant="outline" className="text-green-500 border-green-500 bg-green-500/10 ml-auto text-xs">
                  <CheckCircle className="w-3 h-3 mr-1" /> Submitted
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground border-border ml-auto text-xs">
                  Awaiting
                </Badge>
              )}
            </div>
            <div className="p-5">
              {p.paymentProofUrl ? (
                <div className="space-y-3">
                  {p.paymentProofSubmittedAt && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      Submitted {format(new Date(p.paymentProofSubmittedAt), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  )}
                  <div className="relative group rounded-xl overflow-hidden border border-border bg-background/50">
                    <img
                      src={p.paymentProofUrl}
                      alt="Payment proof screenshot"
                      className="w-full max-h-96 object-contain"
                    />
                    <a
                      href={p.paymentProofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm flex items-center gap-2 font-medium">
                        <ExternalLink className="w-4 h-4" /> View Full Size
                      </div>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  <div className="w-12 h-12 rounded-full bg-border/50 flex items-center justify-center mx-auto mb-3">
                    <ImageIcon className="w-6 h-6 opacity-40" />
                  </div>
                  <p className="text-sm font-medium">No payment proof submitted yet</p>
                  <p className="text-xs mt-1">The customer will upload their payment screenshot from the checkout flow.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">
          {isAdmin && (
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center gap-2 bg-background/30">
                <Zap className="w-4 h-4 text-primary" />
                <span className="font-semibold text-sm">Update Order</span>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</Label>
                  <Select value={statusUpdate || p.status} onValueChange={setStatusUpdate}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">
                        <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-yellow-500" /> Pending</div>
                      </SelectItem>
                      <SelectItem value="completed">
                        <div className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Completed</div>
                      </SelectItem>
                      <SelectItem value="failed">
                        <div className="flex items-center gap-2"><XCircle className="w-3.5 h-3.5 text-destructive" /> Failed</div>
                      </SelectItem>
                      <SelectItem value="refunded">
                        <div className="flex items-center gap-2"><RotateCcw className="w-3.5 h-3.5 text-blue-400" /> Refunded</div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Admin Notes</Label>
                  <Textarea
                    placeholder="Internal notes (not shown to customer)..."
                    value={notes || p.notes || ""}
                    onChange={e => setNotes(e.target.value)}
                    rows={4}
                    className="resize-none text-sm"
                  />
                </div>

                <Button
                  onClick={handleSaveStatus}
                  disabled={saving}
                  className="w-full"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          )}

          {/* Quick info */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Order Info</p>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Order ID</p>
                <p className="font-mono text-xs break-all text-muted-foreground bg-background/50 border border-border rounded-lg p-2">{p.id}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Current Status</p>
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${statusCfg.border} ${statusCfg.bg}`}>
                  <div className={`w-2 h-2 rounded-full ${statusCfg.dot}`} />
                  <span className={`text-sm font-semibold ${statusCfg.cls}`}>{statusCfg.label}</span>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">Date Placed</p>
                <p className="text-sm">{format(new Date(p.createdAt), "MMM d, yyyy")}</p>
                <p className="text-xs text-muted-foreground">{format(new Date(p.createdAt), "h:mm a")}</p>
              </div>

              {p.paymentProofSubmittedAt && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Proof Submitted</p>
                  <p className="text-sm">{format(new Date(p.paymentProofSubmittedAt), "MMM d, yyyy")}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(p.paymentProofSubmittedAt), "h:mm a")}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
