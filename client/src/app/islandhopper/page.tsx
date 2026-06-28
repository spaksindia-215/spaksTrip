import ServiceBrowsePage from "@/components/services/ServiceBrowsePage";
import { SERVICE_MODULES } from "@/lib/serviceModules";

export default function IslandhopperPage() {
  return <ServiceBrowsePage config={SERVICE_MODULES.islandhopper} />;
}
