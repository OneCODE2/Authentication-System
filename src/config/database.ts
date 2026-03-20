import mongoose from "mongoose";
import config from "./config.js";
import { err, ok, type Result } from "../types/result.types.js";

export async function connectDB(): Promise<Result<{ connected: true }>> {
    try {
        await mongoose.connect(config.MONGO_URI);
        return ok({ connected: true });
    } catch {
        return err({
            code: "DB_CONNECTION_FAILED",
            message: "Failed to connect to database",
            status: 500
        });
    }
}
