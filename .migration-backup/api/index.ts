import { connectDB } from "@workspace/db";
import app from "../artifacts/api-server/src/app.js";

let dbConnected = false;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  if (!dbConnected) {
    await connectDB();
    dbConnected = true;
  }
  return app(req, res);
}
