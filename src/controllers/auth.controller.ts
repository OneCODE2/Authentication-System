import type { CookieOptions, Request, Response } from "express";
import { refreshTokenCookieSchema } from "../schemas/auth.schemas.js";
import type { HttpResponse } from "../types/result.types.js";
import {
    getMeService,
    loginService,
    logoutAllService,
    logoutService,
    refreshTokenService,
    registerService,
    verifyEmailService
} from "../services/auth.service.js";

function applyCookies(res: Response, responseData: HttpResponse<unknown>): void {
    if (responseData.cookies) {
        for (const cookie of responseData.cookies) {
            const options: CookieOptions = cookie.options;
            res.cookie(cookie.name, cookie.value, options);
        }
    }
    if (responseData.clearCookies) {
        for (const cookie of responseData.clearCookies) {
            const options: CookieOptions = cookie.options;
            res.clearCookie(cookie.name, options);
        }
    }
}

export async function register(req: Request, res: Response): Promise<void> {
    const result = await registerService(req.body);
    if (!result.ok) {
        res.status(result.error.status).json({ message: result.error.message });
        return;
    }
    applyCookies(res, result.data);
    res.status(result.data.status).json(result.data.body);
}

export async function verifyEmail(req: Request, res: Response): Promise<void> {
    const result = await verifyEmailService(req.body);
    if (!result.ok) {
        res.status(result.error.status).json({ message: result.error.message });
        return;
    }
    applyCookies(res, result.data);
    res.status(result.data.status).json(result.data.body);
}

export async function login(req: Request, res: Response): Promise<void> {
    const result = await loginService(req.body, req.ip ?? "unknown", req.get("user-agent") ?? "unknown");
    if (!result.ok) {
        res.status(result.error.status).json({ message: result.error.message });
        return;
    }
    applyCookies(res, result.data);
    res.status(result.data.status).json(result.data.body);
}

export async function getMe(req: Request, res: Response): Promise<void> {
    const result = await getMeService(req.get("authorization"));
    if (!result.ok) {
        res.status(result.error.status).json({ message: result.error.message });
        return;
    }
    res.status(result.data.status).json(result.data.body);
}

export async function refreshToken(req: Request, res: Response): Promise<void> {
    const parsedCookie = refreshTokenCookieSchema.safeParse(req.cookies);
    const token = parsedCookie.success ? parsedCookie.data.refreshToken : undefined;
    const result = await refreshTokenService(token);
    if (!result.ok) {
        res.status(result.error.status).json({ message: result.error.message });
        return;
    }
    applyCookies(res, result.data);
    res.status(result.data.status).json(result.data.body);
}

export async function logout(req: Request, res: Response): Promise<void> {
    const parsedCookie = refreshTokenCookieSchema.safeParse(req.cookies);
    const token = parsedCookie.success ? parsedCookie.data.refreshToken : undefined;
    const result = await logoutService(token);
    if (!result.ok) {
        res.status(result.error.status).json({ message: result.error.message });
        return;
    }
    applyCookies(res, result.data);
    res.status(result.data.status).json(result.data.body);
}

export async function logoutAll(req: Request, res: Response): Promise<void> {
    const parsedCookie = refreshTokenCookieSchema.safeParse(req.cookies);
    const token = parsedCookie.success ? parsedCookie.data.refreshToken : undefined;
    const result = await logoutAllService(token);
    if (!result.ok) {
        res.status(result.error.status).json({ message: result.error.message });
        return;
    }
    applyCookies(res, result.data);
    res.status(result.data.status).json(result.data.body);
}
