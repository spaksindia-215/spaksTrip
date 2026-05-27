import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import BackToTop from "@/components/landing/BackToTop";
import Footer from "@/components/landing/Footer";
import Header from "@/components/landing/Header";
import AddYourTaxiForm from "@/components/transport/AddYourTaxiForm";
import type { ApiAuthUser } from "@/lib/authClient";
import {
  TAXI_PACKAGE_DESTINATIONS_ROUTE,
  isTaxiManagerRole,
} from "@/lib/taxiRoles";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:4000";
const ADD_TAXI_PATH = "/taxi-package/add-your-taxi";
const LOGIN_REDIRECT = `/auth?redirect=${encodeURIComponent(ADD_TAXI_PATH)}`;

async function requireTaxiManager(): Promise<ApiAuthUser> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  if (!cookieHeader) {
    redirect(LOGIN_REDIRECT);
  }

  const response = await fetch(new URL("/api/auth/me", API_BASE), {
    cache: "no-store",
    headers: { cookie: cookieHeader },
  });

  if (response.status >= 400 && response.status < 500) {
    redirect(LOGIN_REDIRECT);
  }

  if (!response.ok) {
    throw new Error("Unable to validate taxi partner session");
  }

  const { user } = (await response.json()) as { user: ApiAuthUser };
  if (!isTaxiManagerRole(user.role)) {
    redirect(TAXI_PACKAGE_DESTINATIONS_ROUTE);
  }

  return user;
}

export default async function AddYourTaxiPage() {
  await requireTaxiManager();

  return (
    <div className="min-h-screen bg-surface-muted text-ink">
      <Header />
      <AddYourTaxiForm />
      <Footer />
      <BackToTop />
    </div>
  );
}
