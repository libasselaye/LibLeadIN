export const STATUS = {
  PENDING: 'PENDING',
  SENT: 'SENT',
  NO_EMAIL: 'NO_EMAIL',
  FAILED: 'FAILED',
} as const;

export const COOKIE_NAME = 'libleadin-auth';
export const COOKIE_MAX_AGE = 60 * 60 * 24; // 24h in seconds
