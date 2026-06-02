import { Schema, model, HydratedDocument } from "mongoose";

export const ROLES = ["customer", "agent", "b2b_agent", "partner"] as const;
export type Role = (typeof ROLES)[number];

export const USER_STATUSES = ["active", "pending", "rejected"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export interface IUser {
  name: string;
  phone: string;
  email: string;
  passwordHash: string;
  role: Role;
  status: UserStatus;
  aadhar: string;
  gst?: string;
  pan?: string;
  creditLimit: number | null;
  walletBalance: number;
  rejectionReason?: string;
  createdAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ROLES, required: true, default: "customer" },
    status: { type: String, enum: USER_STATUSES, required: true, default: "active" },
    aadhar: { type: String, required: true, trim: true },
    gst: { type: String, trim: true },
    pan: { type: String, trim: true },
    creditLimit: { type: Number, default: null },
    walletBalance: { type: Number, default: 0 },
    rejectionReason: { type: String, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    const out = ret as unknown as Record<string, unknown>;
    out.id = String(out._id);
    delete out._id;
    delete out.__v;
    delete out.passwordHash;
    return out;
  },
});

export type UserDoc = HydratedDocument<IUser>;
export const UserModel = model<IUser>("User", userSchema);
