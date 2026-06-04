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
};

export const isProd = env.nodeEnv === "production";
