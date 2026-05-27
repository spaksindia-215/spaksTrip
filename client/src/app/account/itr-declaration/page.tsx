import type { Metadata } from "next";
import ITRDeclarationContent from "@/components/account/ITRDeclarationContent";

export const metadata: Metadata = {
  title: "Agency ITR Declaration",
};

export default function ITRDeclarationPage() {
  return <ITRDeclarationContent />;
}
