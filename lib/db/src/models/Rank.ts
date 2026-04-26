import mongoose, { Schema, Model } from "mongoose";

export interface IRank {
  id: string;
  name: string;
  color: string;
  description: string;
  price: number;
  currency: string;
  features: string[];
  imageUrl?: string | null;
  badge?: string | null;
  badgeColor?: string | null;
  isFeatured: boolean;
  sortOrder: number;
  prefix?: string | null;
  suffix?: string | null;
  minecraftPermissions: string[];
  commands: string[];
  storeItemId: string | null;
  isActive: boolean;
  createdAt: Date;
}

const rankSchema = new Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true, unique: true },
    color: { type: String, default: "#22c55e" },
    description: { type: String, default: "" },
    price: { type: Number, default: 0 },
    currency: { type: String, default: "usd" },
    features: [{ type: String }],
    imageUrl: { type: String, default: null },
    badge: { type: String, default: null },
    badgeColor: { type: String, default: null },
    isFeatured: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    prefix: { type: String, default: null },
    suffix: { type: String, default: null },
    minecraftPermissions: [{ type: String }],
    commands: [{ type: String }],
    storeItemId: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false, timestamps: false }
);

rankSchema.set("toJSON", {
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Rank: Model<IRank> =
  (mongoose.models.Rank as Model<IRank>) ||
  mongoose.model<IRank>("Rank", rankSchema);
