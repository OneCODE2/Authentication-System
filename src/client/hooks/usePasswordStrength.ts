export interface PasswordStrength {
    level: number;
    label: "" | "weak" | "fair" | "good" | "strong";
}

export function usePasswordStrength(password: string): PasswordStrength {
    if (!password) {
        return { level: 0, label: "" };
    }

    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password) && /[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const labels: PasswordStrength["label"][] = ["", "weak", "fair", "good", "strong"];
    return { level: score, label: labels[score] ?? "" };
}
