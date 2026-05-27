import type { Metadata } from "next";
import PANDeclarationContent from "@/components/account/PANDeclarationContent";

export const metadata: Metadata = {
  title: "Agency PAN Declaration",
};

export default function PANDeclarationPage() {
  return <PANDeclarationContent />;
}
