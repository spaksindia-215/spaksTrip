import type { Metadata } from "next";
import CreditNoteContent from "@/components/account/CreditNoteContent";

export const metadata: Metadata = {
  title: "Car Credit Note",
};

export default function CarCreditNotePage() {
  return <CreditNoteContent type="car" />;
}
