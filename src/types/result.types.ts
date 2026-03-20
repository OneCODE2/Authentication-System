import type { CookieOptions } from "express";

export type Result<T, E = AppError> =
    | { ok: true; data: T }
    | { ok: false; error: E };

export interface AppError {
    code: string;
    message: string;
    status: number;
}

export interface HttpResponse<T> {
    status: number;
    body: T;
    cookies?: Array<{
        name: string;
        value: string;
        options: CookieOptions;
    }>;
    clearCookies?: Array<{
        name: string;
        options: CookieOptions;
    }>;
}

export const ok = <T>(data: T): Result<T> => ({ ok: true, data });

export const err = (error: AppError): Result<never> => ({ ok: false, error });
