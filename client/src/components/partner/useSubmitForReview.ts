"use client";

import { useState } from "react";
import { partnerClient } from "@/lib/partnerClient";
import { useToast } from "@/components/ui/Toast";

// Shared "submit for review" action for partner-resource Managers. Flips a
// draft/paused/suspended listing to pending via the generic moderation endpoint,
// then refreshes the list. `type` is the vertical (taxi, tour, cruise, …).
export function useSubmitForReview(type: string, onDone: () => void | Promise<void>) {
  const toast = useToast();
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const submit = async (id: string) => {
    setSubmittingId(id);
    try {
      await partnerClient.submitListing(type, id);
      toast.push({
        title: "Submitted for review",
        description: "Now pending admin approval.",
        tone: "success",
      });
      await onDone();
    } catch (error) {
      toast.push({
        title: "Could not submit",
        description: error instanceof Error ? error.message : "Please try again.",
        tone: "danger",
      });
    } finally {
      setSubmittingId(null);
    }
  };

  return { submittingId, submit };
}

// Statuses from which a partner can (re)submit a listing for review.
export const SUBMITTABLE_STATUSES = ["draft", "paused", "suspended"];
