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

export default router;
