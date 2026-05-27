import type { Metadata } from "next";
import HistoryContent from "@/components/account/HistoryContent";

export const metadata: Metadata = {
  title: "Payment History",
};

export default function PaymentHistoryPage() {
  return <HistoryContent type="payment" />;
}
