import mongoose, { Schema, Document } from "mongoose";

export interface IServerConfig extends Document {
  _id: string;
  serverIp: string;
  serverPort: number;
  updatedAt: Date;
}

const ServerConfigSchema = new Schema<IServerConfig>({
  _id: { type: String, required: true },
  serverIp: { type: String, required: true, default: "play.plutoniumsmp.fun" },
  serverPort: { type: Number, required: true, default: 24005 },
  updatedAt: { type: Date, default: Date.now },
});

export const ServerConfig = mongoose.model<IServerConfig>("ServerConfig", ServerConfigSchema);
