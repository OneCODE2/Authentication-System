import type { JSX } from "react";
import { useEffect, useState } from "react";
import "./styles/auth.css";
import { DashboardScreen, type SessionItem } from "./screens/DashboardScreen.js";
import { EndScreen } from "./screens/EndScreen.js";
import { LoginScreen } from "./screens/LoginScreen.js";
import { RegisterScreen } from "./screens/RegisterScreen.js";
import { VerifyOTPScreen } from "./screens/VerifyOTPScreen.js";
import {
    getMeApi,
    getSessionsApi,
    loginApi,
    logoutAllApi,
    logoutApi,
    refreshTokenApi,
    registerApi,
    revokeSessionApi,
    verifyOtpApi
} from "./services/auth.api.js";
import type { AuthScreen, DashboardUser, EndScreenType } from "./types/ui.types.js";

export default function AuthApp(): JSX.Element {
    const [screen, setScreen] = useState<AuthScreen>("login");
    const [registeredEmail, setRegisteredEmail] = useState<string>("");
    const [user, setUser] = useState<DashboardUser | null>(null);
    const [endType, setEndType] = useState<EndScreenType>("logout");
    const [accessToken, setAccessToken] = useState<string>("");
    const [sessions, setSessions] = useState<SessionItem[]>([]);
    const [booting, setBooting] = useState<boolean>(true);

    const loadSessions = async (): Promise<void> => {
        const result = await getSessionsApi();
        if (!result.ok || !result.data) {
            setSessions([]);
            return;
        }
        const mapped = result.data.sessions.map((session) => ({
            id: session.id,
            device: session.device,
            location: session.location,
            time: new Date(session.lastSeen).toLocaleString(),
            current: session.current
        }));
        setSessions(mapped);
    };

    useEffect(() => {
        void (async () => {
            const refresh = await refreshTokenApi();
            if (!refresh.ok || !refresh.data) {
                setBooting(false);
                return;
            }

            setAccessToken(refresh.data.accessToken);

            const me = await getMeApi(refresh.data.accessToken);
            if (!me.ok || !me.data) {
                setBooting(false);
                return;
            }

            setUser({
                email: me.data.user.email,
                name: me.data.user.username,
                role: "user",
                lastLogin: "active"
            });
            await loadSessions();
            setScreen("dashboard");
            setBooting(false);
        })();
    }, []);

    const onLogin = async (email: string, password: string): Promise<{
        ok: boolean;
        message?: string;
        code?: string;
    }> => {
        const result = await loginApi(email, password);
        if (!result.ok || !result.data) {
            return {
                ok: false,
                message: result.error?.message,
                code: result.status === 403 ? "EMAIL_NOT_VERIFIED" : result.error?.code
            };
        }

        const nextUser: DashboardUser = {
            email: result.data.user.email,
            name: result.data.user.username,
            role: "user",
            lastLogin: "just now"
        };
        setAccessToken(result.data.accessToken);
        setUser(nextUser);
        await loadSessions();
        setScreen("dashboard");
        return { ok: true };
    };

    const onRegistered = async (email: string, password: string): Promise<{
        ok: boolean;
        message?: string;
        code?: string;
    }> => {
        const result = await registerApi(email, password);
        if (!result.ok) {
            return {
                ok: false,
                message: result.error?.message,
                code: result.error?.code
            };
        }
        setRegisteredEmail(email);
        setScreen("verify-otp");
        return { ok: true };
    };

    const onVerified = async (otp: string): Promise<{
        ok: boolean;
        message?: string;
        code?: string;
    }> => {
        const result = await verifyOtpApi(registeredEmail, otp);
        if (!result.ok) {
            return {
                ok: false,
                message: result.error?.message,
                code: result.error?.code
            };
        }
        setScreen("login");
        return { ok: true };
    };

    const moveToEnd = (type: EndScreenType): void => {
        setEndType(type);
        setScreen("end");
    };

    const onRefreshToken = async (): Promise<void> => {
        const result = await refreshTokenApi();
        if (!result.ok || !result.data) return;
        setAccessToken(result.data.accessToken);
        await loadSessions();
    };

    const onGetMe = async (): Promise<{ ok: boolean; message?: string }> => {
        if (!accessToken) {
            return { ok: false, message: "No access token available" };
        }
        const result = await getMeApi(accessToken);
        if (!result.ok || !result.data) {
            return { ok: false, message: result.error?.message ?? "Unable to fetch profile" };
        }
        setUser((prev) => prev ? {
            ...prev,
            email: result.data.user.email,
            name: result.data.user.username
        } : prev);
        return { ok: true };
    };

    const onLogout = async (): Promise<void> => {
        await logoutApi();
        moveToEnd("logout");
    };

    const onLogoutAll = async (): Promise<void> => {
        await logoutAllApi();
        moveToEnd("logout-all");
    };

    const onRevokeSession = async (sessionId: string): Promise<void> => {
        await revokeSessionApi(sessionId);
        await loadSessions();
    };

    const onRestart = (): void => {
        setUser(null);
        setAccessToken("");
        setSessions([]);
        setScreen("login");
    };

    if (booting) {
        return (
            <div className="auth-shell">
                <div className="auth-card">
                    <div className="auth-header">
                        <div className="wordmark"><span className="wordmark-dot" /> Vault</div>
                        <h1 className="auth-title">Restoring session</h1>
                        <p className="auth-subtitle">Checking your secure session...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (screen === "login") {
        return <LoginScreen onLogin={onLogin} onGoRegister={() => setScreen("register")} />;
    }

    if (screen === "register") {
        return <RegisterScreen onGoLogin={() => setScreen("login")} onRegistered={onRegistered} />;
    }

    if (screen === "verify-otp") {
        return (
            <VerifyOTPScreen
                email={registeredEmail}
                onVerified={onVerified}
                onGoLogin={() => setScreen("login")}
            />
        );
    }

    if (screen === "dashboard" && user) {
        return (
            <DashboardScreen
                user={user}
                sessions={sessions}
                onLogout={onLogout}
                onLogoutAll={onLogoutAll}
                onRefreshToken={onRefreshToken}
                onGetMe={onGetMe}
                onRevokeSession={onRevokeSession}
            />
        );
    }

    return <EndScreen type={endType} onRestart={onRestart} />;
}
