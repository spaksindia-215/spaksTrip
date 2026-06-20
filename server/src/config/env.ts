import 'dotenv/config'
function required(name: string): string {
  const v = process.env[name];
  if (!v || v.length === 0) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return v;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:3000",
  mongoUri: required("MONGO_URI"),
  accessSecret: required("ACCESS_TOKEN_SECRET"),
  refreshSecret: required("REFRESH_TOKEN_SECRET"),
  accessTtl: process.env.ACCESS_TOKEN_TTL ?? "15m",
  refreshTtl: process.env.REFRESH_TOKEN_TTL ?? "7d",
  // Recipient for "new pending registration" notifications (used by the mailer).
  superadminEmail: process.env.SUPERADMIN_EMAIL ?? "admin@spakstrip.local",
  // Superadmin panel: env password gate (no DB role) + secret for signing the
  // admin-session cookie. If the password is empty, admin login is disabled.
  superadminPassword: process.env.SUPERADMIN_PASSWORD ?? "",
  adminSessionSecret: process.env.ADMIN_SESSION_SECRET ?? process.env.ACCESS_TOKEN_SECRET ?? "",
  // Cloudinary (image/document uploads for partner listings). Accepts either a
  // single CLOUDINARY_URL or the three discrete vars. Uploads fail with a clear
  // error if unset; the rest of the API still boots.
  cloudinaryUrl: process.env.CLOUDINARY_URL ?? "",
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY ?? "",
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET ?? "",
  // PostgreSQL — additive second database for financial transactions only.
  // Deliberately NOT required(): if unset the Express server must still boot and
  // all existing MongoDB-backed features must keep working (graceful degradation).
  databaseUrl: process.env.DATABASE_URL ?? "",
  // Razorpay payment gateway. Optional for the same graceful-degradation reason.
  razorpayKeyId: process.env.RAZORPAY_KEY_ID ?? "",
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET ?? "",
  razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET ?? "",
  // Signed price-token secret. Optional (graceful degradation): when set, the
  // FareQuote→create-order amount binding is enforced. MUST be identical on the
  // Next app and this server for tokens to verify across both layers.
  priceTokenSecret: process.env.PRICE_TOKEN_SECRET ?? "",
  // SMTP for transactional email (verification, password reset, notifications).
  // When EMAIL_HOST is unset the mailer falls back to console logging (dev/CI).
  emailHost: process.env.EMAIL_HOST ?? "",
  emailPort: Number(process.env.EMAIL_PORT ?? 587),
  emailUser: process.env.EMAIL_USER ?? "",
  emailPass: process.env.EMAIL_PASS ?? "",
  emailFrom: process.env.EMAIL_FROM ?? "SpaksTrip <no-reply@spakstrip.com>",
  // Background worker intervals (ms). Defaults: heal 5m, reconcile 60m, DLQ 10m.
  healWorkerIntervalMs: Number(process.env.HEAL_WORKER_INTERVAL_MS ?? 300000),
  reconciliationWorkerIntervalMs: Number(process.env.RECONCILIATION_WORKER_INTERVAL_MS ?? 3600000),
  dlqWorkerIntervalMs: Number(process.env.DLQ_WORKER_INTERVAL_MS ?? 600000),
};

export const isProd = env.nodeEnv === "production";
