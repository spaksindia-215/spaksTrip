import type { Metadata } from "next";
import type { ReactNode } from "react";
import { generateServiceMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = generateServiceMetadata("sightseeing");

export default function SightseeingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
