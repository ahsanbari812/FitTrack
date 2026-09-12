/**
 * FitTrack Global Auth Configuration
 *
 * There is only ONE fitness coach account.
 * Role resolution is determined exclusively from the authenticated user's email.
 */

export const COACH_EMAIL =
  process.env.EXPO_PUBLIC_COACH_EMAIL || "fakhirchannafakhirchanna@gmail.com";

export function isCoachEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === COACH_EMAIL.trim().toLowerCase();
}
