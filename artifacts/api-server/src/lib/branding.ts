import { ServerConfig } from "@workspace/db";

const DEFAULTS = {
  siteName: "WATERMC",
  serverIp: "play.watermc.fun",
  logoUrl: "",
};

let cache: { siteName: string; serverIp: string; logoUrl: string; fetchedAt: number } | null = null;
const TTL_MS = 60_000;

export async function getBranding() {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < TTL_MS) return cache;
  try {
    const config = await ServerConfig.findOne({ _id: "main" });
    cache = {
      siteName: config?.siteName?.trim() || DEFAULTS.siteName,
      serverIp: config?.serverIp?.trim() || DEFAULTS.serverIp,
      logoUrl: config?.logoUrl || DEFAULTS.logoUrl,
      fetchedAt: now,
    };
  } catch {
    cache = { ...DEFAULTS, fetchedAt: now };
  }
  return cache;
}

export function clearBrandingCache() {
  cache = null;
}
