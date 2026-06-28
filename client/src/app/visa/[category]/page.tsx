"use client";

import { use } from "react";
import ServiceBrowsePage from "@/components/services/ServiceBrowsePage";
import { SERVICE_MODULES, VISA_TYPE_BY_SLUG } from "@/lib/serviceModules";

// Category landing for /visa/pr-visa, /visa/work-visa, /visa/study-visa,
// /visa/visit-visa. The static /visa/consultancy and /visa/bookings segments win
// over this dynamic one. Unknown categories fall back to browsing all consultancies.
export default function VisaCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = use(params);
  const mapped = VISA_TYPE_BY_SLUG[category];
  return (
    <ServiceBrowsePage
      config={SERVICE_MODULES.visa}
      heading={mapped ? mapped.label : "Visa Consultancy"}
      blurb={
        mapped
          ? `Licensed consultancies offering ${mapped.label.toLowerCase()} services. Enquire for a free assessment.`
          : SERVICE_MODULES.visa.blurb
      }
      forcedFilter={mapped ? { visaType: mapped.value } : undefined}
    />
  );
}
