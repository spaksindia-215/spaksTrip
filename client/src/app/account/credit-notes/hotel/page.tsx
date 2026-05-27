import type { Metadata } from "next";
import CreditNoteContent from "@/components/account/CreditNoteContent";

export const metadata: Metadata = {
  title: "Hotel Credit Note",
};

export default function HotelCreditNotePage() {
  return <CreditNoteContent type="hotel" />;
}
