import mongoose, { Schema, Model } from "mongoose";

export interface IRank {
  id: string;
  name: string;
  color: string;
  description: string;
  price: number;
  features: string[];
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
    features: [{ type: String }],
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
