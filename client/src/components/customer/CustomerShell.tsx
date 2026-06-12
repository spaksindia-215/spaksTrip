"use client";

import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import { type AuthUser } from "@/state/authStore";

type Props = {
  user: AuthUser;
  children: React.ReactNode;
};

export default function CustomerShell({ children }: Props) {
  return (
    <div className="flex min-h-screen flex-col bg-surface-muted">
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-8 md:px-6 lg:px-8">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
