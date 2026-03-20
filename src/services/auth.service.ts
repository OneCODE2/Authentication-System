import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { CookieOptions } from "express";
import config from "../config/config.js";
import userModel from "../models/user.model.js";
import sessionModel from "../models/session.model.js";
import otpModel from "../models/otp.model.js";
import { jwtPayloadSchema, loginBodySchema, registerBodySchema, verifyEmailBodySchema } from "../schemas/auth.schemas.js";
import type {
    JwtPayload,
    LoginResponse,
    MessageResponse,
    RefreshTokenResponse,
    RegisterResponse
} from "../types/auth.types.js";
import { err, ok, type HttpResponse, type Result } from "../types/result.types.js";
import { minutesFromNow } from "../utils/date.utils.js";
import { generateOtp, getOtpHtml } from "../utils/otp.utils.js";
import { normalizeEmail } from "../utils/string.utils.js";
import { parseWithSchema } from "../utils/validation.utils.js";
import { sendEmail } from "./email.service.js";

export function authCookieOptions(): CookieOptions {
    return {
        httpOnly: true,
        secure: config.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
    };
}

function signAccessToken(userId: string, sessionId: string): string {
    return jwt.sign(
        { id: userId, sessionId } satisfies JwtPayload,
        config.JWT_SECRET,
        { expiresIn: "15m" }
    );
}

function signRefreshToken(userId: string, sessionId: string): string {
    return jwt.sign(
        { id: userId, sessionId } satisfies JwtPayload,
        config.JWT_SECRET,
        { expiresIn: "7d" }
    );
}

function verifyToken(token: string): Result<JwtPayload> {
    try {
        const decodedUnknown: unknown = jwt.verify(token, config.JWT_SECRET);
        const payload = jwtPayloadSchema.safeParse(decodedUnknown);
        if (!payload.success) {
            return err({
                code: "INVALID_TOKEN",
                message: "Invalid token payload",
                status: 401
            });
        }
        return ok(payload.data);
    } catch {
        return err({
            code: "INVALID_TOKEN",
            message: "Invalid or expired token",
            status: 401
        });
    }
}

export async function registerService(
    body: unknown
): Promise<Result<HttpResponse<RegisterResponse | MessageResponse>>> {
    const parsed = parseWithSchema(registerBodySchema, body, "Invalid register payload");
    if (!parsed.ok) return parsed;

    const username = parsed.data.username.trim();
    const email = normalizeEmail(parsed.data.email);
    const password = parsed.data.password;

    const existingUser = await userModel.findOne({
        $or: [{ username }, { email }]
    });
    if (existingUser) {
        return ok({
            status: 409,
            body: { message: "Username or Email already exists" }
        });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await userModel.create({
        username,
        email,
        password: hashedPassword
    });

    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);

    await otpModel.deleteMany({ user: user._id });
    await otpModel.create({
        user: user._id,
        email,
        otpHash,
        expiresAt: minutesFromNow(10)
    });

    const emailResult = await sendEmail(
        email,
        "OTP verification",
        `Your OTP is ${otp}`,
        getOtpHtml(otp)
    );
    if (!emailResult.ok) {
        await otpModel.deleteMany({ user: user._id });
        await userModel.findByIdAndDelete(user._id);
        return ok({
            status: 502,
            body: { message: "Failed to send verification email" }
        });
    }

    return ok({
        status: 201,
        body: {
            message: "User registered successfully",
            user: {
                username: user.username,
                email: user.email,
                verified: user.verified
            }
        }
    });
}

export async function verifyEmailService(
    body: unknown
): Promise<Result<HttpResponse<RegisterResponse | MessageResponse>>> {
    const parsed = parseWithSchema(verifyEmailBodySchema, body, "Invalid verify-email payload");
    if (!parsed.ok) return parsed;

    const email = normalizeEmail(parsed.data.email);
    const otp = parsed.data.otp;

    const otpDoc = await otpModel.findOne({ email }).sort({ createdAt: -1 });
    if (!otpDoc) {
        return ok({
            status: 404,
            body: { message: "OTP not found" }
        });
    }

    if (otpDoc.expiresAt < new Date()) {
        await otpModel.deleteMany({ user: otpDoc.user });
        return ok({
            status: 400,
            body: { message: "OTP expired" }
        });
    }

    const isMatch = await bcrypt.compare(otp, otpDoc.otpHash);
    if (!isMatch) {
        return ok({
            status: 400,
            body: { message: "Invalid OTP" }
        });
    }

    const user = await userModel.findByIdAndUpdate(
        otpDoc.user,
        { verified: true },
        { new: true }
    );
    if (!user) {
        return ok({
            status: 404,
            body: { message: "User not found" }
        });
    }

    await otpModel.deleteMany({ user: otpDoc.user });

    return ok({
        status: 200,
        body: {
            message: "Email verified successfully",
            user: {
                username: user.username,
                email: user.email,
                verified: user.verified
            }
        }
    });
}

export async function loginService(
    body: unknown,
    ip: string,
    userAgent: string
): Promise<Result<HttpResponse<LoginResponse | MessageResponse>>> {
    const parsed = parseWithSchema(loginBodySchema, body, "Invalid login payload");
    if (!parsed.ok) return parsed;

    const email = normalizeEmail(parsed.data.email);
    const password = parsed.data.password;

    const user = await userModel.findOne({ email });
    if (!user) {
        return ok({
            status: 404,
            body: { message: "User not found" }
        });
    }

    if (!user.verified) {
        return ok({
            status: 403,
            body: { message: "Please verify your email before logging in" }
        });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return ok({
            status: 401,
            body: { message: "Invalid password" }
        });
    }

    const session = await sessionModel.create({
        user: user._id,
        refreshTokenHash: "pending",
        ip,
        userAgent
    });

    const userId = user._id.toString();
    const sessionId = session._id.toString();

    const refreshToken = signRefreshToken(userId, sessionId);
    session.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await session.save();

    const accessToken = signAccessToken(userId, sessionId);

    return ok({
        status: 200,
        body: {
            message: "User logged in successfully",
            user: {
                username: user.username,
                email: user.email,
                verified: user.verified
            },
            accessToken
        },
        cookies: [
            {
                name: "refreshToken",
                value: refreshToken,
                options: authCookieOptions()
            }
        ]
    });
}

export async function getMeService(
    authorizationHeader: string | undefined
): Promise<Result<HttpResponse<RegisterResponse | MessageResponse>>> {
    if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
        return ok({ status: 401, body: { message: "Unauthorized User" } });
    }
    const token = authorizationHeader.split(" ")[1];
    if (!token) {
        return ok({ status: 401, body: { message: "Unauthorized User" } });
    }

    const decodedResult = verifyToken(token);
    if (!decodedResult.ok) {
        return ok({ status: 401, body: { message: decodedResult.error.message } });
    }

    const user = await userModel.findById(decodedResult.data.id);
    if (!user) {
        return ok({ status: 404, body: { message: "User not found" } });
    }

    return ok({
        status: 200,
        body: {
            message: "User found",
            user: {
                username: user.username,
                email: user.email,
                verified: user.verified
            }
        }
    });
}

export async function refreshTokenService(
    refreshToken: string | undefined
): Promise<Result<HttpResponse<RefreshTokenResponse | MessageResponse>>> {
    if (!refreshToken) {
        return ok({ status: 401, body: { message: "Unauthorized User" } });
    }

    const decodedResult = verifyToken(refreshToken);
    if (!decodedResult.ok || !decodedResult.data.sessionId) {
        return ok({ status: 401, body: { message: "Invalid or expired token" } });
    }

    const session = await sessionModel.findOne({
        _id: decodedResult.data.sessionId,
        user: decodedResult.data.id,
        revoked: false
    });
    if (!session) {
        return ok({ status: 401, body: { message: "Session not found" } });
    }

    const isMatch = await bcrypt.compare(refreshToken, session.refreshTokenHash);
    if (!isMatch) {
        return ok({ status: 401, body: { message: "Invalid refresh token" } });
    }

    const sessionId = session._id.toString();
    const userId = decodedResult.data.id;
    const newRefreshToken = signRefreshToken(userId, sessionId);
    session.refreshTokenHash = await bcrypt.hash(newRefreshToken, 10);
    await session.save();

    return ok({
        status: 200,
        body: {
            message: "Access token refreshed successfully",
            accessToken: signAccessToken(userId, sessionId)
        },
        cookies: [
            {
                name: "refreshToken",
                value: newRefreshToken,
                options: authCookieOptions()
            }
        ]
    });
}

export async function logoutService(
    refreshToken: string | undefined
): Promise<Result<HttpResponse<MessageResponse>>> {
    if (!refreshToken) {
        return ok({ status: 401, body: { message: "Refresh token not found" } });
    }

    const decodedResult = verifyToken(refreshToken);
    if (!decodedResult.ok || !decodedResult.data.sessionId) {
        return ok({ status: 401, body: { message: "Invalid or expired token" } });
    }

    const session = await sessionModel.findOne({
        _id: decodedResult.data.sessionId,
        user: decodedResult.data.id,
        revoked: false
    });
    if (!session) {
        return ok({ status: 401, body: { message: "Session not found" } });
    }

    const isMatch = await bcrypt.compare(refreshToken, session.refreshTokenHash);
    if (!isMatch) {
        return ok({ status: 401, body: { message: "Invalid refresh token" } });
    }

    session.revoked = true;
    await session.save();

    return ok({
        status: 200,
        body: { message: "Logged out successfully" },
        clearCookies: [{ name: "refreshToken", options: authCookieOptions() }]
    });
}

export async function logoutAllService(
    refreshToken: string | undefined
): Promise<Result<HttpResponse<MessageResponse>>> {
    if (!refreshToken) {
        return ok({ status: 401, body: { message: "Refresh token not found" } });
    }

    const decodedResult = verifyToken(refreshToken);
    if (!decodedResult.ok) {
        return ok({ status: 401, body: { message: "Invalid or expired token" } });
    }

    const sessions = await sessionModel.updateMany(
        { user: decodedResult.data.id, revoked: false },
        { $set: { revoked: true } }
    );
    if (!sessions.matchedCount) {
        return ok({ status: 401, body: { message: "No active sessions found" } });
    }

    return ok({
        status: 200,
        body: { message: "Logged out from all sessions successfully" },
        clearCookies: [{ name: "refreshToken", options: authCookieOptions() }]
    });
}
