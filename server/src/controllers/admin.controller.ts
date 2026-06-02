import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { UserModel, ROLES, type Role } from "../models/User";
import { HttpError } from "../middleware/error";
import { sendMail } from "../lib/mailer";
import {
  verifyAdminPassword,
  createAdminSessionToken,
} from "../lib/adminSession";
import { setAdminCookie, clearAdminCookie } from "../lib/cookies";

// Credit limit bounds for agent-type accounts (₹8,000–₹1,00,000).
const CREDIT_MIN = 8000;
const CREDIT_MAX = 100000;

// Roles that go through the approval queue.
const APPROVAL_ROLES: readonly Role[] = ["b2b_agent", "partner"];

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function paramId(req: Request): string {
  const raw = req.params.id;
  const id = typeof raw === "string" ? raw : "";
  if (!mongoose.isValidObjectId(id)) throw new HttpError(400, "Invalid id");
  return id;
}

export async function adminLogin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const password = isObject(req.body) ? req.body.password : undefined;
    if (!verifyAdminPassword(password)) {
      throw new HttpError(401, "Invalid admin password");
    }
    setAdminCookie(res, createAdminSessionToken());
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

export async function adminLogout(_req: Request, res: Response): Promise<void> {
  clearAdminCookie(res);
  res.json({ ok: true });
}

export async function adminMe(_req: Request, res: Response): Promise<void> {
  // Reaching here means the admin-session middleware already passed.
  res.json({ ok: true });
}

export async function listPending(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const items = await UserModel.find({
      role: { $in: APPROVAL_ROLES },
      status: "pending",
    }).sort({ createdAt: -1 });
    res.json({ items: items.map((i) => i.toJSON()) });
  } catch (e) {
    next(e);
  }
}

export async function approve(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = paramId(req);
    const user = await UserModel.findById(id);
    if (!user) throw new HttpError(404, "User not found");
    if (!(APPROVAL_ROLES as readonly string[]).includes(user.role)) {
      throw new HttpError(400, "This account does not require approval");
    }
    if (user.status !== "pending") {
      throw new HttpError(409, `Account is already ${user.status}`);
    }

    // Only b2b_agent carries a credit limit (partner does not).
    if (user.role === "b2b_agent") {
      const raw = isObject(req.body) ? req.body.creditLimit : undefined;
      const creditLimit = typeof raw === "number" ? raw : Number(raw);
      if (!Number.isFinite(creditLimit) || creditLimit < CREDIT_MIN || creditLimit > CREDIT_MAX) {
        throw new HttpError(
          400,
          `creditLimit must be between ${CREDIT_MIN} and ${CREDIT_MAX}`,
        );
      }
      user.creditLimit = creditLimit;
    }

    user.status = "active";
    user.rejectionReason = undefined;
    await user.save();

    await sendMail({
      to: user.email,
      subject: "Your SpaksTrip account has been approved",
      template: "applicantApproved",
      data: { name: user.name, role: user.role, creditLimit: user.creditLimit },
    });

    res.json({ user: user.toJSON() });
  } catch (e) {
    next(e);
  }
}

export async function reject(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = paramId(req);
    const reasonRaw = isObject(req.body) ? req.body.reason : undefined;
    const reason = typeof reasonRaw === "string" ? reasonRaw.trim() : "";

    const user = await UserModel.findById(id);
    if (!user) throw new HttpError(404, "User not found");
    if (!(APPROVAL_ROLES as readonly string[]).includes(user.role)) {
      throw new HttpError(400, "This account does not require approval");
    }
    if (user.status !== "pending") {
      throw new HttpError(409, `Account is already ${user.status}`);
    }

    user.status = "rejected";
    user.rejectionReason = reason || undefined;
    await user.save();

    await sendMail({
      to: user.email,
      subject: "Update on your SpaksTrip application",
      template: "applicantRejected",
      data: { name: user.name, role: user.role, reason },
    });

    res.json({ user: user.toJSON() });
  } catch (e) {
    next(e);
  }
}

// Manually set/adjust the credit limit for an agent or b2b_agent (₹8k–₹1L).
export async function setCreditLimit(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = paramId(req);
    const raw = isObject(req.body) ? req.body.creditLimit : undefined;
    const creditLimit = typeof raw === "number" ? raw : Number(raw);
    if (!Number.isFinite(creditLimit) || creditLimit < CREDIT_MIN || creditLimit > CREDIT_MAX) {
      throw new HttpError(400, `creditLimit must be between ${CREDIT_MIN} and ${CREDIT_MAX}`);
    }
    const user = await UserModel.findById(id);
    if (!user) throw new HttpError(404, "User not found");
    if (user.role !== "agent" && user.role !== "b2b_agent") {
      throw new HttpError(400, "Only agents and B2B agents have a credit limit");
    }
    user.creditLimit = creditLimit;
    await user.save();
    res.json({ user: user.toJSON() });
  } catch (e) {
    next(e);
  }
}

export async function listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const filter: Record<string, unknown> = {};
    const { role } = req.query;
    if (typeof role === "string" && role.length > 0) {
      if (!(ROLES as readonly string[]).includes(role)) {
        throw new HttpError(400, `role must be one of: ${ROLES.join(", ")}`);
      }
      filter.role = role;
    }
    const items = await UserModel.find(filter).sort({ createdAt: -1 });
    res.json({ items: items.map((i) => i.toJSON()) });
  } catch (e) {
    next(e);
  }
}
