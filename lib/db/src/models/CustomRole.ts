import mongoose, { Schema, Model } from "mongoose";

export const ALL_PERMISSIONS = [
  "view_dashboard",
  "view_tickets",
  "manage_tickets",
  "view_leaderboard",
  "manage_leaderboard",
  "view_purchases",
  "manage_purchases",
  "view_coupons",
  "manage_coupons",
  "view_announcements",
  "manage_announcements",
  "view_store",
  "manage_store",
  "view_users",
  "manage_users",
  "view_settings",
  "manage_settings",
  "view_currency",
  "manage_currency",
] as const;

export type Permission = (typeof ALL_PERMISSIONS)[number];

export interface ICustomRole {
  id: string;
  name: string;
  color: string;
  permissions: Permission[];
  createdAt: Date;
}

const customRoleSchema = new Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true, unique: true },
    color: { type: String, default: "#6366f1" },
    permissions: [{ type: String }],
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false, timestamps: false }
);

customRoleSchema.set("toJSON", {
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id;
    delete (ret as any)._id;
    delete (ret as any).__v;
    return ret;
  },
});

export const CustomRole: Model<ICustomRole> =
  (mongoose.models.CustomRole as Model<ICustomRole>) ||
  mongoose.model<ICustomRole>("CustomRole", customRoleSchema);
