import { Router } from "express";
import {
  User, StoreItem, Purchase, Ticket,
  Announcement, Coupon, Leaderboard, ServerConfig, CustomRole,
} from "@workspace/db";
import { requireAdmin, requireModerator, AuthRequest } from "../lib/auth.js";
import { generateId } from "../lib/id.js";
import bcrypt from "bcryptjs";

const router = Router();
router.use(requireModerator);

const TIER_ORDER: Record<string, number> = {
  HT1: 1, HT2: 2, HT3: 3, HT4: 4, HT5: 5,
  LT1: 6, LT2: 7, LT3: 8, LT4: 9, LT5: 10,
};

router.get("/stats", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalPurchases,
      openTickets,
      bannedUsers,
      newUsersToday,
      activeRanks,
      revenueResult,
      revenueTodayResult,
    ] = await Promise.all([
      User.countDocuments(),
      Purchase.countDocuments(),
      Ticket.countDocuments({ status: "open" }),
      User.countDocuments({ isBanned: true }),
      User.countDocuments({ createdAt: { $gte: today } }),
      User.countDocuments({ activeRank: { $ne: null } }),
      Purchase.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: null, total: { $sum: "$pricePaid" } } },
      ]),
      Purchase.aggregate([
        { $match: { createdAt: { $gte: today } } },
        { $group: { _id: null, total: { $sum: "$pricePaid" } } },
      ]),
    ]);

    res.json({
      totalUsers,
      totalRevenue: revenueResult[0]?.total || 0,
      totalPurchases,
      openTickets,
      activeRanks,
      bannedUsers,
      newUsersToday,
      revenueToday: revenueTodayResult[0]?.total || 0,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/users", async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const search = req.query.search as string | undefined;
    const skip = (page - 1) * limit;

    const query: any = search
      ? { $or: [
          { username: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ] }
      : {};

    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(query),
    ]);

    const safeUsers = users.map((u) => {
      const obj = u.toJSON() as any;
      delete obj.passwordHash;
      return obj;
    });
    res.json({ users: safeUsers, total, page, limit });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/users/:id/ban", requireAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    await User.updateOne(
      { _id: req.params.id },
      { isBanned: true, banReason: reason || "No reason provided" }
    );
    res.json({ message: "User banned" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/users/:id/unban", requireAdmin, async (req, res) => {
  try {
    await User.updateOne({ _id: req.params.id }, { isBanned: false, banReason: null });
    res.json({ message: "User unbanned" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/users/:id/role", requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { role } = req.body;
    const validRoles = ["user", "moderator", "admin"];
    if (!validRoles.includes(role)) {
      res.status(400).json({ error: "Invalid role. Must be: user, moderator, or admin" });
      return;
    }
    const target = await User.findOne({ _id: req.params.id });
    if (!target) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    if (target.role === "owner") {
      res.status(403).json({ error: "Cannot change role of owner account" });
      return;
    }
    if (req.user?.role !== "owner" && role === "admin") {
      res.status(403).json({ error: "Only owners can promote users to admin" });
      return;
    }
    await User.updateOne({ _id: req.params.id }, { role, updatedAt: new Date() });
    res.json({ message: `User role updated to ${role}` });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/users/:userId/rank", requireAdmin, async (req, res) => {
  try {
    const { activeRank, minecraftUsername, customRole } = req.body;
    const user = await User.findOne({ _id: req.params.userId });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const userUpdates: any = { updatedAt: new Date() };
    if (activeRank !== undefined) userUpdates.activeRank = activeRank || null;
    if (minecraftUsername !== undefined) userUpdates.minecraftUsername = minecraftUsername || null;
    if (customRole !== undefined) userUpdates.customRole = customRole || null;
    await User.updateOne({ _id: req.params.userId }, userUpdates);
    await Leaderboard.updateOne(
      { userId: req.params.userId },
      { ...( activeRank !== undefined ? { activeRank: activeRank || null } : {} ),
        ...( minecraftUsername !== undefined ? { minecraftUsername: minecraftUsername || null } : {} ),
        updatedAt: new Date() }
    ).catch(() => {});
    res.json({ message: "Rank updated" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/store/items", requireAdmin, async (req, res) => {
  try {
    const { name, description, category, price, currency, imageUrl, images, features, isActive, isFeatured, badge, badgeColor, sortOrder } = req.body;
    const item = await StoreItem.create({
      _id: generateId(),
      name, description, category,
      price: Number(price),
      currency: currency || "usd",
      imageUrl: imageUrl || null,
      images: images || [],
      features: features || [],
      isActive: isActive !== false,
      isFeatured: isFeatured || false,
      badge: badge || null,
      badgeColor: badgeColor || null,
      sortOrder: Number(sortOrder) || 0,
    });
    res.json(item.toJSON());
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/store/items/:id", requireAdmin, async (req, res) => {
  try {
    const { name, description, category, price, currency, imageUrl, images, features, isActive, isFeatured, badge, badgeColor, sortOrder } = req.body;
    const item = await StoreItem.findOneAndUpdate(
      { _id: req.params.id },
      {
        name, description, category,
        price: Number(price),
        currency: currency || "usd",
        imageUrl: imageUrl || null,
        images: images || [],
        features: features || [],
        isActive: isActive !== false,
        isFeatured: isFeatured || false,
        badge: badge || null,
        badgeColor: badgeColor || null,
        sortOrder: Number(sortOrder) || 0,
        updatedAt: new Date(),
      },
      { new: true }
    );
    res.json(item?.toJSON());
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/store/items/:id", requireAdmin, async (req, res) => {
  try {
    await StoreItem.deleteOne({ _id: req.params.id });
    res.json({ message: "Item deleted" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/tickets", async (req, res) => {
  try {
    const tickets = await Ticket.find().sort({ updatedAt: -1 });
    res.json(tickets.map((t) => t.toJSON()));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/purchases", async (req, res) => {
  try {
    const purchases = await Purchase.find().sort({ createdAt: -1 });
    res.json(purchases.map((p) => p.toJSON()));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/purchases/:id", async (req, res) => {
  try {
    const purchase = await Purchase.findOne({ _id: req.params.id });
    if (!purchase) { res.status(404).json({ error: "Not found" }); return; }
    const user = await User.findOne({ _id: purchase.userId });
    res.json({ ...purchase.toJSON(), user: user ? { id: user.id, username: user.username, email: user.email, discordAvatar: user.discordAvatar } : null });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/purchases/:id/status", requireAdmin, async (req, res) => {
  try {
    const { status, notes } = req.body;
    const validStatuses = ["pending", "completed", "failed", "refunded"];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: "Invalid status" });
      return;
    }
    const updated = await Purchase.findOneAndUpdate(
      { _id: req.params.id },
      { status, notes: notes || null },
      { new: true }
    );
    if (!updated) { res.status(404).json({ error: "Not found" }); return; }
    res.json(updated.toJSON());
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/announcements", async (req, res) => {
  try {
    const items = await Announcement.find().sort({ pinned: -1, createdAt: -1 });
    res.json(items.map((a) => a.toJSON()));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/announcements", async (req: AuthRequest, res) => {
  try {
    const { title, content, type, imageUrl, bannerColor, pinned, scheduledAt, callToActionUrl, callToActionText, expiresAt } = req.body;
    const item = await Announcement.create({
      _id: generateId(),
      title, content,
      type: type || "info",
      isActive: true,
      pinned: pinned || false,
      imageUrl: imageUrl || null,
      bannerColor: bannerColor || null,
      callToActionUrl: callToActionUrl || null,
      callToActionText: callToActionText || null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      authorId: req.user?.id || null,
      authorName: req.user?.username || null,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
    });
    res.json(item.toJSON());
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/announcements/:id", async (req: AuthRequest, res) => {
  try {
    const { title, content, type, imageUrl, bannerColor, pinned, scheduledAt, callToActionUrl, callToActionText, expiresAt } = req.body;
    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (type !== undefined) updates.type = type;
    if (imageUrl !== undefined) updates.imageUrl = imageUrl || null;
    if (bannerColor !== undefined) updates.bannerColor = bannerColor || null;
    if (pinned !== undefined) updates.pinned = pinned;
    if (scheduledAt !== undefined) updates.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
    if (callToActionUrl !== undefined) updates.callToActionUrl = callToActionUrl || null;
    if (callToActionText !== undefined) updates.callToActionText = callToActionText || null;
    if (expiresAt !== undefined) updates.expiresAt = expiresAt ? new Date(expiresAt) : null;
    const updated = await Announcement.findOneAndUpdate(
      { _id: req.params.id },
      updates,
      { new: true }
    );
    if (!updated) { res.status(404).json({ error: "Not found" }); return; }
    res.json(updated.toJSON());
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/announcements/:id", requireAdmin, async (req, res) => {
  try {
    await Announcement.deleteOne({ _id: req.params.id });
    res.json({ message: "Announcement deleted" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/announcements/:id/toggle", async (req, res) => {
  try {
    const item = await Announcement.findOne({ _id: req.params.id });
    if (!item) { res.status(404).json({ error: "Not found" }); return; }
    const updated = await Announcement.findOneAndUpdate(
      { _id: req.params.id },
      { isActive: !item.isActive },
      { new: true }
    );
    res.json(updated?.toJSON());
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/announcements/:id/pin", async (req, res) => {
  try {
    const item = await Announcement.findOne({ _id: req.params.id });
    if (!item) { res.status(404).json({ error: "Not found" }); return; }
    const updated = await Announcement.findOneAndUpdate(
      { _id: req.params.id },
      { pinned: !item.pinned },
      { new: true }
    );
    res.json(updated?.toJSON());
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/coupons", async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons.map((c) => c.toJSON()));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/coupons", async (req, res) => {
  try {
    const { code, discountType, discountPercent, discountFixed, usageLimit, expiresAt, minCartValue, description } = req.body;
    const coupon = await Coupon.create({
      _id: generateId(),
      code: code.trim().toUpperCase(),
      discountType: discountType || "percent",
      discountPercent: Number(discountPercent) || 0,
      discountFixed: discountFixed ? Number(discountFixed) : null,
      usageLimit: usageLimit ? Number(usageLimit) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      minCartValue: minCartValue ? Number(minCartValue) : null,
      description: description || null,
      isActive: true,
    });
    res.json(coupon.toJSON());
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/coupons/:id/toggle", async (req, res) => {
  try {
    const coupon = await Coupon.findOne({ _id: req.params.id });
    if (!coupon) { res.status(404).json({ error: "Not found" }); return; }
    const updated = await Coupon.findOneAndUpdate(
      { _id: req.params.id },
      { isActive: !coupon.isActive },
      { new: true }
    );
    res.json(updated?.toJSON());
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/coupons/:id", requireAdmin, async (req, res) => {
  try {
    await Coupon.deleteOne({ _id: req.params.id });
    res.json({ message: "Coupon deleted" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/currency/adjust", requireAdmin, async (req, res) => {
  try {
    const { userId, amount, reason } = req.body;
    const user = await User.findOne({ _id: userId });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const newBalance = Math.max(0, user.owoBalance + Number(amount));
    await User.updateOne({ _id: userId }, { owoBalance: newBalance });
    res.json({ message: `Currency adjusted. New balance: ${newBalance} OWO. Reason: ${reason || "N/A"}` });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/server-config", async (req, res) => {
  try {
    let config = await ServerConfig.findOne({ _id: "main" });
    if (!config) {
      config = await ServerConfig.create({
        _id: "main",
        serverIp: "play.plutoniumsmp.fun",
        serverPort: 24005,
        updatedAt: new Date(),
      });
    }
    res.json({ serverIp: config.serverIp, serverPort: config.serverPort });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/server-config", async (req, res) => {
  try {
    const { serverIp, serverPort } = req.body;
    const port = Number(serverPort);
    if (isNaN(port) || port <= 0 || port > 65535) {
      res.status(400).json({ error: "Invalid port number. Must be between 1 and 65535." });
      return;
    }
    const config = await ServerConfig.findOneAndUpdate(
      { _id: "main" },
      { serverIp: serverIp || "play.plutoniumsmp.fun", serverPort: port, updatedAt: new Date() },
      { new: true, upsert: true }
    );
    res.json({ serverIp: config.serverIp, serverPort: config.serverPort, message: "Server config updated" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/site-config", async (req, res) => {
  try {
    let config = await ServerConfig.findOne({ _id: "main" });
    if (!config) {
      config = await ServerConfig.create({ _id: "main", serverIp: "play.plutoniumsmp.fun", serverPort: 24005, updatedAt: new Date() });
    }
    res.json({
      siteName: config.siteName,
      logoUrl: config.logoUrl,
      serverIp: config.serverIp,
      serverPort: config.serverPort,
      serverStatusOverride: config.serverStatusOverride,
      heroTitle: config.heroTitle,
      heroTitleHighlight: config.heroTitleHighlight,
      heroSubtitle: config.heroSubtitle,
      voteTitle: config.voteTitle,
      voteDescription: config.voteDescription,
      topVoterReward: config.topVoterReward,
      voteSites: config.voteSites,
      featuresTitle: config.featuresTitle,
      featuresSubtitle: config.featuresSubtitle,
      features: config.features,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/site-config", async (req, res) => {
  try {
    const {
      siteName, logoUrl, serverIp, serverPort, serverStatusOverride,
      heroTitle, heroTitleHighlight, heroSubtitle,
      voteTitle, voteDescription, topVoterReward, voteSites,
      featuresTitle, featuresSubtitle, features,
    } = req.body;

    const update: Record<string, any> = { updatedAt: new Date() };
    if (siteName !== undefined) update.siteName = siteName;
    if (logoUrl !== undefined) update.logoUrl = logoUrl;
    if (serverIp !== undefined) update.serverIp = serverIp;
    if (serverPort !== undefined) {
      const port = Number(serverPort);
      if (isNaN(port) || port <= 0 || port > 65535) {
        res.status(400).json({ error: "Invalid port number" });
        return;
      }
      update.serverPort = port;
    }
    if (serverStatusOverride !== undefined) update.serverStatusOverride = serverStatusOverride;
    if (heroTitle !== undefined) update.heroTitle = heroTitle;
    if (heroTitleHighlight !== undefined) update.heroTitleHighlight = heroTitleHighlight;
    if (heroSubtitle !== undefined) update.heroSubtitle = heroSubtitle;
    if (voteTitle !== undefined) update.voteTitle = voteTitle;
    if (voteDescription !== undefined) update.voteDescription = voteDescription;
    if (topVoterReward !== undefined) update.topVoterReward = topVoterReward;
    if (voteSites !== undefined) update.voteSites = voteSites;
    if (featuresTitle !== undefined) update.featuresTitle = featuresTitle;
    if (featuresSubtitle !== undefined) update.featuresSubtitle = featuresSubtitle;
    if (features !== undefined) update.features = features;

    const config = await ServerConfig.findOneAndUpdate(
      { _id: "main" },
      update,
      { new: true, upsert: true }
    );

    res.json({ message: "Site config updated", config });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/seed", async (req, res) => {
  try {
    const results: string[] = [];

    const adminId = "admin-plutonium-001";
    const existingAdmin = await User.findOne({ _id: adminId });
    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash("admin123", 10);
      await User.findOneAndUpdate(
        { _id: adminId },
        {
          $setOnInsert: {
            _id: adminId,
            username: "PlutoniumAdmin",
            email: "admin@plutoniumsmp.net",
            passwordHash,
            role: "owner",
            owoBalance: 999999,
            minecraftUsername: "PlutoniumAdmin",
            activeRank: "Owner",
          },
        },
        { upsert: true }
      );
      results.push("Created admin user: admin@plutoniumsmp.net / admin123");
    } else {
      results.push("Admin user already exists — skipped");
    }

    const existingItems = await StoreItem.findOne();
    if (!existingItems) {
      await StoreItem.insertMany([
        { _id: "rank-vip", name: "VIP", description: "Get VIP access with exclusive perks and commands!", category: "ranks", price: 5000, currency: "owo", features: ["Custom Tag", "2x OWO Rewards", "VIP Kit", "/fly in spawn", "Priority Queue"], isActive: true, isFeatured: false, badge: "VIP", badgeColor: "#4ADE80" },
        { _id: "rank-mvp", name: "MVP", description: "Become an MVP with premium features and special abilities!", category: "ranks", price: 12000, currency: "owo", features: ["All VIP Perks", "Custom Particle Effects", "3x OWO Rewards", "MVP Kit", "/nick command", "Exclusive Discord Role"], isActive: true, isFeatured: true, badge: "POPULAR", badgeColor: "#60A5FA" },
        { _id: "rank-legend", name: "Legend", description: "The ultimate rank. Stand above the rest as a Legend!", category: "ranks", price: 25000, currency: "owo", features: ["All MVP Perks", "5x OWO Rewards", "Legend Kit", "Custom Join Message", "God Mode PvP Potions", "Exclusive Legend Discord Channel"], isActive: true, isFeatured: true, badge: "BEST VALUE", badgeColor: "#FF6B6B" },
        { _id: "crate-common", name: "Common Crate Key", description: "A common crate key with a chance to get decent loot!", category: "crate_keys", price: 500, currency: "owo", features: ["Random Gear", "OWO Coins", "XP Bottles"], isActive: true, isFeatured: false },
        { _id: "crate-rare", name: "Rare Crate Key", description: "A rare crate key with excellent loot chances!", category: "crate_keys", price: 1500, currency: "owo", features: ["Enhanced Gear", "Lots of OWO Coins", "Special Potions", "Rare Items"], isActive: true, isFeatured: false, badge: "POPULAR", badgeColor: "#60A5FA" },
        { _id: "crate-legendary", name: "Legendary Crate Key", description: "A legendary crate key with the best loot in the game!", category: "crate_keys", price: 5000, currency: "owo", features: ["God-tier Gear", "Massive OWO Coins", "Exclusive Items", "Rank Fragments"], isActive: true, isFeatured: true, badge: "LEGENDARY", badgeColor: "#F59E0B" },
        { _id: "coins-1000", name: "1,000 OWO Coins", description: "Get a quick boost of 1,000 OWO coins!", category: "coins", price: 100, currency: "owo", features: ["Instant Delivery", "Use in Store"], isActive: true, isFeatured: false },
        { _id: "coins-5000", name: "5,000 OWO Coins", description: "Stock up with 5,000 OWO coins at a great value!", category: "coins", price: 450, currency: "owo", features: ["Instant Delivery", "10% Bonus Coins", "Use in Store"], isActive: true, isFeatured: false, badge: "BEST VALUE", badgeColor: "#4ADE80" },
      ]);
      results.push("Created store items");
    } else {
      results.push("Store items already exist — skipped");
    }

    const existingLb = await Leaderboard.findOne();
    if (!existingLb) {
      await Leaderboard.insertMany([
        { _id: "lb-1", userId: "admin-plutonium-001", username: "PlutoniumAdmin", minecraftUsername: "PlutoniumAdmin", tier: "HT1", kills: 420, activeRank: "Owner", updatedAt: new Date() },
        { _id: "lb-2", userId: "lb-user-2", username: "HeartThief_X", tier: "HT1", kills: 312, activeRank: "Legend", updatedAt: new Date() },
        { _id: "lb-3", userId: "lb-user-3", username: "NeonSlayer", tier: "HT2", kills: 287, activeRank: "MVP", updatedAt: new Date() },
        { _id: "lb-4", userId: "lb-user-4", username: "LifeStealKing", tier: "HT2", kills: 198, activeRank: "Legend", updatedAt: new Date() },
        { _id: "lb-5", userId: "lb-user-5", username: "GreenReaper", tier: "HT3", kills: 176, activeRank: "MVP", updatedAt: new Date() },
        { _id: "lb-6", userId: "lb-user-6", username: "AtomicBoom", tier: "HT3", kills: 154, activeRank: "VIP", updatedAt: new Date() },
        { _id: "lb-7", userId: "lb-user-7", username: "CrystalHunter", tier: "HT4", kills: 132, updatedAt: new Date() },
        { _id: "lb-8", userId: "lb-user-8", username: "PlutoPvP", tier: "LT1", kills: 98, activeRank: "VIP", updatedAt: new Date() },
        { _id: "lb-9", userId: "lb-user-9", username: "RadiationX", tier: "LT2", kills: 87, updatedAt: new Date() },
        { _id: "lb-10", userId: "lb-user-10", username: "NuclearFrost", tier: "LT3", kills: 65, updatedAt: new Date() },
      ]);
      results.push("Created leaderboard entries");
    } else {
      results.push("Leaderboard already has entries — skipped");
    }

    const existingAnn = await Announcement.findOne();
    if (!existingAnn) {
      await Announcement.insertMany([
        { _id: "ann-1", title: "Welcome to Plutonium SMP!", content: "The server is now live! Join us at play.plutoniumsmp.net and experience the ultimate Lifesteal SMP. Survive, steal hearts, and dominate the leaderboard!", type: "info", isActive: true, authorId: adminId, authorName: "PlutoniumAdmin", createdAt: new Date() },
        { _id: "ann-2", title: "Weekend 2x OWO Event", content: "This weekend only - earn DOUBLE OWO coins for all kills and activities! Stack up your balance and dominate the store. Event runs Friday-Sunday.", type: "event", isActive: true, authorId: adminId, authorName: "PlutoniumAdmin", createdAt: new Date() },
        { _id: "ann-3", title: "Season 2 Update v1.21.1", content: "We've upgraded to Minecraft 1.21.1! New crates, new ranks, and an improved PvP system. Check the store for the new Legendary crate keys!", type: "update", isActive: true, authorId: adminId, authorName: "PlutoniumAdmin", createdAt: new Date() },
      ]);
      results.push("Created announcements");
    } else {
      results.push("Announcements already exist — skipped");
    }

    res.json({ message: "Seed complete", results });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Seed failed: " + (err as Error).message });
  }
});

router.get("/custom-roles", requireAdmin, async (req, res) => {
  try {
    const roles = await CustomRole.find().sort({ createdAt: 1 });
    res.json(roles.map((r) => r.toJSON()));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/custom-roles", requireAdmin, async (req, res) => {
  try {
    const { name, color, permissions } = req.body;
    if (!name?.trim()) { res.status(400).json({ error: "Name is required" }); return; }
    const existing = await CustomRole.findOne({ name: name.trim() });
    if (existing) { res.status(400).json({ error: "A role with this name already exists" }); return; }
    const role = await CustomRole.create({
      _id: generateId(),
      name: name.trim(),
      color: color || "#6366f1",
      permissions: Array.isArray(permissions) ? permissions : [],
    });
    res.json(role.toJSON());
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/custom-roles/:id", requireAdmin, async (req, res) => {
  try {
    const { name, color, permissions } = req.body;
    const updates: any = {};
    if (name !== undefined) updates.name = name.trim();
    if (color !== undefined) updates.color = color;
    if (permissions !== undefined) updates.permissions = Array.isArray(permissions) ? permissions : [];
    const updated = await CustomRole.findOneAndUpdate(
      { _id: req.params.id },
      updates,
      { new: true }
    );
    if (!updated) { res.status(404).json({ error: "Not found" }); return; }
    res.json(updated.toJSON());
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/custom-roles/:id", requireAdmin, async (req, res) => {
  try {
    await CustomRole.deleteOne({ _id: req.params.id });
    res.json({ message: "Role deleted" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/leaderboard", async (req, res) => {
  try {
    const entries = await Leaderboard.find().limit(200);
    const sorted = entries
      .map((e) => e.toJSON())
      .sort((a, b) => {
        const ta = TIER_ORDER[a.tier] ?? 99;
        const tb = TIER_ORDER[b.tier] ?? 99;
        if (ta !== tb) return ta - tb;
        return b.kills - a.kills;
      });
    const ranked = sorted.map((e, i) => ({ ...e, rank: i + 1 }));
    res.json(ranked);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/leaderboard/:userId", async (req, res) => {
  try {
    const { tier, kills, activeRank, minecraftUsername } = req.body;
    const updates: any = { updatedAt: new Date() };
    if (tier !== undefined) updates.tier = tier;
    if (kills !== undefined) updates.kills = Number(kills);
    if (activeRank !== undefined) updates.activeRank = activeRank || null;
    if (minecraftUsername !== undefined) updates.minecraftUsername = minecraftUsername || null;

    const updated = await Leaderboard.findOneAndUpdate(
      { userId: req.params.userId },
      updates,
      { new: true }
    );
    if (!updated) {
      res.status(404).json({ error: "Player not found in leaderboard" });
      return;
    }

    if (activeRank !== undefined) {
      await User.updateOne({ _id: req.params.userId }, { activeRank: activeRank || null });
    }
    if (minecraftUsername !== undefined) {
      await User.updateOne({ _id: req.params.userId }, { minecraftUsername: minecraftUsername || null });
    }

    res.json(updated.toJSON());
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/leaderboard/sync", async (req, res) => {
  try {
    const users = await User.find();
    let added = 0;
    for (const user of users) {
      const result = await Leaderboard.updateOne(
        { userId: user.id },
        {
          $setOnInsert: {
            _id: generateId(),
            userId: user.id,
            username: user.username,
            minecraftUsername: user.minecraftUsername || null,
            avatarUrl: user.avatarUrl || user.discordAvatar || null,
            activeRank: user.activeRank || null,
            tier: "LT5",
            kills: 0,
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      );
      if (result.upsertedCount > 0) added++;
    }
    res.json({ message: `Synced ${added} users to leaderboard` });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
