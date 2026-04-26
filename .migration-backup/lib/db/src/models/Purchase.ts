import mongoose, { Schema, Model } from "mongoose";

export interface IPurchase {
  id: string;
  orderNumber: string;
  userId: string;
  username: string;
  itemId: string;
  itemName: string;
  itemCategory: string;
  pricePaid: number;
  currency: string;
  couponUsed?: string | null;
  status: "pending" | "completed" | "failed" | "refunded";
  notes?: string | null;
  paymentProofUrl?: string | null;
  paymentProofSubmittedAt?: Date | null;
  createdAt: Date;
}

const purchaseSchema = new Schema(
  {
    _id: { type: String, required: true },
    orderNumber: { type: String, default: "" },
    userId: { type: String, required: true },
    username: { type: String, default: "" },
    itemId: { type: String, required: true },
    itemName: { type: String, required: true },
    itemCategory: { type: String, required: true },
    pricePaid: { type: Number, required: true },
    currency: { type: String, required: true },
    couponUsed: { type: String, default: null },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    notes: { type: String, default: null },
    paymentProofUrl: { type: String, default: null },
    paymentProofSubmittedAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false, timestamps: false }
);

purchaseSchema.set("toJSON", {
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id;
    delete (ret as any)._id;
    delete (ret as any).__v;
    return ret;
  },
});

export const Purchase: Model<IPurchase> =
  (mongoose.models.Purchase as Model<IPurchase>) ||
  mongoose.model<IPurchase>("Purchase", purchaseSchema);
