import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import { ToastProvider } from "@/components/ui/Toast";
import TranslationProvider from "@/i18n/TranslationProvider";
import { AgentBrandingProvider, type AgentBranding } from "@/lib/agentBranding";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const h           = await headers();
  const companyName = h.get("x-agent-name");

  if (companyName) {
    return {
      title:       `${companyName} — Flights, Hotels & More`,
      description: `Book flights, hotels, and holiday packages with ${companyName}.`,
      icons:       { icon: "/logo.svg" },
    };
  }

  return {
    title:       "SpaksTrip — Flights, Hotels, Holidays & More",
    description: "Book flights, hotels, holiday packages, visas and more. Powered by SpaksTrip.",
    icons:       { icon: "/logo.svg" },
  };
}

export const viewport: Viewport = {
  width:        "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const h = await headers();

  const agentId      = h.get("x-agent-id");
  const slug         = h.get("x-agent-slug");
  const companyName  = h.get("x-agent-name");
  const primaryColor = h.get("x-agent-color");
  const logo         = h.get("x-agent-logo");

  const branding: AgentBranding = { agentId, slug, companyName, primaryColor, logo };

  // Override --agent-primary on the root element when on an agent subdomain.
  // Apex domain requests have no x-agent-color header so no style is applied.
  const agentStyle = primaryColor
    ? ({ "--agent-primary": primaryColor } as React.CSSProperties)
    : undefined;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={agentStyle}
    >
      <body className="min-h-full flex flex-col bg-surface text-ink">
        <ToastProvider>
          <TranslationProvider>
            <AgentBrandingProvider value={branding}>
              {children}
            </AgentBrandingProvider>
          </TranslationProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
