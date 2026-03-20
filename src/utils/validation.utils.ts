import type { ZodSchema } from "zod";
import { err, ok, type Result } from "../types/result.types.js";

export function parseWithSchema<T>(
    schema: ZodSchema<T>,
    value: unknown,
    message: string = "Validation failed"
): Result<T> {
    const parsed = schema.safeParse(value);
    if (!parsed.success) {
        return err({
            code: "VALIDATION_ERROR",
            message,
            status: 400
        });
    }
    return ok(parsed.data);
}
