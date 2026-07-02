import type { Metadata } from "next";
import { SITE_CONFIG, SERVICES } from "./constants";

interface MetadataOptions {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  twitterCard?: "summary" | "summary_large_image";
}

export function generateBaseMetadata(options: MetadataOptions = {}): Metadata {
  const {
    title = SITE_CONFIG.title,
    description = SITE_CONFIG.description,
    canonical = SITE_CONFIG.url,
    ogImage = SITE_CONFIG.logo,
    twitterCard = "summary",
  } = options;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      type: "website",
      title,
      description,
      url: canonical,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      siteName: SITE_CONFIG.name,
    },
    twitter: {
      card: twitterCard,
      title,
      description,
      images: [ogImage],
    },
    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
      },
    },
  };
}

export function generateServiceMetadata(
  serviceKey: keyof typeof SERVICES,
  options: Partial<MetadataOptions> = {}
): Metadata {
  const service = SERVICES[serviceKey];

  return generateBaseMetadata({
    title: service.title,
    description: service.description,
    canonical: `${SITE_CONFIG.url}${service.path}`,
    ...options,
  });
}

export function generatePageMetadata(
  title: string,
  description: string,
  path: string,
  options: Partial<MetadataOptions> = {}
): Metadata {
  return generateBaseMetadata({
    title: `${title} | ${SITE_CONFIG.name}`,
    description,
    canonical: `${SITE_CONFIG.url}${path}`,
    ...options,
  });
}
