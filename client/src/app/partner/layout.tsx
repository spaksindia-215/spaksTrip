import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import PartnerShell from "@/components/partner/PartnerShell";
import type { ApiAuthUser } from "@/lib/authClient";
import { toDisplayName } from "@/lib/displayName";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:4000";

type MeResponse = {
  user: ApiAuthUser;
};

function loginRedirectUrl(pathname: string): string {
  return `/auth?role=partner&redirect=${encodeURIComponent(pathname)}`;
}

async function getPartnerUser(): Promise<MeResponse["user"]> {
  const requestHeaders = await headers();
  const currentPath = requestHeaders.get("x-spakstrip-path") ?? "/partner/dashboard";

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
    throw new Error("Unable to validate partner session");
  }

  const payload = (await response.json()) as MeResponse;
  if (payload.user.role !== "partner") {
    redirect("/");
  }

  return payload.user;
}

export default async function PartnerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getPartnerUser();

  return (
    <PartnerShell
      user={{
        id: user.id,
        email: user.email,
        role: user.role,
        displayName: toDisplayName(user.email),
      }}
    >
      {children}
    </PartnerShell>
  );
}
