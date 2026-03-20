import type { JSX } from "react";
import { useState, type ChangeEvent } from "react";
import { StatusBanner } from "../components/common/StatusBanner.js";
import { usePasswordStrength } from "../hooks/usePasswordStrength.js";
import type { StatusBannerState } from "../types/ui.types.js";

interface RegisterScreenProps {
    onGoLogin: () => void;
    onRegistered: (email: string, password: string) => Promise<{
        ok: boolean;
        message?: string;
        code?: string;
    }>;
}

interface RegisterErrors {
    email?: string;
    password?: string;
    confirm?: string;
}

const strengthClasses: Array<"" | "weak" | "fair" | "good" | "strong"> = ["", "weak", "fair", "good", "strong"];

export function RegisterScreen({ onGoLogin, onRegistered }: RegisterScreenProps): JSX.Element {
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [confirm, setConfirm] = useState<string>("");
    const [showPw, setShowPw] = useState<boolean>(false);
    const [errors, setErrors] = useState<RegisterErrors>({});
    const [status, setStatus] = useState<StatusBannerState | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const strength = usePasswordStrength(password);

    const validate = (): boolean => {
        const nextErrors: RegisterErrors = {};
        if (!email.trim()) nextErrors.email = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(email)) nextErrors.email = "Enter a valid email";
        if (!password) nextErrors.password = "Password is required";
        else if (password.length < 8) nextErrors.password = "Minimum 8 characters";
        if (password && confirm !== password) nextErrors.confirm = "Passwords do not match";
        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = async (): Promise<void> => {
        if (!validate()) return;
        setLoading(true);
        const result = await onRegistered(email, password);
        setLoading(false);
        if (!result.ok) {
            setStatus({
                type: "error",
                code: result.code ?? "REGISTER_FAILED",
                message: result.message ?? "Unable to register"
            });
        }
    };

    const onEmailChange = (event: ChangeEvent<HTMLInputElement>): void => {
        setEmail(event.target.value);
        setErrors((prev) => ({ ...prev, email: "" }));
    };

    const onPasswordChange = (event: ChangeEvent<HTMLInputElement>): void => {
        setPassword(event.target.value);
        setErrors((prev) => ({ ...prev, password: "" }));
    };

    const onConfirmChange = (event: ChangeEvent<HTMLInputElement>): void => {
        setConfirm(event.target.value);
        setErrors((prev) => ({ ...prev, confirm: "" }));
    };

    return (
        <div className="auth-shell">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="wordmark"><span className="wordmark-dot" /> Vault</div>
                    <h1 className="auth-title">Create account</h1>
                    <p className="auth-subtitle">Register to get started. You'll verify your email after.</p>
                </div>
                <div className="auth-body">
                    {status ? <StatusBanner {...status} /> : null}
                    <div className="field">
                        <label className="field-label">Email address</label>
                        <input
                            className={`field-input ${errors.email ? "error-field" : ""}`}
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={onEmailChange}
                        />
                        {errors.email ? <span className="field-error">{errors.email}</span> : null}
                    </div>
                    <div className="field">
                        <label className="field-label">Password</label>
                        <div className="password-toggle">
                            <input
                                className={`field-input ${errors.password ? "error-field" : ""}`}
                                type={showPw ? "text" : "password"}
                                placeholder="Min. 8 characters"
                                value={password}
                                onChange={onPasswordChange}
                            />
                            <button className="password-toggle-btn" onClick={() => setShowPw((prev) => !prev)}>
                                {showPw ? "hide" : "show"}
                            </button>
                        </div>
                        {password ? (
                            <>
                                <div className="strength-bar">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div
                                            key={i}
                                            className={`strength-seg ${i <= strength.level ? strengthClasses[strength.level] : ""}`}
                                        />
                                    ))}
                                </div>
                                {strength.label ? (
                                    <span className={`strength-label ${strength.label}`}>{strength.label}</span>
                                ) : null}
                            </>
                        ) : null}
                        {errors.password ? <span className="field-error">{errors.password}</span> : null}
                    </div>
                    <div className="field">
                        <label className="field-label">Confirm password</label>
                        <input
                            className={`field-input ${errors.confirm ? "error-field" : ""}`}
                            type={showPw ? "text" : "password"}
                            placeholder="Repeat password"
                            value={confirm}
                            onChange={onConfirmChange}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleSubmit();
                            }}
                        />
                        {errors.confirm ? <span className="field-error">{errors.confirm}</span> : null}
                    </div>
                    <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
                        {loading ? "Creating account..." : "Register"}
                    </button>
                </div>
                <div className="auth-footer">
                    <p className="footer-text">
                        Already registered?
                        <button className="btn-link" onClick={onGoLogin}>Sign in</button>
                    </p>
                </div>
            </div>
        </div>
    );
}
