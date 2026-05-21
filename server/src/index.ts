import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { env, isProd } from "./config/env";
import { connectDb } from "./config/db";
import authRoutes from "./routes/auth.routes";
import partnerRoutes from "./routes/partner.routes";
import { errorHandler } from "./middleware/error";

async function main(): Promise<void> {
  await connectDb();

  const app = express();

  // Trust Railway's reverse proxy so req.ip and secure flag are accurate
  if (isProd) app.set("trust proxy", 1);

  app.use(
    cors({
      origin: env.clientOrigin,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/partner", partnerRoutes);

  app.use(errorHandler);

  app.listen(env.port, () => {
    console.log(`[server] listening on http://localhost:${env.port}`);
  });
}

main().catch((err) => {
  console.error("[fatal]", err);
  process.exit(1);
});
