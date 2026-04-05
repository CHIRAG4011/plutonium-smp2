import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Server, Database, RefreshCw, Save, Globe, Star, Zap, Plus, Trash2 } from "lucide-react";

interface VoteSite {
  name: string;
  url: string;
  reward: string;
}

interface Feature {
  title: string;
  desc: string;
}

interface SiteConfigForm {
  siteName: string;
  logoUrl: string;
  serverIp: string;
  serverPort: string;
  serverStatusOverride: "auto" | "online" | "offline";
  heroTitle: string;
  heroTitleHighlight: string;
  heroSubtitle: string;
  voteTitle: string;
  voteDescription: string;
  topVoterReward: string;
  voteSites: VoteSite[];
  featuresTitle: string;
  featuresSubtitle: string;
  features: Feature[];
}

const DEFAULT_FORM: SiteConfigForm = {
  siteName: "PLUTONIUM SMP",
  logoUrl: "",
  serverIp: "play.plutoniumsmp.fun",
  serverPort: "24005",
  serverStatusOverride: "auto",
  heroTitle: "Die Once.",
  heroTitleHighlight: "Lose Everything.",
  heroSubtitle: "The most brutal Minecraft Lifesteal experience. Steal hearts, build your empire, and dominate the leaderboard.",
  voteTitle: "Vote & Earn",
  voteDescription: "Vote for us every 24 hours to earn free OWO coins. Every vote helps the server grow!",
  topVoterReward: "Most votes this month wins an exclusive rank upgrade + 10,000 OWO Coins",
  voteSites: [
    { name: "TopG", url: "https://topg.org/minecraft-servers/server-680957", reward: "+500 OWO Coins" },
    { name: "Minecraft Server List", url: "https://minecraft-server-list.com/server/518991/", reward: "+500 OWO Coins" },
    { name: "Minecraft-MP", url: "https://minecraft-mp.com/server-s356241", reward: "+500 OWO Coins" },
    { name: "Minecraft.Buzz", url: "https://minecraft.buzz/server/20060", reward: "+500 OWO Coins" },
  ],
  featuresTitle: "Why Plutonium?",
  featuresSubtitle: "We've custom coded every aspect of the server to provide an unmatched, lag-free competitive experience.",
  features: [
    { title: "Lifesteal Core", desc: "Kill players to steal their hearts. Hit 0 hearts and you're banned until the next season." },
    { title: "OWO Economy", desc: "Farm, trade, and grind to earn OWO coins. Use them to buy exclusive gear and ranks." },
    { title: "Custom Enchants", desc: "Over 50+ unique balanced enchants to forge the ultimate god sets." },
    { title: "Active Community", desc: "Join hundreds of other players in massive clan wars and daily events." },
  ],
};

export default function AdminSettings() {
  const { toast } = useToast();
  const [form, setForm] = useState<SiteConfigForm>(DEFAULT_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seedLoading, setSeedLoading] = useState(false);
  const [seedResults, setSeedResults] = useState<string[]>([]);

  const getAuthHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("plutonium_token") || ""}`,
  });

  useEffect(() => {
    fetch("/api/admin/site-config", { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((data) => {
        setForm({
          siteName: data.siteName || DEFAULT_FORM.siteName,
          logoUrl: data.logoUrl || "",
          serverIp: data.serverIp || DEFAULT_FORM.serverIp,
          serverPort: String(data.serverPort || DEFAULT_FORM.serverPort),
          serverStatusOverride: data.serverStatusOverride || "auto",
          heroTitle: data.heroTitle || DEFAULT_FORM.heroTitle,
          heroTitleHighlight: data.heroTitleHighlight || DEFAULT_FORM.heroTitleHighlight,
          heroSubtitle: data.heroSubtitle || DEFAULT_FORM.heroSubtitle,
          voteTitle: data.voteTitle || DEFAULT_FORM.voteTitle,
          voteDescription: data.voteDescription || DEFAULT_FORM.voteDescription,
          topVoterReward: data.topVoterReward || DEFAULT_FORM.topVoterReward,
          voteSites: data.voteSites?.length ? data.voteSites : DEFAULT_FORM.voteSites,
          featuresTitle: data.featuresTitle || DEFAULT_FORM.featuresTitle,
          featuresSubtitle: data.featuresSubtitle || DEFAULT_FORM.featuresSubtitle,
          features: data.features?.length ? data.features : DEFAULT_FORM.features,
        });
      })
      .catch(() => toast({ title: "Could not load config", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, []);

  function set<K extends keyof SiteConfigForm>(key: K, value: SiteConfigForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function updateVoteSite(i: number, field: keyof VoteSite, value: string) {
    const updated = form.voteSites.map((s, idx) => idx === i ? { ...s, [field]: value } : s);
    set("voteSites", updated);
  }

  function addVoteSite() {
    set("voteSites", [...form.voteSites, { name: "", url: "", reward: "+500 OWO Coins" }]);
  }

  function removeVoteSite(i: number) {
    set("voteSites", form.voteSites.filter((_, idx) => idx !== i));
  }

  function updateFeature(i: number, field: keyof Feature, value: string) {
    const updated = form.features.map((f, idx) => idx === i ? { ...f, [field]: value } : f);
    set("features", updated);
  }

  function addFeature() {
    set("features", [...form.features, { title: "", desc: "" }]);
  }

  function removeFeature(i: number) {
    set("features", form.features.filter((_, idx) => idx !== i));
  }

  async function saveConfig() {
    const port = Number(form.serverPort);
    if (isNaN(port) || port <= 0 || port > 65535) {
      toast({ title: "Invalid port", description: "Port must be between 1 and 65535.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/site-config", {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...form, serverPort: port }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      toast({ title: "Settings saved", description: "Changes are live on your site." });
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function runSeed() {
    setSeedLoading(true);
    setSeedResults([]);
    try {
      const res = await fetch("/api/admin/seed", { method: "POST", headers: getAuthHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Seed failed");
      setSeedResults(data.results || [data.message]);
      toast({ title: "Seed complete", description: data.message });
    } catch (err: any) {
      toast({ title: "Seed failed", description: err.message, variant: "destructive" });
    } finally {
      setSeedLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Settings</h1>
          <p className="text-muted-foreground">Loading configuration...</p>
        </div>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-48 rounded-xl bg-card border border-border" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Customize your site appearance, content, and server configuration.</p>
        </div>
        <Button onClick={saveConfig} disabled={saving} className="gap-2 shrink-0">
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save All Changes"}
        </Button>
      </div>

      {/* Branding */}
      <Card className="bg-card border-border shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Site Branding
          </CardTitle>
          <CardDescription>Control the site name and logo shown in the navbar.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="site-name">Site Name</Label>
              <Input
                id="site-name"
                value={form.siteName}
                onChange={(e) => set("siteName", e.target.value)}
                placeholder="PLUTONIUM SMP"
              />
              <p className="text-xs text-muted-foreground">The last word will be highlighted in the primary color.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="logo-url">Logo URL</Label>
              <Input
                id="logo-url"
                value={form.logoUrl}
                onChange={(e) => set("logoUrl", e.target.value)}
                placeholder="https://... (leave blank for default)"
              />
            </div>
          </div>
          {form.logoUrl && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border">
              <img src={form.logoUrl} alt="Logo preview" className="w-12 h-12 rounded-xl object-contain border border-border bg-background" onError={(e) => { (e.target as HTMLImageElement).src = ""; }} />
              <span className="text-xs text-muted-foreground">Logo preview</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hero Section */}
      <Card className="bg-card border-border shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Hero Section
          </CardTitle>
          <CardDescription>The large banner shown at the top of the home page.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="hero-title">Title</Label>
              <Input
                id="hero-title"
                value={form.heroTitle}
                onChange={(e) => set("heroTitle", e.target.value)}
                placeholder="Die Once."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hero-highlight">Title Highlight (shown in green)</Label>
              <Input
                id="hero-highlight"
                value={form.heroTitleHighlight}
                onChange={(e) => set("heroTitleHighlight", e.target.value)}
                placeholder="Lose Everything."
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hero-subtitle">Subtitle / Description</Label>
            <Textarea
              id="hero-subtitle"
              value={form.heroSubtitle}
              onChange={(e) => set("heroSubtitle", e.target.value)}
              rows={3}
              placeholder="The most brutal Minecraft Lifesteal experience..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Server Config */}
      <Card className="bg-card border-border shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5 text-primary" />
            Minecraft Server
          </CardTitle>
          <CardDescription>Configure the server IP, port, and online status display.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="server-ip">Server IP</Label>
              <Input
                id="server-ip"
                value={form.serverIp}
                onChange={(e) => set("serverIp", e.target.value)}
                placeholder="play.plutoniumsmp.fun"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="server-port">Port</Label>
              <Input
                id="server-port"
                type="number"
                value={form.serverPort}
                onChange={(e) => set("serverPort", e.target.value)}
                placeholder="24005"
                min={1}
                max={65535}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Status Display</Label>
            <Select
              value={form.serverStatusOverride}
              onValueChange={(v) => set("serverStatusOverride", v as "auto" | "online" | "offline")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto (ping the server)</SelectItem>
                <SelectItem value="online">Force Online (green dot)</SelectItem>
                <SelectItem value="offline">Force Offline (red dot)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              "Auto" pings your Minecraft server in real-time. Use "Force Online" to show a green dot even if the server is temporarily unreachable.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Features Grid */}
      <Card className="bg-card border-border shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Features Section
          </CardTitle>
          <CardDescription>The feature cards shown on the home page.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Section Title</Label>
              <Input
                value={form.featuresTitle}
                onChange={(e) => set("featuresTitle", e.target.value)}
                placeholder="Why Plutonium?"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Section Subtitle</Label>
              <Input
                value={form.featuresSubtitle}
                onChange={(e) => set("featuresSubtitle", e.target.value)}
                placeholder="We've custom coded every aspect..."
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Feature Cards</Label>
            {form.features.map((feat, i) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_2fr_auto] gap-2 p-3 rounded-lg border border-border bg-muted/20">
                <Input
                  value={feat.title}
                  onChange={(e) => updateFeature(i, "title", e.target.value)}
                  placeholder="Feature title"
                />
                <Input
                  value={feat.desc}
                  onChange={(e) => updateFeature(i, "desc", e.target.value)}
                  placeholder="Feature description"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFeature(i)}
                  className="text-destructive hover:bg-destructive/10 shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addFeature} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Feature
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Vote Section */}
      <Card className="bg-card border-border shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-primary" />
            Vote Section
          </CardTitle>
          <CardDescription>Configure voting links and reward descriptions shown on the home page.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Section Title</Label>
              <Input
                value={form.voteTitle}
                onChange={(e) => set("voteTitle", e.target.value)}
                placeholder="Vote & Earn"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Top Voter Reward Text</Label>
              <Input
                value={form.topVoterReward}
                onChange={(e) => set("topVoterReward", e.target.value)}
                placeholder="Most votes this month wins..."
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Section Description</Label>
            <Textarea
              value={form.voteDescription}
              onChange={(e) => set("voteDescription", e.target.value)}
              rows={2}
              placeholder="Vote for us every 24 hours to earn free OWO coins..."
            />
          </div>

          <div className="space-y-3">
            <Label>Vote Sites</Label>
            {form.voteSites.map((site, i) => (
              <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_2fr_1fr_auto] gap-2 p-3 rounded-lg border border-border bg-muted/20">
                <Input
                  value={site.name}
                  onChange={(e) => updateVoteSite(i, "name", e.target.value)}
                  placeholder="Site name"
                />
                <Input
                  value={site.url}
                  onChange={(e) => updateVoteSite(i, "url", e.target.value)}
                  placeholder="https://..."
                />
                <Input
                  value={site.reward}
                  onChange={(e) => updateVoteSite(i, "reward", e.target.value)}
                  placeholder="+500 OWO Coins"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeVoteSite(i)}
                  className="text-destructive hover:bg-destructive/10 shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addVoteSite} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Vote Site
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button (bottom) */}
      <Button onClick={saveConfig} disabled={saving} size="lg" className="w-full gap-2">
        <Save className="w-4 h-4" />
        {saving ? "Saving..." : "Save All Changes"}
      </Button>

      {/* Database Seed */}
      <Card className="bg-card border-border shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            Database Seed
          </CardTitle>
          <CardDescription>
            Populate the database with initial data. Already-existing records are skipped safely.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={runSeed} disabled={seedLoading} variant="outline" className="gap-2">
            <RefreshCw className={`w-4 h-4 ${seedLoading ? "animate-spin" : ""}`} />
            {seedLoading ? "Seeding..." : "Run Database Seed"}
          </Button>
          {seedResults.length > 0 && (
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground border border-border rounded-lg p-3 bg-muted/30">
              {seedResults.map((r, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  {r}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
