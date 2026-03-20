import type { Dispatch, SetStateAction } from "react";
import { useEffect, useMemo, useState } from "react";

export function useOtpTimer(initialSeconds: number = 300): {
    seconds: number;
    setSeconds: Dispatch<SetStateAction<number>>;
    isExpired: boolean;
    formatted: string;
} {
    const [seconds, setSeconds] = useState<number>(initialSeconds);

    useEffect(() => {
        if (seconds <= 0) return;
        const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
        return () => clearTimeout(timer);
    }, [seconds]);

    const formatted = useMemo(() => {
        const minutes = Math.floor(seconds / 60);
        const remaining = seconds % 60;
        return `${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
    }, [seconds]);

    return {
        seconds,
        setSeconds,
        isExpired: seconds <= 0,
        formatted
    };
}
