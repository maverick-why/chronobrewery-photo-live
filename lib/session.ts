import { createHmac, timingSafeEqual } from "node:crypto";

export type SessionPayload = {
  username: string;
  exp: number;
};

export const SESSION_COOKIE_NAME = "cb_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV !== "production") {
    return "dev-only-session-secret-change-me";
  }

  throw new Error("SESSION_SECRET is required in production");
}

function createSignature(payloadBase64: string) {
  return createHmac("sha256", getSessionSecret())
    .update(payloadBase64)
    .digest("base64url");
}

function safeEquals(a: string, b: string) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) {
    return false;
  }
  return timingSafeEqual(aBuf, bBuf);
}

export function createSessionToken(username: string) {
  const payload: SessionPayload = {
    username,
    exp: Date.now() + SESSION_TTL_SECONDS * 1000
  };

  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createSignature(payloadBase64);
  return `${payloadBase64}.${signature}`;
}

export function verifySessionToken(token: string | undefined) {
  if (!token) {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return null;
  }

  const [payloadBase64, signature] = parts;
  const expected = createSignature(payloadBase64);
  if (!safeEquals(signature, expected)) {
    return null;
  }

  const rawPayload = Buffer.from(payloadBase64, "base64url").toString("utf8");
  const payload = JSON.parse(rawPayload) as SessionPayload;
  if (!payload.exp || payload.exp < Date.now()) {
    return null;
  }

  return payload;
}

export function getSessionMaxAgeSeconds() {
  return SESSION_TTL_SECONDS;
}
