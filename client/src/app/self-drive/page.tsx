import ServiceBrowsePage from "@/components/services/ServiceBrowsePage";
import { SERVICE_MODULES } from "@/lib/serviceModules";

export default function SelfDrivePage() {
  return <ServiceBrowsePage config={SERVICE_MODULES.self_drive} />;
}
