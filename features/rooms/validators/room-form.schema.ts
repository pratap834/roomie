import { z } from "zod";

import { createRoomSchema } from "@/validators/room.validator";

/**
 * HTML inputs emit empty strings for untouched optional fields, but the
 * shared backend schema expects `undefined` for a truly-omitted value (and
 * requires `imageUrl` to be a valid URL when present). This wraps the
 * canonical `createRoomSchema` — the single source of truth for room
 * validation rules — and only normalizes that browser-specific empty-string
 * quirk before delegating to it.
 */
export const roomFormSchema = createRoomSchema.extend({
  description: z.preprocess(
    (val) => (val === "" ? undefined : val),
    createRoomSchema.shape.description,
  ),
  building: z.preprocess(
    (val) => (val === "" ? undefined : val),
    createRoomSchema.shape.building,
  ),
  imageUrl: z.preprocess(
    (val) => (val === "" ? undefined : val),
    createRoomSchema.shape.imageUrl,
  ),
});
