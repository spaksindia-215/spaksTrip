import type { Metadata } from "next";
import ServiceBrowsePage from "@/components/services/ServiceBrowsePage";
import { SERVICE_MODULES } from "@/lib/serviceModules";
import { generateServiceMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = generateServiceMetadata("transfer");

export default function TransferPage() {
  return <ServiceBrowsePage config={SERVICE_MODULES.transfer} />;
}
