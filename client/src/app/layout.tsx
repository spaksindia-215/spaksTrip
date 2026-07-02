import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { ToastProvider } from "@/components/ui/Toast";
import TranslationProvider from "@/i18n/TranslationProvider";
import { AgentBrandingProvider, type AgentBranding } from "@/lib/agentBranding";
import { SITE_CONFIG, GOOGLE_ANALYTICS, GOOGLE_TAG_MANAGER } from "@/lib/seo/constants";
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
    verification: {
      google: SITE_CONFIG.googleSearchConsoleVerification,
    },
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
      <head>
        {/* Google Analytics */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS.id}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GOOGLE_ANALYTICS.id}');`}
        </Script>

        {/* Google Tag Manager */}
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${GOOGLE_TAG_MANAGER.id}');`}
        </Script>
      </head>
      <body className="min-h-full flex flex-col bg-surface text-ink">
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${GOOGLE_TAG_MANAGER.id}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>

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
