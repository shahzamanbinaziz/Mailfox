export const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

/** Lower-cases and trims an email address; returns null when it is syntactically invalid. */
export function normalizeEmail(input: string): string | null {
  const email = input.trim().toLowerCase();
  // Pragmatic RFC 5322 subset — full validation (MX, disposable, role) happens in the import pipeline.
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? email : null;
}

export function emailDomain(email: string): string {
  return email.slice(email.lastIndexOf("@") + 1).toLowerCase();
}

/** Random integer in [min, max] — used for send-delay jitter. */
export function jitter(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min + 1));
}

export function percent(part: number, total: number, digits = 1): number {
  if (total <= 0) return 0;
  const f = 10 ** digits;
  return Math.round((part / total) * 100 * f) / f;
}
