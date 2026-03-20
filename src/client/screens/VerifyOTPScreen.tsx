import type { JSX, RefObject } from "react";
import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { StatusBanner } from "../components/common/StatusBanner.js";
import { useOtpTimer } from "../hooks/useOtpTimer.js";
import type { StatusBannerState } from "../types/ui.types.js";

interface VerifyOTPScreenProps {
    email: string;
    onVerified: (otp: string) => Promise<{
        ok: boolean;
        message?: string;
        code?: string;
    }>;
    onGoLogin: () => void;
}

function createOtpRefs(): RefObject<HTMLInputElement>[] {
    return Array.from({ length: 6 }, () => useRef<HTMLInputElement>(null));
}

export function VerifyOTPScreen({ email, onVerified, onGoLogin }: VerifyOTPScreenProps): JSX.Element {
    const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
    const [status, setStatus] = useState<StatusBannerState | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [resent, setResent] = useState<boolean>(false);
    const refs = createOtpRefs();
    const { seconds, setSeconds, isExpired, formatted } = useOtpTimer(300);

    const filledCount = useMemo(() => otp.join("").length, [otp]);

    const handleOtpChange = (index: number, value: string): void => {
        if (!/^\d?$/.test(value)) return;
        const next = [...otp];
        next[index] = value;
        setOtp(next);
        if (value && index < 5) refs[index + 1]?.current?.focus();
    };

    const handleKeyDown = (index: number, key: string): void => {
        if (key === "Backspace" && !otp[index] && index > 0) refs[index - 1]?.current?.focus();
    };

    const onOtpChange = (index: number) => (event: ChangeEvent<HTMLInputElement>): void => {
        handleOtpChange(index, event.target.value);
    };

    const handleVerify = async (): Promise<void> => {
        const code = otp.join("");
        if (code.length < 6) return;

        if (isExpired) {
            setStatus({
                type: "error",
                code: "OTP_EXPIRED",
                message: "This code has expired. Please request a new one."
            });
            return;
        }

        setLoading(true);
        const result = await onVerified(code);
        setLoading(false);
        if (!result.ok) {
            setStatus({
                type: "error",
                code: result.code ?? "OTP_INVALID",
                message: result.message ?? "Invalid OTP"
            });
            setOtp(["", "", "", "", "", ""]);
            refs[0]?.current?.focus();
        }
    };

    const handleResend = (): void => {
        setSeconds(300);
        setResent(true);
        setOtp(["", "", "", "", "", ""]);
        setStatus({
            type: "info",
            code: "OTP_SENT",
            message: `A new code has been sent to ${email}`
        });
        refs[0]?.current?.focus();
        setTimeout(() => setResent(false), 30000);
    };

    return (
        <div className="auth-shell">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="wordmark"><span className="wordmark-dot" /> Vault</div>
                    <h1 className="auth-title">Check your email</h1>
                    <p className="auth-subtitle">
                        We sent a 6-digit code to <span style={{ color: "var(--accent-bright)" }}>{email}</span>.
                        Enter it below to verify your address.
                    </p>
                </div>
                <div className="auth-body">
                    {status ? <StatusBanner {...status} /> : null}
                    <div className="field">
                        <div className="otp-grid">
                            {otp.map((value, i) => (
                                <input
                                    key={i}
                                    ref={refs[i]}
                                    className={`otp-input ${value ? "otp-filled" : ""}`}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={value}
                                    onChange={onOtpChange(i)}
                                    onKeyDown={(e) => handleKeyDown(i, e.key)}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="timer-row">
                        <span className="timer-text">{isExpired ? "Code has expired" : "Code expires in"}</span>
                        <span className={`timer-badge ${isExpired ? "expired" : ""}`}>
                            {isExpired ? "00:00" : formatted}
                        </span>
                    </div>
                    <button className="btn-primary" onClick={handleVerify} disabled={loading || filledCount < 6}>
                        {loading ? "Verifying..." : "Verify email"}
                    </button>
                    <div className="divider">
                        <div className="divider-line" />
                        <span className="divider-text">or</span>
                        <div className="divider-line" />
                    </div>
                    <button className="btn-ghost" onClick={handleResend} disabled={resent}>
                        {resent ? "Code resent" : "Resend code"}
                    </button>
                </div>
                <div className="auth-footer">
                    <p className="footer-text">
                        Wrong address?
                        <button className="btn-link" onClick={onGoLogin}>Back to login</button>
                    </p>
                </div>
            </div>
        </div>
    );
}
