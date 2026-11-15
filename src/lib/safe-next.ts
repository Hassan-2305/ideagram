/** Returns a same-origin path for post-login redirects, or "/" (blocks `/\evil.com`, `/%09/evil.com`, absolute URLs). */
export function safeNextPath(raw: string | null, origin: string): string {
  if (!raw) return "/";
  try {
    const u = new URL(raw, origin);
    return u.origin === origin ? u.pathname + u.search + u.hash : "/";
  } catch {
    return "/";
  }
}
