import mongoose, { Schema, Document } from "mongoose";

export interface IConfig extends Document {
  key: string;
  value: string;
}

const configSchema = new Schema<IConfig>({
  key: { type: String, required: true, unique: true },
  value: { type: String, required: true },
});

export const Config = mongoose.models.Config || mongoose.model<IConfig>("Config", configSchema);
