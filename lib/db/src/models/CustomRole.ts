import mongoose, { Schema, Model } from "mongoose";

export const ALL_PERMISSIONS = [
  // Dashboard
  "view_dashboard",

  // Tickets
  "view_tickets",
  "reply_tickets",
  "manage_tickets",
  "close_tickets",
  "reopen_tickets",
  "assign_tickets",
  "delete_tickets",

  // Purchases
  "view_purchases",
  "view_purchase_details",
  "manage_purchases",
  "verify_payment",
  "refund_purchases",
  "delete_purchases",

  // Users
  "view_users",
  "view_user_profile",
  "manage_users",
  "edit_user_profile",
  "ban_users",
  "unban_users",
  "change_user_role",
  "delete_users",
  "view_user_purchases",
  "view_user_history",

  // Store
  "view_store",
  "manage_store",
  "manage_store_categories",
  "feature_store_items",
  "view_store_analytics",

  // Coupons
  "view_coupons",
  "manage_coupons",
  "delete_coupons",
  "apply_coupons",
  "view_coupon_stats",

  // Announcements
  "view_announcements",
  "manage_announcements",
  "pin_announcements",
  "delete_announcements",
  "schedule_announcements",

  // Leaderboard
  "view_leaderboard",
  "manage_leaderboard",
  "reset_leaderboard",
  "edit_player_stats",

  // Ranks
  "view_ranks",
  "create_ranks",
  "manage_ranks",
  "delete_ranks",
  "assign_ranks",

  // Roles
  "view_roles",
  "manage_roles",
  "delete_roles",
  "assign_roles",

  // Currency
  "view_currency",
  "manage_currency",
  "deduct_currency",
  "transfer_currency",
  "view_currency_logs",

  // Moderation
  "mute_players",
  "unmute_players",
  "kick_players",
  "warn_players",
  "view_reports",
  "manage_reports",
  "view_audit_logs",

  // Settings
  "view_settings",
  "manage_settings",
  "manage_server_ip",
  "manage_voting_sites",

  // Staff
  "view_staff_activity",
  "manage_staff",
  "view_staff_logs",
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
