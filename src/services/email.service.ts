import nodemailer from "nodemailer";
import config from "../config/config.js";
import { err, ok, type Result } from "../types/result.types.js";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        type: "OAuth2",
        user: config.GOOGLE_USER,
        clientId: config.GOOGLE_CLIENT_ID,
        clientSecret: config.GOOGLE_CLIENT_SECRET,
        refreshToken: config.GOOGLE_REFRESH_TOKEN
    }
});

export async function sendEmail(
    to: string,
    subject: string,
    text: string,
    html: string
): Promise<Result<{ messageId: string }>> {
    try {
        const info = await transporter.sendMail({
            from: config.GOOGLE_USER,
            to,
            subject,
            text,
            html
        });
        return ok({ messageId: info.messageId });
    } catch {
        return err({
            code: "EMAIL_SEND_FAILED",
            message: "Failed to send email",
            status: 502
        });
    }
}
