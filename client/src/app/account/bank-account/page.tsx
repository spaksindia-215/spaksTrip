import type { Metadata } from "next";
import BankAccountContent from "@/components/account/BankAccountContent";

export const metadata: Metadata = {
  title: "Bank Account",
};

export default function BankAccountPage() {
  return <BankAccountContent />;
}
