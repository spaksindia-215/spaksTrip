import type { Metadata } from "next";
import SalesReportContent from "@/components/account/SalesReportContent";

export const metadata: Metadata = {
  title: "Sales Report",
};

export default function SalesReportPage() {
  return <SalesReportContent />;
}
