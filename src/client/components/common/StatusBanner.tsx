import type { JSX } from "react";
import type { StatusBannerState } from "../../types/ui.types.js";

interface StatusBannerProps extends StatusBannerState {}

export function StatusBanner({ type, code, message }: StatusBannerProps): JSX.Element | null {
    if (!message) return null;

    return (
        <div className={`status-banner ${type}`}>
            {code ? <span className="status-code">{code}</span> : null}
            <span>{message}</span>
        </div>
    );
}
