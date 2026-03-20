export function generateSixDigitCode(): string {
    const value = Math.floor(100000 + Math.random() * 900000);
    return value.toString();
}
