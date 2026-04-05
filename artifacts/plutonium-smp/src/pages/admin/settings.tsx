import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Server, Database, RefreshCw, Save } from "lucide-react";

export default function AdminSettings() {
  const { toast } = useToast();

  const [serverIp, setServerIp] = useState("play.plutoniumsmp.fun");
  const [serverPort, setServerPort] = useState("24005");
  const [configLoading, setConfigLoading] = useState(true);
  const [configSaving, setConfigSaving] = useState(false);

  const [seedLoading, setSeedLoading] = useState(false);
  const [seedResults, setSeedResults] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/admin/server-config", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.serverIp) setServerIp(data.serverIp);
        if (data.serverPort) setServerPort(String(data.serverPort));
      })
      .catch(() => {
        toast({ title: "Could not load server config", variant: "destructive" });
      })
      .finally(() => setConfigLoading(false));
  }, []);

  async function saveConfig() {
    const port = Number(serverPort);
    if (isNaN(port) || port <= 0 || port > 65535) {
      toast({ title: "Invalid port", description: "Port must be between 1 and 65535.", variant: "destructive" });
      return;
    }
    setConfigSaving(true);
    try {
      const res = await fetch("/api/admin/server-config", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serverIp, serverPort: port }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      toast({ title: "Server config saved", description: `Now querying ${data.serverIp}:${data.serverPort}` });
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setConfigSaving(false);
    }
  }

  async function runSeed() {
    setSeedLoading(true);
    setSeedResults([]);
    try {
      const res = await fetch("/api/admin/seed", {
        method: "POST",
        credentials: "include",
      });
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Configure server settings and database options.</p>
      </div>

      <Card className="bg-card border-border shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5 text-primary" />
            Minecraft Server Config
          </CardTitle>
          <CardDescription>
            Set the IP and port used to query your Minecraft server status. Default port is <strong>24005</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {configLoading ? (
            <p className="text-sm text-muted-foreground animate-pulse">Loading config...</p>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="server-ip">Server IP</Label>
                  <Input
                    id="server-ip"
                    value={serverIp}
                    onChange={(e) => setServerIp(e.target.value)}
                    placeholder="play.plutoniumsmp.fun"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="server-port">Server Port</Label>
                  <Input
                    id="server-port"
                    type="number"
                    value={serverPort}
                    onChange={(e) => setServerPort(e.target.value)}
                    placeholder="24005"
                    min={1}
                    max={65535}
                  />
                </div>
              </div>
              <Button onClick={saveConfig} disabled={configSaving} className="gap-2">
                <Save className="w-4 h-4" />
                {configSaving ? "Saving..." : "Save Config"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            Database Seed
          </CardTitle>
          <CardDescription>
            Populate the database with initial data (admin user, store items, leaderboard entries, and announcements).
            Already-existing records are skipped safely.
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
