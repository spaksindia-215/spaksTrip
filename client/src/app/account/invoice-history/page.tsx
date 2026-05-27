import type { Metadata } from "next";
import HistoryContent from "@/components/account/HistoryContent";

export const metadata: Metadata = {
  title: "Invoice History",
};

export default function InvoiceHistoryPage() {
  return <HistoryContent type="invoice" />;
}
