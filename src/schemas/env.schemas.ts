import { z } from "zod";

export const envSchema = z.object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    MONGO_URI: z.string().min(1),
    JWT_SECRET: z.string().min(1),
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    GOOGLE_REFRESH_TOKEN: z.string().min(1),
    GOOGLE_USER: z.string().email()
});

export type EnvConfig = z.infer<typeof envSchema>;
