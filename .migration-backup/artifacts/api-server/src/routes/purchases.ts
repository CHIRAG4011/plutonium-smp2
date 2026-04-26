import { Router } from "express";
import { Purchase } from "@workspace/db";
import { requireAuth, AuthRequest } from "../lib/auth.js";

const router = Router();

router.get("/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const purchase = await Purchase.findOne({ _id: req.params.id, userId: req.user!.id });
    if (!purchase) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    res.json(purchase.toJSON());
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/:id/payment-proof", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { imageDataUrl } = req.body;
    if (!imageDataUrl || typeof imageDataUrl !== "string") {
      res.status(400).json({ error: "Image data required" });
      return;
    }
    if (!imageDataUrl.startsWith("data:image/")) {
      res.status(400).json({ error: "Invalid image format" });
      return;
    }
    const purchase = await Purchase.findOne({ _id: req.params.id, userId: req.user!.id });
    if (!purchase) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    if (purchase.status !== "pending") {
      res.status(400).json({ error: "Can only submit proof for pending orders" });
      return;
    }
    await Purchase.updateOne(
      { _id: purchase._id },
      { paymentProofUrl: imageDataUrl, paymentProofSubmittedAt: new Date() }
    );
    res.json({ message: "Payment proof submitted successfully" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
