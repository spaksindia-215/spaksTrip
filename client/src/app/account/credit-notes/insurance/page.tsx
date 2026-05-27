import type { Metadata } from "next";
import CreditNoteContent from "@/components/account/CreditNoteContent";

export const metadata: Metadata = {
  title: "Insurance Credit Note",
};

export default function InsuranceCreditNotePage() {
  return <CreditNoteContent type="insurance" />;
}
