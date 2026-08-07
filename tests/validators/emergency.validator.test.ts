import { describe, it, expect } from "vitest";
import {
  createEmergencyRequestSchema,
  resolveEmergencyRequestSchema,
  adminEmergencyDecisionSchema,
} from "@/validators/emergency.validator";
import { EmergencyAction, EmergencyPriority } from "@prisma/client";

describe("Emergency Request Validators", () => {
  const validUUID1 = "123e4567-e89b-12d3-a456-426614174000";
  const validUUID2 = "987e6543-e21b-12d3-a456-426614174999";

  it("validates createEmergencyRequestSchema input", () => {
    const input = {
      bookingId: validUUID1,
      subject: "Critical Client Incident Response",
      reason: "Need conference room immediately for war room session with C-suite",
      department: "Engineering",
      priority: EmergencyPriority.HIGH,
    };

    const parsed = createEmergencyRequestSchema.safeParse(input);
    expect(parsed.success).toBe(true);
  });

  it("rejects createEmergencyRequestSchema if reason is too short", () => {
    const input = {
      bookingId: validUUID1,
      subject: "Emergency",
      reason: "Short",
    };

    const parsed = createEmergencyRequestSchema.safeParse(input);
    expect(parsed.success).toBe(false);
  });

  it("validates discriminated union for resolveEmergencyRequestSchema - KEEP_BOOKING", () => {
    const input = {
      action: EmergencyAction.KEEP_BOOKING,
      note: "Client meeting cannot be moved",
    };

    const parsed = resolveEmergencyRequestSchema.safeParse(input);
    expect(parsed.success).toBe(true);
  });

  it("validates discriminated union for resolveEmergencyRequestSchema - ROOM_TRANSFER", () => {
    const input = {
      action: EmergencyAction.ROOM_TRANSFER,
      targetRoomId: validUUID2,
      note: "Transferred meeting to Room 302",
    };

    const parsed = resolveEmergencyRequestSchema.safeParse(input);
    expect(parsed.success).toBe(true);
  });

  it("rejects ROOM_TRANSFER if targetRoomId is missing or invalid UUID", () => {
    const input = {
      action: EmergencyAction.ROOM_TRANSFER,
      targetRoomId: "invalid-uuid",
    };

    const parsed = resolveEmergencyRequestSchema.safeParse(input);
    expect(parsed.success).toBe(false);
  });

  it("validates adminEmergencyDecisionSchema", () => {
    expect(
      adminEmergencyDecisionSchema.safeParse({
        decision: "APPROVE",
        resolution: "Admin approved request due to executive priority",
      }).success,
    ).toBe(true);

    expect(
      adminEmergencyDecisionSchema.safeParse({
        decision: "INVALID",
      }).success,
    ).toBe(false);
  });
});
