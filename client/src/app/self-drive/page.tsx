import type { Metadata } from "next";
import ServiceBrowsePage from "@/components/services/ServiceBrowsePage";
import { SERVICE_MODULES } from "@/lib/serviceModules";
import { generateServiceMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = generateServiceMetadata("selfDrive");

export default function SelfDrivePage() {
  return <ServiceBrowsePage config={SERVICE_MODULES.self_drive} />;
}
