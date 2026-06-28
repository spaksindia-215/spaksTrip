import ServiceListingManager from "@/components/partner/ServiceListingManager";
import { SERVICE_MODULES } from "@/lib/serviceModules";

export default function PartnerIslandhopperPage() {
  return <ServiceListingManager config={SERVICE_MODULES.islandhopper} />;
}
