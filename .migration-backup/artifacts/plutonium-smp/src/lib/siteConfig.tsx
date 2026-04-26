import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export interface VoteSite {
  name: string;
  url: string;
  reward: string;
}

export interface Feature {
  title: string;
  desc: string;
}

export interface SiteConfig {
  siteName: string;
  logoUrl: string;
  serverIp: string;
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

const DEFAULT_CONFIG: SiteConfig = {
  siteName: "PLUTONIUM SMP",
  logoUrl: "",
  serverIp: "play.plutoniumsmp.fun",
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

const SiteConfigContext = createContext<SiteConfig>(DEFAULT_CONFIG);

export function SiteConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    fetch("/api/site-config")
      .then((r) => r.json())
      .then((data) => setConfig((prev) => ({ ...prev, ...data })))
      .catch(() => {});
  }, []);

  return (
    <SiteConfigContext.Provider value={config}>
      {children}
    </SiteConfigContext.Provider>
  );
}

export function useSiteConfig() {
  return useContext(SiteConfigContext);
}
