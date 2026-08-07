import type { ApiResponse } from "@/types";

export class ApiClientError extends Error {
  code: string;
  details?: Record<string, string[]>;
  status: number;

  constructor(message: string, code: string, status: number, details?: Record<string, string[]>) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

/**
 * Thin fetch wrapper around the internal Next.js API routes.
 * Unwraps the ApiResponse envelope and throws ApiClientError on failure.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options;

  const response = await fetch(path, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let payload: ApiResponse<T>;
  try {
    payload = await response.json();
  } catch {
    throw new ApiClientError("Unexpected server response", "INTERNAL_ERROR", response.status);
  }

  if (!payload.success) {
    throw new ApiClientError(payload.error, payload.code, response.status, payload.details);
  }

  return payload.data;
}

export function buildQueryString(params: object): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params as Record<string, unknown>)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}
