import { useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useCartCheckout, useSendCheckoutOtp } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ShoppingCart, Trash2, Plus, Minus, Tag, Mail, ArrowRight,
  Package, Upload, ImageIcon, CheckCircle, Info,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function authFetch(path: string, opts: RequestInit = {}) {
  const token = localStorage.getItem("plutonium_token") || "";
  return fetch(`${window.location.origin}/api${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${token}`, ...(opts.headers || {}) },
  });
}

export default function Cart() {
  const { items, removeItem, updateQuantity, clearCart, total, count } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [couponCode, setCouponCode] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [step, setStep] = useState<"cart" | "otp" | "proof" | "done">("cart");
  const [purchaseIds, setPurchaseIds] = useState<string[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutate: sendOtp, isPending: sendingOtp } = useSendCheckoutOtp();
  const { mutate: checkout, isPending: checkingOut } = useCartCheckout();

  const handleSendOtp = () => {
    if (!user) {
      toast({ title: "Login required", description: "Please log in to checkout.", variant: "destructive" });
      setLocation("/login");
      return;
    }
    sendOtp(undefined, {
      onSuccess: () => {
        setStep("otp");
        toast({ title: "Code sent!", description: `A verification code was sent to ${user.email}` });
      },
      onError: (err: any) => {
        toast({ title: "Failed to send code", description: err?.message || "Please try again.", variant: "destructive" });
      }
    });
  };

  const handleCheckout = () => {
    if (!otpCode.trim()) {
      toast({ title: "Enter verification code", description: "Please enter the code sent to your email.", variant: "destructive" });
      return;
    }
    checkout({
      data: {
        items: items.map(i => ({ itemId: i.item.id, quantity: i.quantity })),
        couponCode: couponCode || undefined,
        otpCode,
      }
    }, {
      onSuccess: (data: any) => {
        clearCart();
        setPurchaseIds(data?.purchaseIds || []);
        setStep("proof");
        toast({ title: "Order placed!", description: "Now upload your payment screenshot to complete." });
      },
      onError: (err: any) => {
        toast({ title: "Checkout failed", description: err?.message || "Invalid code or error occurred.", variant: "destructive" });
      }
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image file (PNG, JPG, WEBP).", variant: "destructive" });
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max file size is 8MB.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmitProof = async () => {
    if (!previewUrl || purchaseIds.length === 0) return;
    setUploading(true);
    try {
      await Promise.all(
        purchaseIds.map(pid =>
          authFetch(`/purchases/${pid}/payment-proof`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageDataUrl: previewUrl }),
          })
        )
      );
      toast({ title: "Payment proof submitted!", description: "An admin will review and activate your order." });
      setStep("done");
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message || "Please try again.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  if (step === "proof") {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg w-full"
        >
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center mx-auto mb-4">
              <Package className="w-10 h-10 text-primary" />
            </div>
            <h1 className="font-display text-3xl font-bold mb-2">Order Placed!</h1>
            <p className="text-muted-foreground">Almost done — upload your payment screenshot to complete the order.</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
            <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Complete your purchase:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Pay using the server's accepted payment method</li>
                  <li>Take a screenshot of your payment confirmation</li>
                  <li>Upload it below — an admin will verify within 24 hours</li>
                </ol>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Upload className="w-4 h-4 text-primary" />
                Upload Payment Screenshot
              </p>

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
                    <img src={previewUrl} alt="Preview" className="w-full max-h-56 object-contain" />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => { setPreviewUrl(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                    >
                      Change Image
                    </Button>
                    <Button
                      className="flex-1 gap-2 bg-primary text-primary-foreground neon-glow-hover"
                      onClick={handleSubmitProof}
                      disabled={uploading}
                    >
                      <Upload className="w-4 h-4" />
                      {uploading ? "Submitting..." : "Submit Proof"}
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

            <div className="border-t border-border pt-4 flex justify-center">
              <button
                onClick={() => setStep("done")}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip for now — I'll upload from my dashboard later
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md w-full"
        >
          <div className="w-24 h-24 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-primary" />
          </div>
          <h1 className="font-display text-4xl font-bold mb-3">You're all set!</h1>
          <p className="text-muted-foreground mb-8">
            Your order is pending review. An admin will verify your payment and activate your items within 24 hours.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/dashboard">
              <Button className="bg-primary text-primary-foreground gap-2">
                <Mail className="w-4 h-4" />
                View My Orders
              </Button>
            </Link>
            <Link href="/store">
              <Button variant="outline">Continue Shopping</Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4">
        <div className="text-center">
          <ShoppingCart className="w-20 h-20 text-muted-foreground/30 mx-auto mb-6" />
          <h1 className="font-display text-3xl font-bold mb-3">Your cart is empty</h1>
          <p className="text-muted-foreground mb-8">Add some items from the store to get started.</p>
          <Link href="/store">
            <Button className="bg-primary text-primary-foreground neon-glow-hover">Browse Store</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-display text-4xl font-bold mb-8">
        Your Cart <span className="text-muted-foreground text-2xl font-normal">({count} item{count !== 1 ? "s" : ""})</span>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence>
            {items.map(({ item, quantity }) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20, height: 0 }}
                className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4"
              >
                <div className="w-16 h-16 rounded-xl bg-background flex items-center justify-center border border-border flex-shrink-0">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="max-w-full max-h-full object-contain p-1" />
                  ) : (
                    <ShoppingCart className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>

                <div className="flex-grow min-w-0">
                  <h3 className="font-bold truncate">{item.name}</h3>
                  <p className="text-sm text-muted-foreground capitalize">{item.category.replace("_", " ")}</p>
                  {item.badge && <Badge variant="outline" className="text-primary border-primary/30 mt-1 text-xs">{item.badge}</Badge>}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => updateQuantity(item.id, quantity - 1)}
                    className="w-7 h-7 rounded-lg bg-background border border-border flex items-center justify-center hover:border-primary transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-8 text-center font-bold">{quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, quantity + 1)}
                    className="w-7 h-7 rounded-lg bg-background border border-border flex items-center justify-center hover:border-primary transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <div className="text-right flex-shrink-0 min-w-[80px]">
                  <div className="font-bold text-lg">${((item.price * quantity) / 100).toFixed(2)}</div>
                  {quantity > 1 && <div className="text-xs text-muted-foreground">${(item.price / 100).toFixed(2)} each</div>}
                </div>

                <button
                  onClick={() => removeItem(item.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors p-1 flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h2 className="font-bold text-xl">Order Summary</h2>

            <div className="space-y-2">
              {items.map(({ item, quantity }) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground truncate mr-2">{item.name} {quantity > 1 && `x${quantity}`}</span>
                  <span>${((item.price * quantity) / 100).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-3 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-primary">${(total / 100).toFixed(2)}</span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="coupon" className="text-sm flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" /> Coupon Code
              </Label>
              <Input
                id="coupon"
                value={couponCode}
                onChange={e => setCouponCode(e.target.value.toUpperCase())}
                placeholder="SAVE10"
                className="bg-background h-9 text-sm"
                disabled={step === "otp"}
              />
            </div>

            {step === "cart" && (
              <Button
                className="w-full bg-primary text-primary-foreground neon-glow-hover font-bold"
                onClick={handleSendOtp}
                disabled={sendingOtp || !user}
              >
                {sendingOtp ? "Sending Code..." : (
                  <span className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {user ? "Verify & Checkout" : "Login to Checkout"}
                  </span>
                )}
              </Button>
            )}

            {step === "otp" && (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/30 text-sm text-center">
                  <Mail className="w-4 h-4 text-primary mx-auto mb-1" />
                  <p className="text-primary font-medium">Code sent to your email</p>
                  <p className="text-muted-foreground text-xs mt-0.5">Check your inbox and enter the 6-digit code</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="otp">Verification Code</Label>
                  <Input
                    id="otp"
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="123456"
                    className="bg-background text-center text-xl tracking-widest font-bold h-12"
                    maxLength={6}
                  />
                </div>
                <Button
                  className="w-full bg-primary text-primary-foreground neon-glow-hover font-bold"
                  onClick={handleCheckout}
                  disabled={checkingOut || otpCode.length !== 6}
                >
                  {checkingOut ? "Placing Order..." : (
                    <span className="flex items-center gap-2">
                      <ArrowRight className="w-4 h-4" />
                      Place Order
                    </span>
                  )}
                </Button>
                <button
                  onClick={() => { setStep("cart"); setOtpCode(""); }}
                  className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Back to cart
                </button>
              </div>
            )}

            {!user && (
              <p className="text-xs text-center text-muted-foreground">
                <Link href="/login" className="text-primary hover:underline">Log in</Link> to checkout
              </p>
            )}
          </div>

          <Link href="/store">
            <Button variant="outline" className="w-full">Continue Shopping</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
