import dns from "node:dns";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { env, isProd } from "./config/env";
import { connectDb } from "./config/db";
import { seedPlatformConfig } from "./models/PlatformConfig";
import authRoutes from "./routes/auth.routes";
import partnerRoutes from "./routes/partner.routes";
import adminRoutes from "./routes/admin.routes";
import customerRoutes from "./routes/customer.routes";
import agentRoutes from "./routes/agent.routes";
import internalRoutes from "./routes/internal.routes";
import flightsRoutes from "./routes/flights.routes";
import { errorHandler } from "./middleware/error";
import { securityHeaders } from "./middleware/securityHeaders";
import { apiRateLimiter } from "./middleware/rateLimit";
// ADDED: PostgreSQL transaction layer (additive — never replaces MongoDB)
import { testConnection } from "./config/postgres";
import webhookRoutes from "./routes/webhooks";
import { startHealWorker } from "./workers/healWorker";
import { startReconciliationWorker } from "./workers/reconciliationWorker";
import { startDLQWorker } from "./workers/dlqWorker";

async function main(): Promise<void> {
  // Prefer IPv4 for all outbound connections. Some hosts (e.g. Railway) have no
  // IPv6 egress, so connecting to an AAAA record fails with ENETUNREACH and then
  // times out — which was breaking Gmail SMTP. Node otherwise follows the
  // resolver order, which can return IPv6 first.
  dns.setDefaultResultOrder("ipv4first");

  await connectDb();
  await seedPlatformConfig();

  // ADDED: probe PostgreSQL without blocking startup. If it is down or unset,
  // testConnection() logs a warning and resolves — the server boots regardless
  // and all existing MongoDB features keep working.
  void testConnection();

  const app = express();

  // Trust Railway's reverse proxy so req.ip and secure flag are accurate
  if (isProd) app.set("trust proxy", 1);

  // Security headers on every response (HSTS in prod, nosniff, frame-deny, etc.)
  app.use(securityHeaders);

  app.use(
    cors({
      origin: env.clientOrigin,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      // ADDED: X-Razorpay-Idempotency-Key for future order-creation requests
      allowedHeaders: ["Content-Type", "Authorization", "X-Razorpay-Idempotency-Key"],
    }),
  );

  // ADDED: webhook route is mounted BEFORE express.json() so its own middleware
  // can apply express.raw() and verify the HMAC signature against the raw body.
  // All other routes below keep the global express.json() parser unchanged.
  app.use("/api/webhooks", webhookRoutes);

  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  // Outer rate-limit bound for the whole API surface (skips /api/internal).
  // Per-route stricter tiers (auth / booking / search) are layered on top inside
  // each router. Mounted AFTER /api/webhooks so Razorpay retries are never throttled.
  app.use("/api", apiRateLimiter);

  app.use("/api/auth", authRoutes);
  app.use("/api/partner", partnerRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/customer", customerRoutes);
  app.use("/api/agent", agentRoutes);
  app.use("/api/internal", internalRoutes);
  // TBO flight endpoints (migrated from Next.js so outbound TBO calls use Railway's
  // static IP). Public, like the original Next routes.
  app.use("/api/flights", flightsRoutes);

  app.use(errorHandler);

  app.listen(env.port, () => {
    console.log(`[server] listening on http://localhost:${env.port}`);
    // ADDED: start background workers after the server is listening. Each guards
    // internally against PostgreSQL being unconfigured/unavailable.
    startHealWorker();
    startReconciliationWorker();
    startDLQWorker();
  });
}

main().catch((err) => {
  console.error("[fatal]", err);
  process.exit(1);
});
