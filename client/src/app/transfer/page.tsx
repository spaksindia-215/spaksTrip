import ServiceBrowsePage from "@/components/services/ServiceBrowsePage";
import { SERVICE_MODULES } from "@/lib/serviceModules";

export default function TransferPage() {
  return <ServiceBrowsePage config={SERVICE_MODULES.transfer} />;
}
