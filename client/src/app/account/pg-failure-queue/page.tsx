import type { Metadata } from "next";
import PGFailureContent from "@/components/account/PGFailureContent";

export const metadata: Metadata = {
  title: "PG Failure Queue",
};

export default function PGFailureQueuePage() {
  return <PGFailureContent />;
}
