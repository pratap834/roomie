import { Resend } from "resend";
import { env } from "@/lib/env";

// ─────────────────────────────────────────────────────────────
// Startup validation — fail loudly so misconfiguration is obvious
// in Vercel build/runtime logs rather than silently per-request.
// ─────────────────────────────────────────────────────────────

const RESEND_KEY = env.RESEND_API_KEY;

if (!RESEND_KEY || RESEND_KEY.trim() === "") {
  console.error(
    "❌ [Resend] RESEND_API_KEY is not set. Email sending will fail. " +
    "Add a valid key in Vercel → Settings → Environment Variables.",
  );
} else if (RESEND_KEY.endsWith("_...") || RESEND_KEY === "re_placeholder") {
  console.error(
    "❌ [Resend] RESEND_API_KEY looks like a placeholder value. " +
    "Replace it with a real key from https://resend.com/api-keys.",
  );
} else if (process.env.NODE_ENV === "production" && !RESEND_KEY.startsWith("re_")) {
  console.warn(
    "⚠️  [Resend] RESEND_API_KEY does not look like a valid Resend key (should start with 're_'). " +
    "Email sending may fail.",
  );
}

const FROM_EMAIL = env.RESEND_FROM_EMAIL.toLowerCase();
const FREE_EMAIL_DOMAINS = ["gmail.com", "hotmail.com", "outlook.com", "yahoo.com", "icloud.com"];
const isFreeDomain = FREE_EMAIL_DOMAINS.some((d) => FROM_EMAIL.endsWith(`@${d}`));

if (isFreeDomain) {
  console.warn(
    `⚠️  [Resend] RESEND_FROM_EMAIL is set to "${env.RESEND_FROM_EMAIL}" (a free email provider). ` +
    "Resend requires a verified custom domain for custom sender addresses. " +
    "Defaulting sender to onboarding@resend.dev for Resend sandbox compatibility.",
  );
}

// ─────────────────────────────────────────────────────────────
// Singleton — reused across hot-reload cycles in development
// ─────────────────────────────────────────────────────────────

const globalForResend = globalThis as unknown as {
  resend: Resend | undefined;
};

export const resend: Resend =
  globalForResend.resend ?? new Resend(RESEND_KEY);

if (process.env.NODE_ENV !== "production") {
  globalForResend.resend = resend;
}

export const emailDefaults = {
  from: isFreeDomain
    ? `${env.RESEND_FROM_NAME} <onboarding@resend.dev>`
    : `${env.RESEND_FROM_NAME} <${env.RESEND_FROM_EMAIL}>`,
} as const;


