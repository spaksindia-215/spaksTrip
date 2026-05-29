/**
 * TBO Hotel API Session Validation
 *
 * TBO API sessions are valid for 40 minutes from the initial Search request.
 * After 40 minutes, any PreBook or Book requests will fail.
 *
 * This validator ensures we catch expiring sessions early and force new searches.
 */

export const SESSION_TIMEOUT_MINUTES = 40;
export const SESSION_WARNING_THRESHOLD_MINUTES = 35; // Warn user 5 min before expiry
export const SESSION_TIMEOUT_MS = SESSION_TIMEOUT_MINUTES * 60 * 1000;

export type SessionStatus = {
  isValid: boolean;
  isExpired: boolean;
  isWarning: boolean;
  minutesRemaining: number;
  secondsRemaining: number;
  percentRemaining: number;
};

export function validateSession(sessionExpiresAt: string): SessionStatus {
  const now = new Date();
  const expiresAt = new Date(sessionExpiresAt);
  const timeRemaining = expiresAt.getTime() - now.getTime();

  const minutesRemaining = Math.floor(timeRemaining / 60000);
  const secondsRemaining = Math.floor((timeRemaining % 60000) / 1000);
  const percentRemaining = Math.max(0, Math.min(100, (timeRemaining / SESSION_TIMEOUT_MS) * 100));

  const isExpired = timeRemaining <= 0;
  const isWarning = timeRemaining > 0 && minutesRemaining <= SESSION_WARNING_THRESHOLD_MINUTES;

  return {
    isValid: !isExpired,
    isExpired,
    isWarning,
    minutesRemaining: Math.max(0, minutesRemaining),
    secondsRemaining: Math.max(0, secondsRemaining),
    percentRemaining,
  };
}

export function formatSessionTime(minutes: number, seconds: number): string {
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

export function getSessionWarningMessage(minutesRemaining: number): string {
  return `Your booking session expires in ${minutesRemaining} minutes. Please complete your booking or start a new search.`;
}
