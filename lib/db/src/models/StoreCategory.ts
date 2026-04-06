import mongoose, { Schema, Model } from "mongoose";

export interface IStoreCategory {
  id: string;
  name: string;
  value: string;
  icon?: string;
  color?: string;
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
    icon: { type: String, default: null },
    color: { type: String, default: "#6366f1" },
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
