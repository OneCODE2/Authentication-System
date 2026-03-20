import dotenv from "dotenv";
import { envSchema, type EnvConfig } from "../schemas/env.schemas.js";

dotenv.config();

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    throw new Error("Invalid environment configuration");
}

const config: EnvConfig = parsed.data;

export default config;
