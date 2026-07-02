import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: [
        "/auth",
        "/forgot-password",
        "/partner",
        "/admin",
        "/dashboard",
        "/customer",
        "/account",
        "/agent",
        "/superadmin",
        "/reset-password",
        "/verify-email",
        "/suspended",
      ],
      allow: ["/"],
    },
    sitemap: "https://www.spakstrip.com/sitemap.xml",
  };
}
