import mongoose, { Schema, Model } from "mongoose";

export interface IAnnouncement {
  id: string;
  title: string;
  content: string;
  type: "info" | "warning" | "update" | "event";
  isActive: boolean;
  pinned: boolean;
  imageUrl?: string | null;
  bannerColor?: string | null;
  authorId?: string | null;
  authorName?: string | null;
  authorAvatar?: string | null;
  scheduledAt?: Date | null;
  createdAt: Date;
}

const announcementSchema = new Schema(
  {
    _id: { type: String, required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    type: { type: String, enum: ["info", "warning", "update", "event"], default: "info" },
    isActive: { type: Boolean, default: true },
    pinned: { type: Boolean, default: false },
    imageUrl: { type: String, default: null },
    bannerColor: { type: String, default: null },
    authorId: { type: String, default: null },
    authorName: { type: String, default: null },
    authorAvatar: { type: String, default: null },
    scheduledAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false, timestamps: false }
);

announcementSchema.set("toJSON", {
  transform: (_doc: any, ret: any) => {
    ret.id = ret._id;
    delete (ret as any)._id;
    delete (ret as any).__v;
    return ret;
  },
});

export const Announcement: Model<IAnnouncement> =
  (mongoose.models.Announcement as Model<IAnnouncement>) ||
  mongoose.model<IAnnouncement>("Announcement", announcementSchema);
