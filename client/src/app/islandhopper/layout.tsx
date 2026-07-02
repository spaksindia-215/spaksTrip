import type { Metadata } from "next";
import type { ReactNode } from "react";
import { generateServiceMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = generateServiceMetadata("islandHopper");

export default function IslandhopperLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
