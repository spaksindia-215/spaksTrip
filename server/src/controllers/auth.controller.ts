import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { UserModel } from "../models/User";
import { signAccessToken, verifyRefreshToken } from "../lib/tokens";
import { setAuthCookies, clearAuthCookies } from "../lib/cookies";
import {
  issueRefreshToken,
  findActiveRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
} from "../lib/refreshTokens";
import { validateLogin, validateRegister } from "../validators/auth.validators";
import { HttpError } from "../middleware/error";
import { sendMail } from "../lib/mailer";
import { env } from "../config/env";

const BCRYPT_ROUNDS = 12;

// b2b_agent + partner require superadmin approval; everyone else is active on register.
const PENDING_ROLES = ["b2b_agent", "partner"] as const;

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = validateRegister(req.body);

    const existing = await UserModel.findOne({
      $or: [{ phone: input.phone }, { email: input.email }],
    });
    if (existing) {
      const field = existing.phone === input.phone ? "Phone" : "Email";
      throw new HttpError(409, `${field} already in use`);
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    const isPending = (PENDING_ROLES as readonly string[]).includes(input.role);

    const user = await UserModel.create({
      name: input.name,
      phone: input.phone,
      email: input.email,
      passwordHash,
      role: input.role,
      status: isPending ? "pending" : "active",
      aadhar: input.aadhar,
      gst: input.gst,
      pan: input.pan,
    });

    // Pending roles: no session is issued; superadmin is notified for review.
    if (isPending) {
      await sendMail({
        to: env.superadminEmail,
        subject: `New ${user.role} registration awaiting approval`,
        template: "superadminNewPending",
        data: { role: user.role, name: user.name, phone: user.phone, email: user.email },
      });
      res.status(201).json({ status: "pending", user: user.toJSON() });
      return;
    }

    // Active roles: issue a session with a DB-backed (revocable) refresh token.
    const userId = String(user._id);
    const accessToken = signAccessToken({ sub: userId, role: user.role, email: user.email });
    const refreshToken = await issueRefreshToken(userId);

    setAuthCookies(res, accessToken, refreshToken);
    res.status(201).json({ status: "active", user: user.toJSON() });
  } catch (e) {
    next(e);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { phone, password } = validateLogin(req.body);

    const user = await UserModel.findOne({ phone });
    if (!user) throw new HttpError(401, "Invalid credentials");

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new HttpError(401, "Invalid credentials");

    // Credentials verified — now gate on approval status (only the real owner sees this).
    if (user.status === "pending") {
      throw new HttpError(403, "Your account is awaiting approval. We'll email you once it's reviewed.");
    }
    if (user.status === "rejected") {
      throw new HttpError(
        403,
        user.rejectionReason
          ? `Your account was not approved: ${user.rejectionReason}`
          : "Your account was not approved.",
      );
    }

    const userId = String(user._id);
    const accessToken = signAccessToken({ sub: userId, role: user.role, email: user.email });
    const refreshToken = await issueRefreshToken(userId);

    setAuthCookies(res, accessToken, refreshToken);
    res.json({ user: user.toJSON() });
  } catch (e) {
    next(e);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) throw new HttpError(401, "Missing refresh token");

    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      throw new HttpError(401, "Invalid or expired refresh token");
    }

    // The JWT may be valid but already rotated/revoked — the DB row is source of truth.
    const active = await findActiveRefreshToken(token);
    if (!active) throw new HttpError(401, "Refresh token is no longer valid");

    const user = await UserModel.findById(payload.sub);
    if (!user) throw new HttpError(401, "User no longer exists");

    const userId = String(user._id);
    const newRefreshToken = await rotateRefreshToken(token, userId);
    const accessToken = signAccessToken({ sub: userId, role: user.role, email: user.email });

    setAuthCookies(res, accessToken, newRefreshToken);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  const token = req.cookies?.refreshToken;
  if (token) await revokeRefreshToken(token);
  clearAuthCookies(res);
  res.json({ ok: true });
}

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) throw new HttpError(401, "Unauthorized");
    const user = await UserModel.findById(req.user.sub);
    if (!user) throw new HttpError(401, "User not found");
    res.json({ user: user.toJSON() });
  } catch (e) {
    next(e);
  }
}
