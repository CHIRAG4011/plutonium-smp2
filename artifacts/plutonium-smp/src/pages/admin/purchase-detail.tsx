import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  ArrowLeft, CheckCircle, Clock, XCircle, RotateCcw,
  User, ShoppingBag, Tag, Calendar, CreditCard,
  MessageSquare, ImageIcon, ExternalLink, AlertCircle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

function authFetch(path: string, opts: RequestInit = {}) {
  const token = localStorage.getItem("plutonium_token") || "";
  return fetch(`${window.location.origin}/api${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(opts.headers || {}) },
  });
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { icon: React.ReactNode; label: string; className: string }> = {
    completed: { icon: <CheckCircle className="w-4 h-4" />, label: "Completed", className: "text-primary border-primary bg-primary/10" },
    pending:   { icon: <Clock className="w-4 h-4" />,       label: "Pending",   className: "text-yellow-500 border-yellow-500 bg-yellow-500/10" },
    failed:    { icon: <XCircle className="w-4 h-4" />,     label: "Failed",    className: "text-destructive border-destructive bg-destructive/10" },
    refunded:  { icon: <RotateCcw className="w-4 h-4" />,   label: "Refunded",  className: "text-blue-400 border-blue-400 bg-blue-400/10" },
  };
  const s = map[status] || { icon: <Clock className="w-4 h-4" />, label: status, className: "" };
  return (
    <Badge variant="outline" className={`flex items-center gap-1.5 px-3 py-1 text-sm font-semibold ${s.className}`}>
      {s.icon} {s.label}
    </Badge>
  );
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

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/admin/purchases")} className="gap-2 text-muted-foreground">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-display font-bold">Order Details</h1>
          <p className="text-muted-foreground text-sm font-mono">{p.id}</p>
        </div>
        <StatusBadge status={p.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card border-border shadow-md">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShoppingBag className="w-4 h-4 text-primary" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-0 divide-y divide-border">
              {[
                { icon: <Tag className="w-4 h-4 text-muted-foreground" />, label: "Item", value: <span className="font-bold">{p.itemName}</span> },
                { icon: <ShoppingBag className="w-4 h-4 text-muted-foreground" />, label: "Category", value: <span className="capitalize">{p.itemCategory?.replace("_", " ")}</span> },
                { icon: <CreditCard className="w-4 h-4 text-muted-foreground" />, label: "Amount Paid", value: <span className="font-bold text-primary text-lg">${(p.pricePaid / 100).toFixed(2)}</span> },
                ...(p.couponUsed ? [{ icon: <Tag className="w-4 h-4 text-muted-foreground" />, label: "Coupon", value: <span className="font-mono text-primary">{p.couponUsed}</span> }] : []),
                { icon: <Calendar className="w-4 h-4 text-muted-foreground" />, label: "Placed", value: format(new Date(p.createdAt), "MMM d, yyyy 'at' h:mm a") },
              ].map((row, i) => (
                <div key={i} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {row.icon} {row.label}
                  </div>
                  <div className="text-sm text-right">{row.value}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-md">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="w-4 h-4 text-primary" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex items-center gap-4">
                <Avatar className="w-12 h-12 border border-border">
                  <AvatarImage src={p.user?.discordAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.username}`} />
                  <AvatarFallback>{(p.username || "?")[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-bold">{p.username || "Unknown"}</p>
                  {p.user?.email && <p className="text-sm text-muted-foreground">{p.user.email}</p>}
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">{p.userId}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border shadow-md">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <ImageIcon className="w-4 h-4 text-primary" />
                Payment Proof
                {p.paymentProofUrl && (
                  <Badge variant="outline" className="text-green-500 border-green-500 ml-auto">Submitted</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {p.paymentProofUrl ? (
                <div className="space-y-3">
                  {p.paymentProofSubmittedAt && (
                    <p className="text-xs text-muted-foreground">
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
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-2 text-white text-sm flex items-center gap-2">
                        <ExternalLink className="w-4 h-4" /> View Full Size
                      </div>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No payment proof submitted yet</p>
                  <p className="text-xs mt-1">The customer will upload their payment screenshot from their order page.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {isAdmin && (
            <Card className="bg-card border-border shadow-md">
              <CardHeader className="border-b border-border pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  Update Order
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-sm">Status</Label>
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
                  <Label className="text-sm">Admin Notes</Label>
                  <Textarea
                    placeholder="Internal notes about this order (not shown to customer)..."
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
              </CardContent>
            </Card>
          )}

          {p.notes && (
            <Card className="bg-card border-border shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Admin Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{p.notes}</p>
              </CardContent>
            </Card>
          )}

          <Card className="bg-card border-border shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Order ID</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-xs break-all text-muted-foreground">{p.id}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
