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

type RegisterResponse = AuthResponse & {
  // "pending" for b2b_agent + partner (no session issued); "active" otherwise.
  status: UserStatus;
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
  status: UserStatus;
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
};
