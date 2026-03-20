interface ApiError {
    message: string;
    code?: string;
}

interface ApiResult<T> {
    ok: boolean;
    status: number;
    data?: T;
    error?: ApiError;
}

async function request<T>(path: string, init: RequestInit): Promise<ApiResult<T>> {
    try {
        const response = await fetch(path, {
            ...init,
            headers: {
                "Content-Type": "application/json",
                ...(init.headers ?? {})
            },
            credentials: "include"
        });

        const payload: unknown = await response.json();
        if (!response.ok) {
            const errPayload = payload as { message?: string; code?: string };
            return {
                ok: false,
                status: response.status,
                error: {
                    message: errPayload.message ?? "Request failed",
                    code: errPayload.code
                }
            };
        }

        return {
            ok: true,
            status: response.status,
            data: payload as T
        };
    } catch {
        return {
            ok: false,
            status: 0,
            error: {
                message: "Network error. Check if API server is running."
            }
        };
    }
}

export interface RegisterResponse {
    message: string;
    user: {
        username: string;
        email: string;
        verified: boolean;
    };
}

export interface LoginResponse {
    message: string;
    user: {
        username: string;
        email: string;
    };
    accessToken: string;
}

export interface VerifyOtpResponse {
    message: string;
    user: {
        username: string;
        email: string;
        verified: boolean;
    };
}

export interface GetMeResponse {
    message: string;
    user: {
        username: string;
        email: string;
    };
}

export interface RefreshResponse {
    message: string;
    accessToken: string;
}

export interface SessionsResponse {
    message: string;
    sessions: Array<{
        id: string;
        device: string;
        location: string;
        lastSeen: string;
        current: boolean;
    }>;
}

export interface MessageResponse {
    message: string;
}

export async function registerApi(email: string, password: string): Promise<ApiResult<RegisterResponse>> {
    return request<RegisterResponse>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
            username: email.split("@")[0],
            email,
            password
        })
    });
}

export async function loginApi(email: string, password: string): Promise<ApiResult<LoginResponse>> {
    return request<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
    });
}

export async function verifyOtpApi(email: string, otp: string): Promise<ApiResult<VerifyOtpResponse>> {
    return request<VerifyOtpResponse>("/api/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ email, otp })
    });
}

export async function getMeApi(accessToken: string): Promise<ApiResult<GetMeResponse>> {
    return request<GetMeResponse>("/api/auth/get-me", {
        method: "GET",
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });
}

export async function refreshTokenApi(): Promise<ApiResult<RefreshResponse>> {
    return request<RefreshResponse>("/api/auth/refresh-token", {
        method: "POST"
    });
}

export async function logoutApi(): Promise<ApiResult<MessageResponse>> {
    return request<MessageResponse>("/api/auth/logout", {
        method: "POST"
    });
}

export async function logoutAllApi(): Promise<ApiResult<MessageResponse>> {
    return request<MessageResponse>("/api/auth/logout-all", {
        method: "POST"
    });
}

export async function getSessionsApi(): Promise<ApiResult<SessionsResponse>> {
    return request<SessionsResponse>("/api/auth/sessions", {
        method: "GET"
    });
}

export async function revokeSessionApi(sessionId: string): Promise<ApiResult<MessageResponse>> {
    return request<MessageResponse>("/api/auth/revoke-session", {
        method: "POST",
        body: JSON.stringify({ sessionId })
    });
}
