import userModel from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import config from "../config/config.js";
import sessionModel from "../models/session.model.js";
import { sendEmail } from "../services/email.services.js";
import otpModel from "../models/otp.model.js";
import { getOtpHtml, generateOtp } from "../utils/utils.js";

function normalizeEmail(email) {
    return email?.trim().toLowerCase();
}

function cookieOptions() {
    return {
        httpOnly: true,
        secure: config.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
    };
}

export async function register(req, res) {
    try {
        const username = req.body.username?.trim();
        const email = normalizeEmail(req.body.email);
        const { password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                message: "Username, email and password are required"
            });
        }

        const isAlreadyRegistered = await userModel.findOne({
            $or: [
                { username },
                { email }
            ]
        });

        if (isAlreadyRegistered) {
            return res.status(409).json({
                message: "Username or Email already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await userModel.create({
            username,
            email,
            password: hashedPassword
        });

        const otp = generateOtp();
        const html = getOtpHtml(otp);

        const otpHash = await bcrypt.hash(otp, 10);
        await otpModel.deleteMany({ user: user._id });
        await otpModel.create({
            user: user._id,
            email,
            otpHash,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000)
        });

        try {
            await sendEmail(email, "OTP verification", `Your OTP is ${otp}`, html);
        } catch (error) {
            console.error("OTP email send failed:", error.message);
            await otpModel.deleteMany({ user: user._id });
            await userModel.findByIdAndDelete(user._id);
            return res.status(502).json({
                message: "Failed to send verification email"
            });
        }

        return res.status(201).json({
            message: "User registered successfully",
            user: {
                username: user.username,
                email: user.email,
                verified: user.verified
            },
        });
    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({
                message: "Username or Email already exists"
            });
        }
        console.error("Register error:", error?.message || error);
        return res.status(500).json({
            message: "Internal server error while creating account"
        });
    }

}

export async function login(req, res) {
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Email and password are required"
        });
    }

    const user = await userModel.findOne({ email });

    if (!user) {
        return res.status(404).json({
            message: "User not found"
        });
    };

    if (!user.verified) {
        return res.status(403).json({
            message: "Please verify your email before logging in"
        });
    };

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        return res.status(401).json({
            message: "Invalid password"
        });
    }

    const session = await sessionModel.create({
        user: user._id,
        refreshTokenHash: "pending",
        ip: req.ip,
        userAgent: req.headers["user-agent"]
    });

    const refreshToken = jwt.sign({
        id: user._id,
        sessionId: session._id,
    }, config.JWT_SECRET, {
        expiresIn: "7d"
    });

    session.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await session.save();

    const accessToken = jwt.sign({
        id: user._id,
        sessionId: session._id,
    }, config.JWT_SECRET, {
        expiresIn: "15m"
    });

    res.cookie("refreshToken", refreshToken, cookieOptions());

    return res.status(200).json({
        message: "User logged in successfully",
        user: {
            username: user.username,
            email: user.email
        },
        accessToken
    });
}

export async function getMe(req, res) {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            message: "Unauthorized User"
        });
    }

    let decoded;
    try {
        decoded = jwt.verify(token, config.JWT_SECRET);
    } catch (err) {
        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }

    const user = await userModel.findById(decoded.id);

    if (!user) {
        return res.status(404).json({
            message: "User not found"
        });
    }

    return res.status(200).json({
        message: "User found",
        user: {
            username: user.username,
            email: user.email
        }
    });
}

export async function refreshToken(req, res) {

    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.status(401).json({
            message: "Unauthorized User"
        });
    }

    let decoded;
    try {
        decoded = jwt.verify(refreshToken, config.JWT_SECRET);
    } catch (err) {
        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
    const session = await sessionModel.findOne({
        _id: decoded.sessionId,
        user: decoded.id,
        revoked: false
    });

    if (!session) {
        return res.status(401).json({
            message: "Session not found"
        });
    };

    const isMatch = await bcrypt.compare(refreshToken, session.refreshTokenHash);

    if (!isMatch) {
        return res.status(401).json({
            message: "Invalid refresh token"
        });
    }

    const accessToken = jwt.sign({
        id: decoded.id,
        sessionId: session._id
    }, config.JWT_SECRET,
        {
            expiresIn: "15m"
        }
    );

    const newRefreshToken = jwt.sign({
        id: decoded.id,
        sessionId: session._id
    }, config.JWT_SECRET,
        {
            expiresIn: "7d"
        }
    );

    const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 10);

    session.refreshTokenHash = newRefreshTokenHash;
    await session.save();

    res.cookie("refreshToken", newRefreshToken, cookieOptions());

    return res.status(200).json({
        message: "Access token refreshed successfully",
        accessToken
    });
}
export async function logout(req, res) {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.status(401).json({
            message: "Refresh token not found"
        });
    };

    let decoded;
    try {
        decoded = jwt.verify(refreshToken, config.JWT_SECRET);
    } catch (err) {
        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }

    const session = await sessionModel.findOne({
        _id: decoded.sessionId,
        user: decoded.id,
        revoked: false
    });

    if (!session) {
        return res.status(401).json({
            message: "Session not found"
        });
    };

    const isRefreshTokenValid = await bcrypt.compare(refreshToken, session.refreshTokenHash);

    if (!isRefreshTokenValid) {
        return res.status(401).json({
            message: "Invalid refresh token"
        });
    }

    session.revoked = true;
    await session.save();

    res.clearCookie("refreshToken", cookieOptions());

    return res.status(200).json({
        message: "Logged out successfully"
    });
}

export async function logoutAll(req, res) {

    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.status(401).json({
            message: "Refresh token not found"
        });
    };

    let decoded;
    try {
        decoded = jwt.verify(refreshToken, config.JWT_SECRET);
    } catch (err) {
        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }

    const sessions = await sessionModel.updateMany({
        user: decoded.id,
        revoked: false
    }, {
        $set: { revoked: true }
    });

    if (!sessions.matchedCount) {
        return res.status(401).json({
            message: "No active sessions found"
        });
    };

    res.clearCookie("refreshToken", cookieOptions());

    return res.status(200).json({
        message: "Logged out from all sessions successfully"
    });

}

export async function verifyEmail(req, res) {
    const email = normalizeEmail(req.body.email);
    const otp = req.body.otp?.trim();

    if (!email || !otp) {
        return res.status(400).json({
            message: "Email and OTP are required"
        });
    }

    const otpDoc = await otpModel.findOne({ email }).sort({ createdAt: -1 });

    if (!otpDoc) {
        return res.status(404).json({
            message: "OTP not found"
        });
    }

    if (otpDoc.expiresAt < new Date()) {
        await otpModel.deleteMany({ user: otpDoc.user });
        return res.status(400).json({
            message: "OTP expired"
        });
    }

    const isMatch = await bcrypt.compare(otp, otpDoc.otpHash);

    if (!isMatch) {
        return res.status(400).json({
            message: "Invalid OTP"
        });
    }

    const user = await userModel.findByIdAndUpdate(otpDoc.user,
        { verified: true }, { new: true })

    if (!user) {
        return res.status(404).json({
            message: "User not found"
        });
    }
    await otpModel.deleteMany({ user: otpDoc.user });
 

    return res.status(200).json({
        message: "Email verified successfully",
        user: {
            username: user.username,
            email: user.email,
            verified: user.verified
        }
    });

}

export async function getSessions(req, res) {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.status(401).json({
            message: "Refresh token not found"
        });
    }

    let decoded;
    try {
        decoded = jwt.verify(refreshToken, config.JWT_SECRET);
    } catch (err) {
        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }

    const sessions = await sessionModel
        .find({
            user: decoded.id,
            revoked: false
        })
        .sort({ updatedAt: -1 });

    return res.status(200).json({
        message: "Sessions fetched successfully",
        sessions: sessions.map((session) => ({
            id: session._id,
            device: session.userAgent || "Unknown device",
            location: session.ip || "Unknown location",
            lastSeen: session.updatedAt,
            current: String(session._id) === String(decoded.sessionId)
        }))
    });
}

export async function revokeSession(req, res) {
    const refreshToken = req.cookies.refreshToken;
    const { sessionId } = req.body;

    if (!refreshToken) {
        return res.status(401).json({
            message: "Refresh token not found"
        });
    }
    if (!sessionId) {
        return res.status(400).json({
            message: "sessionId is required"
        });
    }

    let decoded;
    try {
        decoded = jwt.verify(refreshToken, config.JWT_SECRET);
    } catch (err) {
        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }

    if (String(decoded.sessionId) === String(sessionId)) {
        return res.status(400).json({
            message: "Use logout for current session"
        });
    }

    const session = await sessionModel.findOne({
        _id: sessionId,
        user: decoded.id,
        revoked: false
    });

    if (!session) {
        return res.status(404).json({
            message: "Session not found"
        });
    }

    session.revoked = true;
    await session.save();

    return res.status(200).json({
        message: "Session revoked successfully"
    });
}
