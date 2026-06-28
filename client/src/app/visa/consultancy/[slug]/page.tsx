"use client";

import { use } from "react";
import ServiceDetailPage from "@/components/services/ServiceDetailPage";
import { SERVICE_MODULES } from "@/lib/serviceModules";

export default function VisaConsultancyDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  return <ServiceDetailPage config={SERVICE_MODULES.visa} slug={slug} />;
}
