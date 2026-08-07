import { NextResponse } from "next/server";
import type { ApiSuccess, ApiError, PaginatedResult, PaginationMeta } from "@/types";

// ─────────────────────────────────────────────────────────────
// Success responses
// ─────────────────────────────────────────────────────────────

export function ok<T>(data: T, message?: string, status = 200): NextResponse<ApiSuccess<T>> {
  const body: ApiSuccess<T> = { success: true, data };
  if (message) body.message = message;
  return NextResponse.json(body, { status });
}

export function created<T>(data: T, message?: string): NextResponse<ApiSuccess<T>> {
  return ok(data, message, 201);
}

export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

export function paginated<T>(
  items: T[],
  meta: PaginationMeta,
): NextResponse<ApiSuccess<PaginatedResult<T>>> {
  return ok<PaginatedResult<T>>({ items, meta });
}

// ─────────────────────────────────────────────────────────────
// Error responses
// ─────────────────────────────────────────────────────────────

export function badRequest(
  error: string,
  details?: Record<string, string[]>,
): NextResponse<ApiError> {
  return NextResponse.json(
    { success: false, error, code: "BAD_REQUEST", details },
    { status: 400 },
  );
}

export function unauthorized(error = "Authentication required"): NextResponse<ApiError> {
  return NextResponse.json(
    { success: false, error, code: "UNAUTHORIZED" },
    { status: 401 },
  );
}

export function forbidden(error = "Insufficient permissions"): NextResponse<ApiError> {
  return NextResponse.json(
    { success: false, error, code: "FORBIDDEN" },
    { status: 403 },
  );
}

export function notFound(error = "Resource not found"): NextResponse<ApiError> {
  return NextResponse.json(
    { success: false, error, code: "NOT_FOUND" },
    { status: 404 },
  );
}

export function conflict(error: string): NextResponse<ApiError> {
  return NextResponse.json(
    { success: false, error, code: "CONFLICT" },
    { status: 409 },
  );
}

export function validationError(
  error: string,
  details?: Record<string, string[]>,
): NextResponse<ApiError> {
  return NextResponse.json(
    { success: false, error, code: "VALIDATION_ERROR", details },
    { status: 422 },
  );
}

export function internalError(error = "An unexpected error occurred"): NextResponse<ApiError> {
  return NextResponse.json(
    { success: false, error, code: "INTERNAL_ERROR" },
    { status: 500 },
  );
}

// ─────────────────────────────────────────────────────────────
// Pagination helpers
// ─────────────────────────────────────────────────────────────

export function buildPaginationMeta(
  total: number,
  page: number,
  pageSize: number,
): PaginationMeta {
  return {
    total,
    page,
    pageSize,
    pageCount: Math.ceil(total / pageSize),
  };
}

export function parsePaginationParams(searchParams: URLSearchParams): {
  page: number;
  pageSize: number;
  skip: number;
} {
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10)),
  );
  return { page, pageSize, skip: (page - 1) * pageSize };
}
