/** Days since the Unix epoch (UTC) — used to rotate daily content deterministically. */
export function dayNumber(date = new Date()): number {
  return Math.floor(date.getTime() / 86_400_000);
}
