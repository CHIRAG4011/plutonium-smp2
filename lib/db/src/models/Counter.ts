import mongoose, { Schema, Model } from "mongoose";

export interface ICounter {
  _id: string;
  value: number;
}

const counterSchema = new Schema(
  {
    _id: { type: String, required: true },
    value: { type: Number, default: 1000 },
  },
  { _id: false }
);

export const Counter: Model<ICounter> =
  (mongoose.models.Counter as Model<ICounter>) ||
  mongoose.model<ICounter>("Counter", counterSchema);
