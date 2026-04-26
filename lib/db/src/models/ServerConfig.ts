import mongoose, { Schema, Document } from "mongoose";

export interface IVoteSite {
  name: string;
  url: string;
  reward: string;
}

export interface IFeature {
  title: string;
  desc: string;
}

export interface IServerConfig extends Document {
  _id: string;
  serverIp: string;
  serverPort: number;
  serverStatusOverride: "auto" | "online" | "offline";
  siteName: string;
  logoUrl: string;
  heroTitle: string;
  heroTitleHighlight: string;
  heroSubtitle: string;
  voteTitle: string;
  voteDescription: string;
  topVoterReward: string;
  voteSites: IVoteSite[];
  featuresTitle: string;
  featuresSubtitle: string;
  features: IFeature[];
  updatedAt: Date;
}

const VoteSiteSchema = new Schema<IVoteSite>(
  { name: String, url: String, reward: String },
  { _id: false }
);

const FeatureSchema = new Schema<IFeature>(
  { title: String, desc: String },
  { _id: false }
);

const ServerConfigSchema = new Schema<IServerConfig>({
  _id: { type: String, required: true },
  serverIp: { type: String, default: "play.watermc.fun" },
  serverPort: { type: Number, default: 24005 },
  serverStatusOverride: { type: String, enum: ["auto", "online", "offline"], default: "auto" },
  siteName: { type: String, default: "WATERMC" },
  logoUrl: { type: String, default: "" },
  heroTitle: { type: String, default: "Die Once." },
  heroTitleHighlight: { type: String, default: "Lose Everything." },
  heroSubtitle: { type: String, default: "The most brutal Minecraft Lifesteal experience. Steal hearts, build your empire, and dominate the leaderboard." },
  voteTitle: { type: String, default: "Vote & Earn" },
  voteDescription: { type: String, default: "Vote for us every 24 hours to earn free OWO coins. Every vote helps the server grow!" },
  topVoterReward: { type: String, default: "Most votes this month wins an exclusive rank upgrade + 10,000 OWO Coins" },
  voteSites: {
    type: [VoteSiteSchema],
    default: [
      { name: "TopG", url: "https://topg.org/minecraft-servers/server-680957", reward: "+500 OWO Coins" },
      { name: "Minecraft Server List", url: "https://minecraft-server-list.com/server/518991/", reward: "+500 OWO Coins" },
      { name: "Minecraft-MP", url: "https://minecraft-mp.com/server-s356241", reward: "+500 OWO Coins" },
      { name: "Minecraft.Buzz", url: "https://minecraft.buzz/server/20060", reward: "+500 OWO Coins" },
    ],
  },
  featuresTitle: { type: String, default: "Why WaterMC?" },
  featuresSubtitle: { type: String, default: "We've custom coded every aspect of the server to provide an unmatched, lag-free competitive experience." },
  features: {
    type: [FeatureSchema],
    default: [
      { title: "Lifesteal Core", desc: "Kill players to steal their hearts. Hit 0 hearts and you're banned until the next season." },
      { title: "OWO Economy", desc: "Farm, trade, and grind to earn OWO coins. Use them to buy exclusive gear and ranks." },
      { title: "Custom Enchants", desc: "Over 50+ unique balanced enchants to forge the ultimate god sets." },
      { title: "Active Community", desc: "Join hundreds of other players in massive clan wars and daily events." },
    ],
  },
  updatedAt: { type: Date, default: Date.now },
});

export const ServerConfig = mongoose.model<IServerConfig>("ServerConfig", ServerConfigSchema);
