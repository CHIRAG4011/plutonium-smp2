import mongoose, { Schema, Model } from "mongoose";

export interface ICoupon {
  id: string;
  code: string;
  discountType: "percent" | "fixed";
  discountPercent: number;
  discountFixed?: number | null;
  usageLimit?: number | null;
  usageCount: number;
  minCartValue?: number | null;
  expiresAt?: Date | null;
  isActive: boolean;
  description?: string | null;
  createdAt: Date;
}

const couponSchema = new Schema(
  {
    _id: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    discountType: { type: String, enum: ["percent", "fixed"], default: "percent" },
    discountPercent: { type: Number, default: 0 },
    discountFixed: { type: Number, default: null },
    usageLimit: { type: Number, default: null },
    usageCount: { type: Number, default: 0 },
    minCartValue: { type: Number, default: null },
    expiresAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
    description: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false, timestamps: false }
);

couponSchema.set("toJSON", {
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id;
    delete (ret as any)._id;
    delete (ret as any).__v;
    return ret;
  },
});

export const Coupon: Model<ICoupon> =
  (mongoose.models.Coupon as Model<ICoupon>) || mongoose.model<ICoupon>("Coupon", couponSchema);
