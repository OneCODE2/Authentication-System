import { generateSixDigitCode } from "./number.utils.js";

export function generateOtp(): string {
    return generateSixDigitCode();
}

export function getOtpHtml(otp: string): string {
    return `
    <!DOCTYPE html>
    <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Otp Verification</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    padding: 20px;
                }
                p {
                    font-size: 16px;
                    color: #333;
                }
                b {
                    font-size: 24px;
                    color: #007BFF;
                }
            </style>
        </head>
        <body>
            <p>Your OTP for email verification is <b>${otp}</b>. It is valid for 10 minutes.</p>
        </body>
    </html>
    `;
}
