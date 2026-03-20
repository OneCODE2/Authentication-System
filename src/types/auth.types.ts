import type { Types } from "mongoose";

export interface JwtPayload {
    id: string;
    sessionId?: string | undefined;
    iat?: number | undefined;
    exp?: number | undefined;
}

export interface AuthUserView {
    username: string;
    email: string;
    verified: boolean;
}

export interface RegisterResponse {
    message: string;
    user: AuthUserView;
}

export interface LoginResponse {
    message: string;
    user: AuthUserView;
    accessToken: string;
}

export interface RefreshTokenResponse {
    message: string;
    accessToken: string;
}

export interface MessageResponse {
    message: string;
}

export interface OtpEntity {
    user: Types.ObjectId;
    email: string;
    otpHash: string;
    expiresAt: Date;
}
