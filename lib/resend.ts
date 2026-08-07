import { Resend } from "resend";
import { env } from "@/lib/env";

const globalForResend = globalThis as unknown as {
  resend: Resend | undefined;
};

export const resend: Resend =
  globalForResend.resend ?? new Resend(env.RESEND_API_KEY);

if (process.env.NODE_ENV !== "production") {
  globalForResend.resend = resend;
}

export const emailDefaults = {
  from: `${env.RESEND_FROM_NAME} <${env.RESEND_FROM_EMAIL}>`,
} as const;
