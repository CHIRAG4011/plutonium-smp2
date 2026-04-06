import mongoose, { Schema, Model } from "mongoose";

export interface IStoreCategory {
  id: string;
  name: string;
  value: string;
  description?: string;
  icon?: string;
  color?: string;
  badge?: string;
  badgeColor?: string;
  isFeatured: boolean;
  showItemCount: boolean;
  sortOrder: number;
  isActive: boolean;
  isBuiltin: boolean;
  createdAt: Date;
}

const storeCategorySchema = new Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    value: { type: String, required: true, unique: true },
    description: { type: String, default: null },
    icon: { type: String, default: null },
    color: { type: String, default: "#6366f1" },
    badge: { type: String, default: null },
    badgeColor: { type: String, default: "#ef4444" },
    isFeatured: { type: Boolean, default: false },
    showItemCount: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isBuiltin: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false, timestamps: false }
);

storeCategorySchema.set("toJSON", {
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const StoreCategory: Model<IStoreCategory> =
  (mongoose.models.StoreCategory as Model<IStoreCategory>) ||
  mongoose.model<IStoreCategory>("StoreCategory", storeCategorySchema);
