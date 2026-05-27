import type { Metadata } from "next";
import DailySalesContent from "@/components/account/DailySalesContent";

export const metadata: Metadata = {
  title: "Daily Sales Report",
};

export default function DailySalesReportPage() {
  return <DailySalesContent />;
}
