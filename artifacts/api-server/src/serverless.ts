import { connectDB } from "@workspace/db";
import app from "./app.js";

let connected = false;

async function ensureConnected() {
  if (!connected) {
    await connectDB();
    connected = true;
  }
}

const handler = async (req: any, res: any) => {
  try {
    await ensureConnected();
  } catch {
    res.status(500).json({ error: "Database connection failed" });
    return;
  }
  return app(req, res);
};

module.exports = handler;
