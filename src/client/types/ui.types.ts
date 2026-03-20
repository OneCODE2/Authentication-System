export type BannerType = "error" | "success" | "warning" | "info";

export interface StatusBannerState {
    type: BannerType;
    code?: string;
    message: string;
}

export interface DashboardUser {
    email: string;
    name: string;
    role: string;
    lastLogin: string;
}

export type EndScreenType = "logout" | "logout-all" | "expired";

export type AuthScreen = "login" | "register" | "verify-otp" | "dashboard" | "end";
