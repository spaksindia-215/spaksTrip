import { api } from "@/lib/api";

export type UserRole = "customer" | "agent" | "b2b_agent" | "partner";

export type UserStatus = "active" | "pending" | "rejected";

export type ApiAuthUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
};

type AuthResponse = {
  user: ApiAuthUser;
};

// Register no longer issues a session directly: every new account must confirm
// its email first ("verify_email"); approval-gated roles return "pending".
export type RegisterStatus = UserStatus | "verify_email";

type RegisterResponse = AuthResponse & {
  status: RegisterStatus;
};

export type LoginInput = {
  phone: string;
  password: string;
};

export type RegisterInput = {
  name: string;
  phone: string;
  email: string;
  password: string;
  role: UserRole;
  aadhar: string;
  gst?: string;
  pan?: string;
};

export type RegisterResult = {
  user: ApiAuthUser;
  status: RegisterStatus;
};

export type VerifyEmailResult = {
  verified: boolean;
  status: RegisterStatus;
  user: ApiAuthUser;
};

export const authClient = {
  async login(input: LoginInput): Promise<ApiAuthUser> {
    const response = await api<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: input,
    });

    return response.user;
  },

  async register(input: RegisterInput): Promise<RegisterResult> {
    const response = await api<RegisterResponse>("/api/auth/register", {
      method: "POST",
      body: input,
    });

    return { user: response.user, status: response.status };
  },

  async me(): Promise<ApiAuthUser> {
    const response = await api<AuthResponse>("/api/auth/me");
    return response.user;
  },

  async logout(): Promise<void> {
    await api<{ ok: true }>("/api/auth/logout", { method: "POST" });
  },

  // Confirm email via the link token. On success the server issues a session
  // (for active roles), so the caller can drop the user straight into the app.
  async verifyEmail(token: string): Promise<VerifyEmailResult> {
    return api<VerifyEmailResult>("/api/auth/verify-email", {
      method: "POST",
      body: { token },
    });
  },

  async resendVerification(identifier: { email?: string; phone?: string }): Promise<{ ok: true; message: string }> {
    return api<{ ok: true; message: string }>("/api/auth/resend-verification", {
      method: "POST",
      body: identifier,
    });
  },

  async forgotPassword(identifier: { email?: string; phone?: string }): Promise<{ ok: true; message: string }> {
    return api<{ ok: true; message: string }>("/api/auth/forgot-password", {
      method: "POST",
      body: identifier,
    });
  },

  async resetPassword(token: string, password: string): Promise<{ ok: true; message: string }> {
    return api<{ ok: true; message: string }>("/api/auth/reset-password", {
      method: "POST",
      body: { token, password },
    });
  },
};
