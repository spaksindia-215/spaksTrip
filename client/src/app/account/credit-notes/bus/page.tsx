import type { Metadata } from "next";
import CreditNoteContent from "@/components/account/CreditNoteContent";

export const metadata: Metadata = {
  title: "Bus Credit Note",
};

export default function BusCreditNotePage() {
  return <CreditNoteContent type="bus" />;
}
