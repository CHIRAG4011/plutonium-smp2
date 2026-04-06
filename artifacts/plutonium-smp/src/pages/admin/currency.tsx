import { useState } from "react";
import { useAdminGetUsers } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Search, Coins, Plus, Minus, User, CheckCircle } from "lucide-react";

export default function AdminCurrency() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const { data } = useAdminGetUsers({ search, limit: 10 });
  const users = data?.users ?? [];

  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("plutonium_token") || ""}`,
  });

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) {
      toast({ title: "Select a user first", variant: "destructive" });
      return;
    }
    const parsed = Number(amount);
    if (isNaN(parsed) || parsed === 0) {
      toast({ title: "Enter a valid amount", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/currency/adjust", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ userId: selectedUser.id, amount: parsed, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast({ title: "Currency adjusted", description: data.message });
      setAmount("");
      setReason("");
    } catch (err: any) {
      toast({ title: "Adjustment failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Currency Adjustment</h1>
        <p className="text-muted-foreground mt-1">Give or take OWO coins from any player's balance.</p>
      </div>

      <Card className="bg-card border-border shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Select Player
          </CardTitle>
          <CardDescription>Search for a player to adjust their OWO balance.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {selectedUser ? (
            <div className="flex items-center gap-3 p-3 rounded-xl border border-primary/30 bg-primary/5">
              <Avatar className="w-10 h-10 border border-border">
                <AvatarImage src={selectedUser.discordAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedUser.username}`} />
                <AvatarFallback>{selectedUser.username[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">{selectedUser.username}</div>
                <div className="text-xs text-muted-foreground">{selectedUser.email}</div>
                <div className="text-xs text-primary font-medium mt-0.5">
                  Current balance: <span className="font-bold">{(selectedUser.owoBalance ?? 0).toLocaleString()} OWO</span>
                </div>
              </div>
              <Badge variant="outline" className="capitalize shrink-0">{selectedUser.role}</Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setSelectedUser(null); setShowSearch(false); }}
                className="shrink-0 text-muted-foreground hover:text-foreground"
              >
                Change
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  className="pl-9 bg-background"
                  placeholder="Search by username or email..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setShowSearch(true); }}
                  onFocus={() => setShowSearch(true)}
                />
              </div>
              {showSearch && search.trim().length >= 2 && (
                <div className="border border-border rounded-xl overflow-hidden bg-background shadow-lg">
                  {users.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">No users found</div>
                  ) : (
                    users.map((u: any) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          setSelectedUser(u);
                          setSearch("");
                          setShowSearch(false);
                        }}
                        className="w-full flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors text-left border-b border-border last:border-0"
                      >
                        <Avatar className="w-8 h-8 border border-border shrink-0">
                          <AvatarImage src={u.discordAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`} />
                          <AvatarFallback className="text-xs">{u.username[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{u.username}</div>
                          <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                        </div>
                        <div className="text-xs text-primary font-semibold shrink-0">
                          {(u.owoBalance ?? 0).toLocaleString()} OWO
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-primary" />
            Adjust Balance
          </CardTitle>
          <CardDescription>
            Use a positive number to give OWO coins, or a negative number to take them away.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdjust} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setAmount(a => String(-(Math.abs(Number(a) || 0))))}
                  title="Make negative (take)"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <Input
                  id="amount"
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 1000 to give, -500 to take"
                  className="bg-background flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setAmount(a => String(Math.abs(Number(a) || 0)))}
                  title="Make positive (give)"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {amount && !isNaN(Number(amount)) && Number(amount) !== 0 && (
                <p className={`text-xs font-medium ${Number(amount) > 0 ? "text-green-400" : "text-red-400"}`}>
                  {Number(amount) > 0
                    ? `Will give +${Number(amount).toLocaleString()} OWO`
                    : `Will take ${Math.abs(Number(amount)).toLocaleString()} OWO`}
                  {selectedUser && ` → new balance: ${Math.max(0, (selectedUser.owoBalance ?? 0) + Number(amount)).toLocaleString()} OWO`}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reason">Reason (optional)</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Vote reward, Bug compensation, Event prize..."
                className="bg-background resize-none"
                rows={2}
              />
            </div>

            <Button
              type="submit"
              disabled={loading || !selectedUser || !amount || isNaN(Number(amount)) || Number(amount) === 0}
              className="w-full gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              {loading ? "Adjusting..." : "Confirm Adjustment"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-md">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-muted-foreground">Quick Presets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {[500, 1000, 2500, 5000, 10000, -500, -1000].map((preset) => (
              <Button
                key={preset}
                variant="outline"
                size="sm"
                onClick={() => setAmount(String(preset))}
                className={`text-xs ${preset < 0 ? "border-red-500/30 text-red-400 hover:bg-red-500/10" : "border-primary/30 text-primary hover:bg-primary/10"}`}
              >
                {preset > 0 ? "+" : ""}{preset.toLocaleString()} OWO
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
