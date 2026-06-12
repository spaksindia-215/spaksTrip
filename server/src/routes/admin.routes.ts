import { Router } from "express";
import {
  adminLogin,
  adminLogout,
  adminMe,
  listPending,
  approve,
  reject,
  listUsers,
  setCreditLimit,
  getNavbarSettings,
  updateNavbarSettings,
  getPlatformMarkup,
  updatePlatformMarkup,
} from "../controllers/admin.controller";
import { adminSessionMiddleware } from "../middleware/adminSession";
import { authRateLimiter } from "../middleware/rateLimit";

const router = Router();

// Password gate (rate-limited). Everything else requires the signed admin cookie.
router.post("/login", authRateLimiter, adminLogin);
router.post("/logout", adminLogout);
router.get("/me", adminSessionMiddleware, adminMe);
router.get("/pending", adminSessionMiddleware, listPending);
router.post("/approve/:id", adminSessionMiddleware, approve);
router.post("/reject/:id", adminSessionMiddleware, reject);
router.get("/users", adminSessionMiddleware, listUsers);
router.patch("/users/:id/credit-limit", adminSessionMiddleware, setCreditLimit);

// Navbar visibility — GET is public (read by all visitors), PUT requires admin session.
router.get("/navbar-settings", getNavbarSettings);
router.put("/navbar-settings", adminSessionMiddleware, updateNavbarSettings);

// Platform-wide L1 markup (applied on top of TBO fare before agents see their net rate).
router.get("/platform-markup", adminSessionMiddleware, getPlatformMarkup);
router.put("/platform-markup", adminSessionMiddleware, updatePlatformMarkup);

export default router;
