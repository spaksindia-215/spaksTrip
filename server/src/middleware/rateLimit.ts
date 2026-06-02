import rateLimit from "express-rate-limit";

// Throttles credential endpoints (login/register, admin password) to blunt
// brute-force / credential-stuffing. Keyed by IP; `trust proxy` is set in prod
// so the real client IP is used behind Railway.
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Please try again later." },
});
