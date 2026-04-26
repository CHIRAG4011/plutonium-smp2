import { Counter } from "@workspace/db";

export async function generateOrderNumber(): Promise<string> {
  const counter = await Counter.findOneAndUpdate(
    { _id: "purchase_order" },
    { $inc: { value: 1 } },
    { upsert: true, new: true }
  );
  const num = counter?.value ?? 1001;
  return `PLU-${num}`;
}
