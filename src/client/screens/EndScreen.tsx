import type { JSX } from "react";
import type { EndScreenType } from "../types/ui.types.js";

interface EndScreenProps {
    type: EndScreenType;
    onRestart: () => void;
}

interface EndScreenConfig {
    iconClass: "success" | "warning" | "error";
    iconColor: string;
    title: string;
    desc: string;
    code: string;
}

const configs: Record<EndScreenType, EndScreenConfig> = {
    logout: {
        iconClass: "success",
        iconColor: "#82b592",
        title: "Signed out",
        desc: "Your session has been terminated. Your refresh token has been revoked and all cookies cleared.",
        code: "SESSION_REVOKED"
    },
    "logout-all": {
        iconClass: "warning",
        iconColor: "#c4a058",
        title: "All sessions revoked",
        desc: "You've been signed out from every device. All active refresh tokens have been invalidated.",
        code: "ALL_SESSIONS_REVOKED"
    },
    expired: {
        iconClass: "error",
        iconColor: "#d4897a",
        title: "Session expired",
        desc: "Your session has expired and could not be refreshed automatically. Please sign in again.",
        code: "SESSION_EXPIRED"
    }
};

const iconPaths: Record<EndScreenConfig["iconClass"], string> = {
    success: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    warning: "M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z",
    error: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
};

export function EndScreen({ type, onRestart }: EndScreenProps): JSX.Element {
    const config = configs[type];

    return (
        <div className="logout-screen">
            <div className="logout-card">
                <div className={`logout-icon ${config.iconClass}`}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={config.iconColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d={iconPaths[config.iconClass]} />
                    </svg>
                </div>
                <div>
                    <div className="logout-title">{config.title}</div>
                    <div style={{ marginTop: 6 }}>
                        <span style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-secondary)", fontWeight: 500 }}>
                            {config.code}
                        </span>
                    </div>
                </div>
                <p className="logout-desc">{config.desc}</p>
                <button className="btn-primary" style={{ width: "100%" }} onClick={onRestart}>
                    Back to login
                </button>
            </div>
        </div>
    );
}
