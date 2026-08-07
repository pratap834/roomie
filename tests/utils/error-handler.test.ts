import { describe, it, expect } from "vitest";
import { ZodError, z } from "zod";
import { handleApiError, formatZodError } from "@/utils/error-handler";
import { ok, created, badRequest, notFound, forbidden, conflict, unauthorized } from "@/utils/api-response";

describe("API Response Helpers", () => {
  it("ok returns 200 JSON payload", async () => {
    const res = ok({ id: "123" }, "Success");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({
      success: true,
      message: "Success",
      data: { id: "123" },
    });
  });

  it("created returns 201 JSON payload", async () => {
    const res = created({ id: "456" });
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it("badRequest returns 400 with code", async () => {
    const res = badRequest("Invalid time");
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.code).toBe("BAD_REQUEST");
  });

  it("notFound returns 404 with code", async () => {
    const res = notFound("Room not found");
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.code).toBe("NOT_FOUND");
  });
});

describe("Error Handler", () => {
  it("maps known error message to typed response", async () => {
    const res = handleApiError(new Error("ROOM_NOT_FOUND"));
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Room not found");
  });

  it("handles ZodError validation issues", async () => {
    const schema = z.object({ title: z.string().min(5) });
    let zodError: ZodError | null = null;
    try {
      schema.parse({ title: "abc" });
    } catch (err) {
      if (err instanceof ZodError) zodError = err;
    }
    expect(zodError).not.toBeNull();
    const res = handleApiError(zodError!);
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.code).toBe("VALIDATION_ERROR");
    expect(json.details.title).toBeDefined();
  });
});
