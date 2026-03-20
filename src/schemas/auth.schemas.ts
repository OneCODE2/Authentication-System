import { z } from "zod";

export const registerBodySchema = z.object({
    username: z.string().trim().min(1),
    email: z.string().trim().email(),
    password: z.string().min(6)
});

export const loginBodySchema = z.object({
    email: z.string().trim().email(),
    password: z.string().min(1)
});

export const verifyEmailBodySchema = z.object({
    email: z.string().trim().email(),
    otp: z.string().trim().regex(/^\d{6}$/)
});

export const bearerHeaderSchema = z.string().regex(/^Bearer\s+\S+$/);

export const refreshTokenCookieSchema = z.object({
    refreshToken: z.string().min(1)
});

export const jwtPayloadSchema = z.object({
    id: z.string().min(1),
    sessionId: z.string().min(1).optional(),
    iat: z.number().optional(),
    exp: z.number().optional()
});

export type RegisterBody = z.infer<typeof registerBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
export type VerifyEmailBody = z.infer<typeof verifyEmailBodySchema>;
