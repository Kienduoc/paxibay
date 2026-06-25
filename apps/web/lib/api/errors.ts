import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "QUOTA_EXCEEDED"
  | "RATE_LIMIT"
  | "EXTERNAL_API_ERROR"
  | "MANIFEST_INVALID"
  | "RENDER_TIMEOUT"
  | "INTERNAL";

const STATUS_MAP: Record<ApiErrorCode, number> = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 400,
  QUOTA_EXCEEDED: 402,
  RATE_LIMIT: 429,
  EXTERNAL_API_ERROR: 502,
  MANIFEST_INVALID: 400,
  RENDER_TIMEOUT: 504,
  INTERNAL: 500,
};

export function apiError(
  code: ApiErrorCode,
  message: string,
  details?: Record<string, unknown>,
): NextResponse {
  return NextResponse.json(
    { error: code, message, ...(details ? { details } : {}) },
    { status: STATUS_MAP[code] },
  );
}

export class ApiException extends Error {
  constructor(
    public code: ApiErrorCode,
    message: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
  }
}

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ApiException) {
    return apiError(error.code, error.message, error.details);
  }
  if (error instanceof Error) {
    console.error("[api]", error);
    return apiError("INTERNAL", error.message);
  }
  return apiError("INTERNAL", "Unknown error");
}
