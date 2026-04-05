import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";

function readRequiredEnv(name: "ADMIN_USERNAME" | "ADMIN_PASSWORD") {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

function safeEquals(a: string, b: string) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) {
    return false;
  }
  return timingSafeEqual(aBuf, bBuf);
}

export function verifyAdminCredentials(username: string, password: string) {
  const expectedUsername = readRequiredEnv("ADMIN_USERNAME");
  const expectedPassword = readRequiredEnv("ADMIN_PASSWORD");
  return safeEquals(username, expectedUsername) && safeEquals(password, expectedPassword);
}

export function getSessionFromCookies() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}
