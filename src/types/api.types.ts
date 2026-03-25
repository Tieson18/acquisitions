/** Generic successful API response envelope. */
export interface ApiResponse<T = unknown> {
  message: string;
  data?: T;
}

/** Generic API error shape. */
export interface ApiError {
  error: string;
  details?: string;
}

/**
 * Minimal shape of a Zod validation error object used by formatValidationError.
 * Mirrors the subset of ZodError that the utility actually reads.
 */
export interface ValidationErrorShape {
  issues?: ReadonlyArray<{ message: string }>;
}
