import { Router } from "express";
import { Leaderboard, Announcement, User, ServerConfig } from "@workspace/db";
import { status as mcStatus } from "minecraft-server-util";

const router = Router();

const DEFAULT_SERVER_IP = "play.plutoniumsmp.fun";
const DEFAULT_SERVER_PORT = 24005;

let cachedStatus: any = null;
let lastFetch = 0;
const CACHE_TTL = 30_000;

async function getServerConfig() {
  let config = await ServerConfig.findOne({ _id: "main" });
  if (!config) {
    config = await ServerConfig.create({
      _id: "main",
      serverIp: DEFAULT_SERVER_IP,
      serverPort: DEFAULT_SERVER_PORT,
      updatedAt: new Date(),
    });
  }
  return config;
}

router.get("/site-config", async (_req, res) => {
  try {
    const config = await getServerConfig();
    res.json({
      siteName: config.siteName || "PLUTONIUM SMP",
      logoUrl: config.logoUrl || "",
      serverIp: config.serverIp,
      heroTitle: config.heroTitle || "Die Once.",
      heroTitleHighlight: config.heroTitleHighlight || "Lose Everything.",
      heroSubtitle: config.heroSubtitle || "The most brutal Minecraft Lifesteal experience. Steal hearts, build your empire, and dominate the leaderboard.",
      voteTitle: config.voteTitle || "Vote & Earn",
      voteDescription: config.voteDescription || "Vote for us every 24 hours to earn free OWO coins. Every vote helps the server grow!",
      topVoterReward: config.topVoterReward || "Most votes this month wins an exclusive rank upgrade + 10,000 OWO Coins",
      voteSites: config.voteSites?.length ? config.voteSites : [
        { name: "TopG", url: "https://topg.org/minecraft-servers/server-680957", reward: "+500 OWO Coins" },
        { name: "Minecraft Server List", url: "https://minecraft-server-list.com/server/518991/", reward: "+500 OWO Coins" },
        { name: "Minecraft-MP", url: "https://minecraft-mp.com/server-s356241", reward: "+500 OWO Coins" },
        { name: "Minecraft.Buzz", url: "https://minecraft.buzz/server/20060", reward: "+500 OWO Coins" },
      ],
      featuresTitle: config.featuresTitle || "Why Plutonium?",
      featuresSubtitle: config.featuresSubtitle || "We've custom coded every aspect of the server to provide an unmatched, lag-free competitive experience.",
      features: config.features?.length ? config.features : [
        { title: "Lifesteal Core", desc: "Kill players to steal their hearts. Hit 0 hearts and you're banned until the next season." },
        { title: "OWO Economy", desc: "Farm, trade, and grind to earn OWO coins. Use them to buy exclusive gear and ranks." },
        { title: "Custom Enchants", desc: "Over 50+ unique balanced enchants to forge the ultimate god sets." },
        { title: "Active Community", desc: "Join hundreds of other players in massive clan wars and daily events." },
      ],
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/server/status", async (_req, res) => {
  const now = Date.now();
  if (cachedStatus && now - lastFetch < CACHE_TTL) {
    res.json(cachedStatus);
    return;
  }
  try {
    const config = await getServerConfig();

    if (config.serverStatusOverride === "online") {
      cachedStatus = {
        online: true,
        players: 0,
        maxPlayers: 100,
        version: "1.21.1",
        ip: config.serverIp,
        port: config.serverPort,
        uptime: "99.9%",
        tps: 20,
        motd: config.siteName || "Plutonium SMP",
      };
      lastFetch = now;
      res.json(cachedStatus);
      return;
    }

    if (config.serverStatusOverride === "offline") {
      cachedStatus = {
        online: false,
        players: 0,
        maxPlayers: 100,
        version: "1.21.1",
        ip: config.serverIp,
        port: config.serverPort,
        uptime: "99.9%",
        tps: 0,
        motd: "Server offline",
      };
      lastFetch = now;
      res.json(cachedStatus);
      return;
    }

    const result = await mcStatus(config.serverIp, config.serverPort, { timeout: 5000 });
    cachedStatus = {
      online: true,
      players: result.players.online,
      maxPlayers: result.players.max,
      version: result.version.name,
      ip: config.serverIp,
      port: config.serverPort,
      uptime: "99.9%",
      tps: 20,
      motd: result.motd?.clean ?? "Plutonium SMP",
    };
  } catch {
    try {
      const config = await getServerConfig();
      cachedStatus = {
        online: false,
        players: 0,
        maxPlayers: 100,
        version: "1.21.1",
        ip: config.serverIp,
        port: config.serverPort,
        uptime: "99.9%",
        tps: 0,
        motd: "Server offline",
      };
    } catch {
      cachedStatus = {
        online: false,
        players: 0,
        maxPlayers: 100,
        version: "1.21.1",
        ip: DEFAULT_SERVER_IP,
        port: DEFAULT_SERVER_PORT,
        uptime: "99.9%",
        tps: 0,
        motd: "Server offline",
      };
    }
  }
  lastFetch = now;
  res.json(cachedStatus);
});

const TIER_ORDER: Record<string, number> = {
  HT1: 1, HT2: 2, HT3: 3, HT4: 4, HT5: 5,
  LT1: 6, LT2: 7, LT3: 8, LT4: 9, LT5: 10,
};

router.get("/leaderboard", async (req, res) => {
  try {
    const entries = await Leaderboard.find().limit(100);
    const sorted = entries
      .map((e) => e.toJSON())
      .sort((a, b) => {
        const ta = TIER_ORDER[a.tier] ?? 99;
        const tb = TIER_ORDER[b.tier] ?? 99;
        if (ta !== tb) return ta - tb;
        return b.kills - a.kills;
      });
    const ranked = sorted.map((e, i) => ({
      rank: i + 1,
      userId: e.userId,
      username: e.username,
      minecraftUsername: e.minecraftUsername,
      tier: e.tier,
      kills: e.kills,
      activeRank: e.activeRank,
      avatarUrl: e.avatarUrl,
    }));
    res.json(ranked);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/players/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const allEntries = await Leaderboard.find().limit(200);
    const sorted = allEntries
      .map((e) => e.toJSON())
      .sort((a, b) => {
        const ta = TIER_ORDER[a.tier] ?? 99;
        const tb = TIER_ORDER[b.tier] ?? 99;
        if (ta !== tb) return ta - tb;
        return b.kills - a.kills;
      });
    const entryIdx = sorted.findIndex((e) => e.userId === userId);
    if (entryIdx === -1) {
      res.status(404).json({ error: "Player not found" });
      return;
    }
    const entry = sorted[entryIdx];
    const rank = entryIdx + 1;

    const user = await User.findOne({ _id: userId }).select(
      "username discordUsername discordAvatar avatarUrl minecraftUsername activeRank createdAt role"
    );

    res.json({
      userId: entry.userId,
      username: entry.username,
      minecraftUsername: entry.minecraftUsername || user?.minecraftUsername || null,
      avatarUrl: entry.avatarUrl || user?.discordAvatar || null,
      tier: entry.tier,
      kills: entry.kills,
      rank,
      totalPlayers: sorted.length,
      activeRank: entry.activeRank || user?.activeRank || null,
      discordUsername: user?.discordUsername || null,
      joinedAt: user?.createdAt || null,
      role: user?.role || null,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/announcements", async (req, res) => {
  try {
    const items = await Announcement.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(items.map((a) => a.toJSON()));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
