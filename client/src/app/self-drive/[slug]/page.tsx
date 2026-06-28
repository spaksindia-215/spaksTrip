"use client";

import { use } from "react";
import ServiceDetailPage from "@/components/services/ServiceDetailPage";
import { SERVICE_MODULES } from "@/lib/serviceModules";

export default function SelfDriveDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  return <ServiceDetailPage config={SERVICE_MODULES.self_drive} slug={slug} />;
}
