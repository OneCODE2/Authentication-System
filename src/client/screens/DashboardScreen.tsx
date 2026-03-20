import type { JSX } from "react";
import { useEffect, useMemo, useState } from "react";
import { StatusBanner } from "../components/common/StatusBanner.js";
import type { DashboardUser, StatusBannerState } from "../types/ui.types.js";

export interface SessionItem {
    id: string;
    device: string;
    location: string;
    time: string;
    current: boolean;
}

interface DashboardScreenProps {
    user: DashboardUser;
    sessions: SessionItem[];
    onLogout: () => Promise<void>;
    onLogoutAll: () => Promise<void>;
    onRefreshToken: () => Promise<void>;
    onGetMe: () => Promise<{ ok: boolean; message?: string }>;
    onRevokeSession: (sessionId: string) => Promise<void>;
}

export function DashboardScreen({
    user,
    sessions,
    onLogout,
    onLogoutAll,
    onRefreshToken,
    onGetMe,
    onRevokeSession
}: DashboardScreenProps): JSX.Element {
    const [tokenLife, setTokenLife] = useState<number>(100);
    const [refreshCount, setRefreshCount] = useState<number>(0);
    const [lastRefresh, setLastRefresh] = useState<string>("just now");
    const [status, setStatus] = useState<StatusBannerState | null>(null);
    const [meCheckAt, setMeCheckAt] = useState<string>("");
    const [meLoading, setMeLoading] = useState<boolean>(false);
    const [meError, setMeError] = useState<string>("");

    useEffect(() => {
        const interval = setInterval(() => {
            setTokenLife((current) => {
                if (current <= 5) {
                    clearInterval(interval);
                    setStatus({
                        type: "warning",
                        code: "TOKEN_EXPIRING",
                        message: "Access token expiring. Refreshing in background..."
                    });
                    void (async () => {
                        await onRefreshToken();
                        setTokenLife(100);
                        setRefreshCount((count) => count + 1);
                        setLastRefresh("just now");
                        setStatus({
                            type: "success",
                            code: "TOKEN_REFRESHED",
                            message: "Access token rotated successfully."
                        });
                        setTimeout(() => setStatus(null), 3000);
                    })();
                    return current;
                }
                return current - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [refreshCount, onRefreshToken]);

    const initials = useMemo(
        () => user.name.split(" ").map((part) => part[0]).join("").toUpperCase(),
        [user.name]
    );

    const isLow = tokenLife < 20;

    return (
        <div className="dashboard-shell">
            <div className="dash-topbar">
                <div className="wordmark" style={{ fontSize: 16 }}>
                    <span className="wordmark-dot" /> Vault
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{user.email}</span>
                    <div style={{
                        width: 30,
                        height: 30,
                        borderRadius: "50%",
                        background: "var(--accent-subtle)",
                        border: "1px solid var(--accent-border)",
                        display: "grid",
                        placeItems: "center",
                        fontFamily: "var(--font-serif)",
                        fontSize: 13,
                        color: "var(--accent-bright)"
                    }}>
                        {initials}
                    </div>
                </div>
            </div>

            <div style={{ padding: "1rem 1rem 0", maxWidth: 900, width: "100%", margin: "0 auto" }}>
                {status ? <StatusBanner {...status} /> : null}
            </div>

            <div className="dash-content">
                <div className="dash-card">
                    <div className="card-header">
                        <span className="card-title">Profile</span>
                        <span className="card-badge">Verified</span>
                    </div>
                    <div className="card-body">
                        <div className="profile-row">
                            <div className="profile-avatar">{initials}</div>
                            <div>
                                <div className="profile-name">{user.name}</div>
                                <div className="profile-email">{user.email}</div>
                            </div>
                        </div>
                        <div className="meta-grid">
                            <div className="meta-row"><span className="meta-key">Role</span><span className="meta-val accent">{user.role}</span></div>
                            <div className="meta-row"><span className="meta-key">Last login</span><span className="meta-val">{user.lastLogin}</span></div>
                            <div className="meta-row"><span className="meta-key">Email status</span><span className="meta-val success">verified</span></div>
                            <div className="meta-row"><span className="meta-key">2FA</span><span className="meta-val error">not enabled</span></div>
                        </div>
                    </div>
                </div>

                <div className="dash-card">
                    <div className="card-header">
                        <span className="card-title">Token Status</span>
                        <span className={`card-badge ${isLow ? "warning" : ""}`}>{isLow ? "Refreshing" : "Active"}</span>
                    </div>
                    <div className="card-body">
                        <div className="token-bar">
                            <div>
                                <div className="token-label">Access token</div>
                                <div className="token-progress">
                                    <div className={`token-progress-fill ${isLow ? "low" : ""}`} style={{ width: `${tokenLife}%` }} />
                                </div>
                            </div>
                            <span className="token-value">{tokenLife}%</span>
                        </div>
                        <div className="meta-grid">
                            <div className="meta-row"><span className="meta-key">Type</span><span className="meta-val">Bearer JWT</span></div>
                            <div className="meta-row"><span className="meta-key">Refresh token</span><span className="meta-val success">HTTP-only cookie</span></div>
                            <div className="meta-row"><span className="meta-key">Rotations</span><span className="meta-val accent">{refreshCount}</span></div>
                            <div className="meta-row"><span className="meta-key">Last refresh</span><span className="meta-val">{lastRefresh}</span></div>
                        </div>
                        <button
                            className="btn-ghost"
                            onClick={async () => {
                                setMeLoading(true);
                                setMeError("");
                                const result = await onGetMe();
                                setMeLoading(false);
                                if (!result.ok) {
                                    setMeError(result.message ?? "Unable to verify identity");
                                    return;
                                }
                                setMeCheckAt(new Date().toLocaleTimeString());
                            }}
                        >
                            {meLoading ? "Verifying identity..." : "Verify Identity"}
                        </button>
                        {meError ? (
                            <div className="status-banner error">
                                <span className="status-code">GET_ME_FAILED</span>
                                <span>{meError}</span>
                            </div>
                        ) : null}
                        {meCheckAt ? (
                            <div className="status-banner success">
                                <span className="status-code">IDENTITY_SYNCED</span>
                                <span>{user.name} ({user.email}) confirmed at {meCheckAt}</span>
                            </div>
                        ) : null}
                    </div>
                </div>

                <div className="dash-card span-full">
                    <div className="card-header">
                        <span className="card-title">Active Sessions - {sessions.length}</span>
                    </div>
                    <div className="card-body">
                        {sessions.map((session) => (
                            <div key={session.id} className="session-item">
                                <div className={`session-dot ${session.current ? "current" : ""}`} />
                                <div>
                                    <div className="session-label">
                                        {session.device}
                                        {session.current ? <span style={{ fontSize: 10, color: "var(--accent)", marginLeft: 6 }}>current</span> : null}
                                    </div>
                                    <div className="session-sub">{session.location}</div>
                                </div>
                                <div className="session-time">
                                    {session.time}
                                    {!session.current ? (
                                        <button
                                            className="btn-link"
                                            style={{ display: "block", marginLeft: "auto", marginTop: 4 }}
                                            onClick={() => void onRevokeSession(session.id)}
                                        >
                                            Revoke
                                        </button>
                                    ) : null}
                                </div>
                            </div>
                        ))}
                        <div className="action-row" style={{ marginTop: 8 }}>
                            <button className="btn-ghost" onClick={() => void onLogout()}>Sign out</button>
                            <button className="btn-ghost danger" onClick={() => void onLogoutAll()}>Revoke all sessions</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
