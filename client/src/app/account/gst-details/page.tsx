import type { Metadata } from "next";
import GSTDetailsContent from "@/components/account/GSTDetailsContent";

export const metadata: Metadata = {
  title: "GST Details",
};

export default function GSTDetailsPage() {
  return <GSTDetailsContent />;
}
