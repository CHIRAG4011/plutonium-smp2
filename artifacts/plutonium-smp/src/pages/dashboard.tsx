import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useGetUserPurchases } from "@workspace/api-client-react";
import { Redirect, Link, useSearch, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  User, Calendar, Shield, ShoppingBag, Package, Clock,
  CheckCircle, XCircle, RotateCcw, Pencil, Check, X,
  ExternalLink, Upload, Camera, Loader2,
} from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; icon: JSX.Element; className: string }> = {
    completed: { label: "Completed", icon: <CheckCircle className="w-3 h-3" />, className: "border-green-500 text-green-500 bg-green-500/10" },
    pending:   { label: "Pending",   icon: <Clock className="w-3 h-3" />,        className: "border-yellow-500 text-yellow-500 bg-yellow-500/10" },
    failed:    { label: "Failed",    icon: <XCircle className="w-3 h-3" />,      className: "border-destructive text-destructive bg-destructive/10" },
    refunded:  { label: "Refunded",  icon: <RotateCcw className="w-3 h-3" />,    className: "border-blue-500 text-blue-500 bg-blue-500/10" },
  };
  const s = map[status] || { label: status, icon: <Clock className="w-3 h-3" />, className: "" };
  return (
    <Badge variant="outline" className={`flex items-center gap-1 ${s.className}`}>
      {s.icon}{s.label}
    </Badge>
  );
}

export default function Dashboard() {
  const { user, isLoading, login: setAuthToken, refetchUser } = useAuth();
  const { toast } = useToast();
  const search = useSearch();
  const [, setLocation] = useLocation();
  const { data: purchases, isLoading: purchasesLoading } = useGetUserPurchases({
    query: { enabled: !!user }
  });

  const [editingMc, setEditingMc] = useState(false);
  const [mcInput, setMcInput] = useState("");
  const [mcSaving, setMcSaving] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(search);
    const token = params.get("token");
    if (token) {
      setAuthToken(token);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const tokenInUrl = !!new URLSearchParams(search).get("token");

  if (isLoading || (tokenInUrl && !user)) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  if (!user) return <Redirect to="/login" />;

  function startEditMc() {
    setMcInput(user?.minecraftUsername || "");
    setEditingMc(true);
  }

  function cancelEditMc() {
    setEditingMc(false);
    setMcInput("");
  }

  async function saveMcUsername() {
    if (mcSaving) return;
    setMcSaving(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("plutonium_token") || ""}`,
        },
        body: JSON.stringify({ minecraftUsername: mcInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      await refetchUser();
      setEditingMc(false);
      toast({ title: "Minecraft username updated", description: mcInput.trim() || "Cleared successfully." });
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setMcSaving(false);
    }
  }

  async function handleAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image (PNG, JPG, WEBP, GIF).", variant: "destructive" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Image too large", description: "Maximum size is 2MB. Please compress the image first.", variant: "destructive" });
      return;
    }
    setAvatarUploading(true);
    try {
      const imageDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch("/api/users/me/profile-picture", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("plutonium_token") || ""}`,
        },
        body: JSON.stringify({ imageDataUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      await refetchUser();
      toast({ title: "Profile picture updated!", description: "Your new photo is now live." });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  }

  const pending = purchases?.filter(p => p.status === "pending") ?? [];
  const completed = purchases?.filter(p => p.status === "completed") ?? [];

  const isEmailUser = !user.discordAvatar;
  const avatarSrc = (user as any).avatarUrl || user.discordAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="font-display text-4xl font-bold mb-8">Your Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* Profile Card */}
        <Card className="col-span-1 border-border bg-card shadow-lg">
          <CardHeader className="text-center pb-2">
            <div className="relative w-24 h-24 mx-auto mb-4">
              <Avatar className="w-24 h-24 border-4 border-primary/20">
                <AvatarImage src={avatarSrc} />
                <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
              </Avatar>

              {/* Upload overlay — only for email (non-Discord) users */}
              {isEmailUser && (
                <>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={handleAvatarFile}
                    className="hidden"
                  />
                  <button
                    onClick={() => !avatarUploading && avatarInputRef.current?.click()}
                    disabled={avatarUploading}
                    className="absolute inset-0 rounded-full flex items-center justify-center bg-black/60 opacity-0 hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-default"
                    title="Change profile picture"
                  >
                    {avatarUploading ? (
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    ) : (
                      <Camera className="w-6 h-6 text-white" />
                    )}
                  </button>
                </>
              )}
            </div>

            <CardTitle className="text-2xl font-bold">{user.username}</CardTitle>

            {/* Change photo label for email users */}
            {isEmailUser && (
              <button
                onClick={() => !avatarUploading && avatarInputRef.current?.click()}
                disabled={avatarUploading}
                className="text-xs text-muted-foreground hover:text-primary transition-colors mt-1 flex items-center justify-center gap-1 mx-auto disabled:opacity-50"
              >
                {avatarUploading ? (
                  <><Loader2 className="w-3 h-3 animate-spin" /> Uploading...</>
                ) : (
                  <><Camera className="w-3 h-3" /> Change photo</>
                )}
              </button>
            )}

            <div className="flex justify-center gap-2 mt-2 flex-wrap">
              <Badge variant="outline" className="border-primary text-primary capitalize">{user.role}</Badge>
              {user.activeRank && <Badge variant="secondary">{user.activeRank}</Badge>}
              {user.discordUsername && (
                <Badge variant="outline" className="border-[#5865F2] text-[#5865F2] text-xs">
                  Discord: {user.discordUsername}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            {/* Minecraft Username */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Minecraft Username</Label>
              {editingMc ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={mcInput}
                    onChange={(e) => setMcInput(e.target.value)}
                    placeholder="YourMCName"
                    maxLength={16}
                    className="h-8 text-sm"
                    onKeyDown={(e) => { if (e.key === "Enter") saveMcUsername(); if (e.key === "Escape") cancelEditMc(); }}
                    autoFocus
                  />
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-primary shrink-0" onClick={saveMcUsername} disabled={mcSaving}>
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground shrink-0" onClick={cancelEditMc} disabled={mcSaving}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <User className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-sm truncate">
                      {user.minecraftUsername
                        ? <span className="font-medium text-foreground">{user.minecraftUsername}</span>
                        : <span className="text-muted-foreground italic">Not set</span>
                      }
                    </span>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary shrink-0"
                    onClick={startEditMc}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 text-sm text-muted-foreground px-1">
              <Calendar className="w-4 h-4 text-primary" />
              <span>Joined: {format(new Date(user.createdAt), 'MMM d, yyyy')}</span>
            </div>

            <div className="flex items-center gap-3 text-sm text-muted-foreground px-1">
              <Shield className="w-4 h-4 text-primary" />
              <span>Status: {user.isBanned ? <span className="text-destructive font-bold">Banned</span> : <span className="text-primary font-bold">Active</span>}</span>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-background border border-border rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-primary">{completed.length}</div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
              <div className="bg-background border border-border rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-yellow-500">{pending.length}</div>
                <div className="text-xs text-muted-foreground">Pending</div>
              </div>
            </div>

            <Link href="/store">
              <Button className="w-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-colors mt-2">
                Visit Store
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Order History */}
        <Card className="col-span-1 md:col-span-2 border-border bg-card shadow-lg flex flex-col">
          <CardHeader className="border-b border-border pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-xl">
                <ShoppingBag className="w-5 h-5 text-primary" />
                Order History
              </CardTitle>
              {pending.length > 0 && (
                <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
                  {pending.length} pending
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-grow">
            {purchasesLoading ? (
              <div className="p-8 text-center text-muted-foreground animate-pulse">Loading orders...</div>
            ) : purchases && purchases.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead>Item</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Date</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchases.map((p) => (
                      <TableRow key={p.id} className="border-border hover:bg-muted/20 cursor-pointer transition-colors" onClick={() => setLocation(`/orders/${p.id}`)}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{p.itemName}</span>
                            <span className="text-xs text-muted-foreground capitalize">{p.itemCategory.replace('_', ' ')}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-bold">${(p.pricePaid / 100).toFixed(2)}</div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={p.status} />
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground text-sm">
                          {format(new Date(p.createdAt), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          {p.status === "pending" && !(p as any).paymentProofUrl && (
                            <span className="text-xs text-yellow-500 font-medium flex items-center gap-1">
                              <Upload className="w-3 h-3" /> Upload proof
                            </span>
                          )}
                          {(p as any).paymentProofUrl && (
                            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="p-12 text-center flex flex-col items-center">
                <Package className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground mb-2">No orders yet.</p>
                <p className="text-sm text-muted-foreground/60 mb-6">Visit the store to get exclusive perks.</p>
                <Link href="/store">
                  <Button variant="outline" size="sm">Browse Store</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pending Orders Alert */}
      {pending.length > 0 && (
        <Card className="mt-6 border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="flex items-start gap-4 pt-6">
            <Clock className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-yellow-500">
                {pending.length} pending order{pending.length > 1 ? "s" : ""} awaiting payment verification
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Click any pending order in the table above to submit your payment screenshot. An admin will review and activate your purchase.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
