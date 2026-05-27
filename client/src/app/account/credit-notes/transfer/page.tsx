import type { Metadata } from "next";
import CreditNoteContent from "@/components/account/CreditNoteContent";

export const metadata: Metadata = {
  title: "Transfer Credit Note",
};

export default function TransferCreditNotePage() {
  return <CreditNoteContent type="transfer" />;
}
