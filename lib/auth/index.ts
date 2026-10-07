import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-insecure-secret-change-me";

export type JwtPayload = { id: number; cccd: string | null };

// Mirrors Strapi auth: jwt.sign({ cccd, id }, JWT_SECRET, { expiresIn: '7d' }).
export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

// bcrypt compare, same as Strapi's verifyPassword.
export async function verifyPassword(plain: string, hashed: string | null): Promise<boolean> {
  if (!hashed) return false;
  try {
    return await bcrypt.compare(plain, hashed);
  } catch {
    return false;
  }
}

export function bearer(req: Request): string | null {
  const h = req.headers.get("authorization");
  if (!h) return null;
  const [scheme, token] = h.split(" ");
  return scheme === "Bearer" && token ? token : null;
}

// Resolve the authenticated up_users row from a Bearer token, mirroring the
// Strapi pattern: decode JWT → find user by cccd. Returns null if absent/invalid.
import { prisma } from "@/lib/db/prisma";
export async function userFromBearer(req: Request) {
  const token = bearer(req);
  if (!token) return null;
  try {
    const decoded = verifyToken(token);
    return await prisma.up_users.findFirst({ where: { cccd: decoded.cccd } });
  } catch {
    return null;
  }
}

// Mirrors Strapi's reCAPTCHA gate: only enforced when RECAPTCHA_ENABLED === 'true'.
export function isRecaptchaEnabled(): boolean {
  return process.env.RECAPTCHA_ENABLED === "true";
}

// --- recovery helpers (mirror api/auth/controllers/recovery.js) ---

export function generateResetToken(): string {
  return `RST-${crypto.randomBytes(32).toString("hex")}`;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

// recovery string stored as bcrypt hash of lowercased+trimmed value.
export async function verifyRecoveryHash(input: string, storedHash: string | null): Promise<boolean> {
  if (!storedHash) return false;
  return bcrypt.compare(input.toLowerCase().trim(), storedHash);
}

export async function hashRecoveryString(recoveryString: string): Promise<string> {
  return bcrypt.hash(recoveryString.toLowerCase().trim(), 10);
}

export function validatePasswordPolicy(password: string): { valid: boolean; message: string } {
  if (password.length < 8) return { valid: false, message: "Password must be at least 8 characters long." };
  if (!/[A-Z]/.test(password)) return { valid: false, message: "Password must contain at least one uppercase letter." };
  if (!/[a-z]/.test(password)) return { valid: false, message: "Password must contain at least one lowercase letter." };
  if (!/[0-9]/.test(password)) return { valid: false, message: "Password must contain at least one number." };
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password))
    return { valid: false, message: 'Password must contain at least one special character (!@#$%^&*(),.?":{}|<>).' };
  return { valid: true, message: "Password meets security requirements." };
}
