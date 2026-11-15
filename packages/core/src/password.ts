import bcrypt from "bcryptjs";
import { z } from "zod";

const COST = 12;

export const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters")
  .max(128, "Use at most 128 characters")
  .refine((p) => /[A-Za-z]/.test(p) && /\d/.test(p), "Use letters and at least one number");

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, COST);
}

export function verifyPassword(password: string, hash: string | null | undefined): Promise<boolean> {
  // Compare against a dummy hash when the user has none, so timing doesn't reveal which emails exist.
  return bcrypt.compare(password, hash ?? "$2b$12$C6UzMDM.H6dfI/f/IKcEeO5xXcZbpo8bBHbrYQbZRkGQ0xA.yXH2W");
}
