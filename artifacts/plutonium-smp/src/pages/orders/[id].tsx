import { useState, useRef } from "react";
import { useRoute, useLocation, Link, Redirect } from "wouter";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, CheckCircle, Clock, XCircle, RotateCcw, ShoppingBag,
  Tag, Calendar, CreditCard, Upload, ImageIcon, AlertCircle, Info,
} from "lucide-react";

function authFetch(path: string, opts: RequestInit = {}) {
  const token = localStorage.getItem("plutonium_token") || "";
  return fetch(`${window.location.origin}/api${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${token}`, ...(opts.headers || {}) },
  });
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { icon: React.ReactNode; label: string; className: string }> = {
    completed: { icon: <CheckCircle className="w-4 h-4" />, label: "Completed",  className: "text-primary border-primary bg-primary/10" },
    pending:   { icon: <Clock className="w-4 h-4" />,       label: "Pending",    className: "text-yellow-500 border-yellow-500 bg-yellow-500/10" },
    failed:    { icon: <XCircle className="w-4 h-4" />,     label: "Failed",     className: "text-destructive border-destructive bg-destructive/10" },
    refunded:  { icon: <RotateCcw className="w-4 h-4" />,   label: "Refunded",   className: "text-blue-400 border-blue-400 bg-blue-400/10" },
  };
  const s = map[status] || { icon: <Clock className="w-4 h-4" />, label: status, className: "" };
  return (
    <Badge variant="outline" className={`flex items-center gap-1.5 px-3 py-1 text-sm font-semibold ${s.className}`}>
      {s.icon} {s.label}
    </Badge>
  );
}

export default function OrderDetail() {
  const [, params] = useRoute("/orders/:id");
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const id = params?.id;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [proofSubmitted, setProofSubmitted] = useState(false);

  const { data: purchase, isLoading, refetch } = useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      const r = await authFetch(`/purchases/${id}`);
      if (!r.ok) throw new Error("Not found");
      return r.json();
    },
    enabled: !!id && !!user,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image file (PNG, JPG, WEBP).", variant: "destructive" });
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max file size is 8MB. Try compressing the screenshot first.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmitProof = async () => {
    if (!previewUrl) return;
    setUploading(true);
    try {
      const r = await authFetch(`/purchases/${id}/payment-proof`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl: previewUrl }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Failed");
      toast({ title: "Payment proof submitted!", description: "An admin will review and confirm your order shortly." });
      setProofSubmitted(true);
      refetch();
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  if (authLoading || (user && isLoading)) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Redirect to="/login" />;

  if (!isLoading && !purchase) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Order not found</h1>
        <p className="text-muted-foreground mb-6">This order doesn't exist or doesn't belong to your account.</p>
        <Link href="/dashboard">
          <Button><ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const p = purchase;
  const hasProof = !!p?.paymentProofUrl;
  const isPending = p?.status === "pending";

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="flex items-center gap-3 mb-8">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/dashboard")} className="gap-2 text-muted-foreground">
          <ArrowLeft className="w-4 h-4" /> Dashboard
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-display font-bold">Order Details</h1>
          <p className="text-muted-foreground text-xs font-mono mt-0.5">{p?.id}</p>
        </div>
        {p && <StatusBadge status={p.status} />}
      </div>

      {p && (
        <div className="space-y-6">
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
                { icon: <CreditCard className="w-4 h-4 text-muted-foreground" />, label: "Total", value: <span className="font-bold text-primary text-lg">${(p.pricePaid / 100).toFixed(2)}</span> },
                ...(p.couponUsed ? [{ icon: <Tag className="w-4 h-4 text-muted-foreground" />, label: "Coupon Used", value: <span className="font-mono text-primary">{p.couponUsed}</span> }] : []),
                { icon: <Calendar className="w-4 h-4 text-muted-foreground" />, label: "Placed", value: format(new Date(p.createdAt), "MMM d, yyyy 'at' h:mm a") },
              ].map((row, i) => (
                <div key={i} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">{row.icon} {row.label}</div>
                  <div className="text-sm">{row.value}</div>
                </div>
              ))}
            </CardContent>
          </Card>

          {p.status === "completed" && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 flex items-start gap-4">
              <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-primary">Order Confirmed!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your payment has been verified and your item has been delivered. Enjoy your purchase!
                </p>
              </div>
            </div>
          )}

          {p.status === "refunded" && (
            <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-5 flex items-start gap-4">
              <RotateCcw className="w-6 h-6 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-blue-400">Order Refunded</p>
                <p className="text-sm text-muted-foreground mt-1">This order has been refunded. Contact support if you have questions.</p>
              </div>
            </div>
          )}

          {isPending && (
            <Card className="bg-card border-border shadow-md">
              <CardHeader className="border-b border-border pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Upload className="w-4 h-4 text-primary" />
                  Submit Payment Proof
                  {hasProof && <Badge variant="outline" className="text-green-500 border-green-500 ml-auto">Submitted</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-5">
                <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-4 flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5 shrink-0" />
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">How to complete your order:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Complete the payment using the server's accepted payment method</li>
                      <li>Take a screenshot of your payment confirmation</li>
                      <li>Upload the screenshot below</li>
                      <li>An admin will verify and activate your purchase</li>
                    </ol>
                  </div>
                </div>

                {hasProof && !proofSubmitted ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">Your payment proof has been submitted and is under review.</p>
                    <div className="relative rounded-xl overflow-hidden border border-border bg-background/50">
                      <img src={p.paymentProofUrl} alt="Your payment proof" className="w-full max-h-64 object-contain" />
                    </div>
                    {p.paymentProofSubmittedAt && (
                      <p className="text-xs text-muted-foreground">
                        Submitted {format(new Date(p.paymentProofSubmittedAt), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    )}
                  </div>
                ) : proofSubmitted ? (
                  <div className="text-center py-6">
                    <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
                    <p className="font-semibold">Payment proof submitted!</p>
                    <p className="text-sm text-muted-foreground mt-1">An admin will review and confirm your order shortly.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    {previewUrl ? (
                      <div className="space-y-3">
                        <div className="relative rounded-xl overflow-hidden border-2 border-primary/50 bg-background/50">
                          <img src={previewUrl} alt="Preview" className="w-full max-h-64 object-contain" />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => { setPreviewUrl(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                          >
                            Remove
                          </Button>
                          <Button
                            className="flex-1 gap-2"
                            onClick={handleSubmitProof}
                            disabled={uploading}
                          >
                            <Upload className="w-4 h-4" />
                            {uploading ? "Uploading..." : "Submit Proof"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-10 text-center transition-colors group"
                      >
                        <ImageIcon className="w-10 h-10 text-muted-foreground group-hover:text-primary mx-auto mb-3 transition-colors" />
                        <p className="font-semibold text-sm group-hover:text-primary transition-colors">Click to upload screenshot</p>
                        <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP up to 8MB</p>
                      </button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {p.status === "failed" && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 flex items-start gap-4">
              <XCircle className="w-6 h-6 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-destructive">Order Failed</p>
                <p className="text-sm text-muted-foreground mt-1">
                  This order could not be completed. Please contact support on our Discord server for assistance.
                </p>
                {p.notes && <p className="text-sm text-muted-foreground mt-2 italic">Note: {p.notes}</p>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
