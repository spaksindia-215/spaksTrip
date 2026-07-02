import { createElement } from "react";
import { SITE_CONFIG } from "./constants";

interface SchemaScriptProps {
  schemaData: unknown;
}

function SchemaScript({ schemaData }: SchemaScriptProps) {
  return createElement("script", {
    type: "application/ld+json",
    dangerouslySetInnerHTML: { __html: JSON.stringify(schemaData) },
    suppressHydrationWarning: true,
  });
}

export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_CONFIG.url}/#organization`,
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    logo: {
      "@type": "ImageObject",
      url: SITE_CONFIG.logo,
    },
  };

  return createElement(SchemaScript, { schemaData: schema });
}

export function WebsiteSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_CONFIG.url}/#website`,
    url: SITE_CONFIG.url,
    name: SITE_CONFIG.name,
    publisher: {
      "@id": `${SITE_CONFIG.url}/#organization`,
    },
  };

  return createElement(SchemaScript, { schemaData: schema });
}

export function TravelAgencySchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    "@id": `${SITE_CONFIG.url}/#travelagency`,
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    image: SITE_CONFIG.logo,
    telephone: SITE_CONFIG.phone,
    email: SITE_CONFIG.email,
    priceRange: "₹₹",
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE_CONFIG.address.streetAddress,
      addressLocality: SITE_CONFIG.address.locality,
      addressRegion: SITE_CONFIG.address.region,
      postalCode: SITE_CONFIG.address.postalCode,
      addressCountry: SITE_CONFIG.address.country,
    },
    openingHours: SITE_CONFIG.openingHours,
    sameAs: [
      SITE_CONFIG.social.facebook,
      SITE_CONFIG.social.instagram,
      SITE_CONFIG.social.linkedin,
    ],
  };

  return createElement(SchemaScript, { schemaData: schema });
}

interface ServiceSchemaOptions {
  serviceType: string;
  url: string;
  description?: string;
  image?: string;
}

export function ServiceSchema({
  serviceType,
  url,
  description,
  image,
}: ServiceSchemaOptions) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType,
    provider: {
      "@type": "TravelAgency",
      name: SITE_CONFIG.name,
    },
    url,
  };

  if (description) {
    schema.description = description;
  }

  if (image) {
    schema.image = image;
  }

  return createElement(SchemaScript, { schemaData: schema });
}

interface AggregateSchemaOptions {
  schemas: Record<string, unknown>[];
}

function AggregateSchemaComponent({ schemas }: AggregateSchemaOptions) {
  const schema = {
    "@context": "https://schema.org",
    "@graph": schemas,
  };

  return createElement(SchemaScript, { schemaData: schema });
}

export function HomepageSchema() {
  const schemas = [
    {
      "@type": "Organization",
      "@id": `${SITE_CONFIG.url}/#organization`,
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url,
      logo: {
        "@type": "ImageObject",
        url: SITE_CONFIG.logo,
      },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_CONFIG.url}/#website`,
      url: SITE_CONFIG.url,
      name: SITE_CONFIG.name,
      publisher: {
        "@id": `${SITE_CONFIG.url}/#organization`,
      },
    },
    {
      "@type": "TravelAgency",
      "@id": `${SITE_CONFIG.url}/#travelagency`,
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url,
      image: SITE_CONFIG.logo,
      telephone: SITE_CONFIG.phone,
      email: SITE_CONFIG.email,
      priceRange: "₹₹",
      address: {
        "@type": "PostalAddress",
        streetAddress: SITE_CONFIG.address.streetAddress,
        addressLocality: SITE_CONFIG.address.locality,
        addressRegion: SITE_CONFIG.address.region,
        postalCode: SITE_CONFIG.address.postalCode,
        addressCountry: SITE_CONFIG.address.country,
      },
      openingHours: SITE_CONFIG.openingHours,
      sameAs: [
        SITE_CONFIG.social.facebook,
        SITE_CONFIG.social.instagram,
        SITE_CONFIG.social.linkedin,
      ],
    },
  ];

  return createElement(AggregateSchemaComponent, { schemas });
}
