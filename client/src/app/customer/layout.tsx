import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import CustomerShell from "@/components/customer/CustomerShell";
import type { ApiAuthUser } from "@/lib/authClient";
import { toDisplayName } from "@/lib/displayName";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:4000";

type MeResponse = {
  user: ApiAuthUser;
};

function loginRedirectUrl(pathname: string): string {
  return `/auth?role=customer&redirect=${encodeURIComponent(pathname)}`;
}

async function getCustomerUser(): Promise<MeResponse["user"]> {
  const requestHeaders = await headers();
  const currentPath = requestHeaders.get("x-spakstrip-path") ?? "/customer/dashboard";

  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  if (!cookieHeader) {
    redirect(loginRedirectUrl(currentPath));
  }

  const response = await fetch(new URL("/api/auth/me", API_BASE), {
    cache: "no-store",
    headers: {
      cookie: cookieHeader,
    },
  });

  if (response.status >= 400 && response.status < 500) {
    redirect(loginRedirectUrl(currentPath));
  }

  if (!response.ok) {
    throw new Error("Unable to validate customer session");
  }

  const payload = (await response.json()) as MeResponse;
  if (payload.user.role !== "customer") {
    redirect("/");
  }

  return payload.user;
}

export default async function CustomerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCustomerUser();

  return (
    <CustomerShell
      user={{
        id: user.id,
        email: user.email,
        role: user.role,
        displayName: user.name?.trim() || toDisplayName(user.email),
      }}
    >
      {children}
    </CustomerShell>
  );
}
