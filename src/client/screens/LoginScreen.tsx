import type { JSX } from "react";
import { useState, type ChangeEvent } from "react";
import { StatusBanner } from "../components/common/StatusBanner.js";
import type { StatusBannerState } from "../types/ui.types.js";

interface LoginScreenProps {
    onLogin: (email: string, password: string) => Promise<{
        ok: boolean;
        message?: string;
        code?: string;
    }>;
    onGoRegister: () => void;
}

interface LoginErrors {
    email?: string;
    password?: string;
}

export function LoginScreen({ onLogin, onGoRegister }: LoginScreenProps): JSX.Element {
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [showPw, setShowPw] = useState<boolean>(false);
    const [errors, setErrors] = useState<LoginErrors>({});
    const [status, setStatus] = useState<StatusBannerState | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    const validate = (): boolean => {
        const nextErrors: LoginErrors = {};
        if (!email.trim()) nextErrors.email = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(email)) nextErrors.email = "Enter a valid email";
        if (!password) nextErrors.password = "Password is required";
        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = async (): Promise<void> => {
        if (!validate()) return;
        setLoading(true);
        setStatus(null);
        const result = await onLogin(email, password);
        setLoading(false);
        if (!result.ok) {
            setStatus({
                type: result.code === "EMAIL_NOT_VERIFIED" ? "warning" : "error",
                code: result.code ?? "AUTH_FAILED",
                message: result.message ?? "Login failed"
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

    return (
        <div className="auth-shell">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="wordmark"><span className="wordmark-dot" /> Vault</div>
                    <h1 className="auth-title">Sign in</h1>
                    <p className="auth-subtitle">Enter your credentials to access your account</p>
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
                                placeholder="••••••••"
                                value={password}
                                onChange={onPasswordChange}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSubmit();
                                }}
                            />
                            <button className="password-toggle-btn" onClick={() => setShowPw((prev) => !prev)}>
                                {showPw ? "hide" : "show"}
                            </button>
                        </div>
                        {errors.password ? <span className="field-error">{errors.password}</span> : null}
                    </div>
                    <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
                        {loading ? "Authenticating..." : "Continue"}
                    </button>
                </div>
                <div className="auth-footer">
                    <p className="footer-text">
                        No account?
                        <button className="btn-link" onClick={onGoRegister}>Create one</button>
                    </p>
                </div>
            </div>
        </div>
    );
}
