import { Router } from "express";
import { Purchase, User } from "@workspace/db";
import { requireAuth, AuthRequest } from "../lib/auth.js";

const router = Router();

router.get("/purchases", requireAuth, async (req: AuthRequest, res) => {
  try {
    const purchases = await Purchase.find({ userId: req.user!.id }).sort({ createdAt: -1 });
    res.json(purchases.map((p) => p.toJSON()));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/me", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { minecraftUsername } = req.body;
    const updates: Record<string, any> = { updatedAt: new Date() };

    if (minecraftUsername !== undefined) {
      const trimmed = (minecraftUsername as string).trim();
      if (trimmed.length > 0 && !/^[a-zA-Z0-9_]{1,16}$/.test(trimmed)) {
        res.status(400).json({ error: "Minecraft username must be 1–16 characters and only contain letters, numbers, and underscores." });
        return;
      }
      updates.minecraftUsername = trimmed.length > 0 ? trimmed : null;
    }

    await User.updateOne({ _id: req.user!.id }, updates);

    const updated = await User.findOne({ _id: req.user!.id });
    if (!updated) { res.status(404).json({ error: "User not found" }); return; }
    const safe = updated.toJSON() as any;
    delete safe.passwordHash;
    res.json(safe);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/me/profile-picture", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { avatarUrl } = req.body;
    if (!avatarUrl) {
      res.status(400).json({ error: "avatarUrl is required" });
      return;
    }
    try {
      new URL(avatarUrl);
    } catch {
      res.status(400).json({ error: "Invalid URL" });
      return;
    }
    await User.updateOne({ _id: req.user!.id }, { avatarUrl, updatedAt: new Date() });
    res.json({ message: "Profile picture updated" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
