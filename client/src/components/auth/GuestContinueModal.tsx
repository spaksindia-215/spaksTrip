"use client";

import Link from "next/link";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

// Shown at checkout when the contact email has NO existing account. Lets a brand-new
// user book as a guest, but clearly alerts them that the trip is only saved to their
// account history if they later register/log in with this SAME email (claim-by-email).
export default function GuestContinueModal({
  open,
  onClose,
  email,
  onContinueAsGuest,
}: {
  open: boolean;
  onClose: () => void;
  email: string;
  onContinueAsGuest: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Continue as a guest?" size="sm">
      <div className="flex flex-col gap-4">
        <p className="text-[13px] text-ink-soft">
          You can book without an account. To save this trip to your history and manage or
          cancel it later, you’ll need to create an account or log in.
        </p>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-[13px] font-semibold text-amber-900">Important</p>
          <p className="mt-1 text-[12px] text-amber-900/80">
            Register or log in later using this same email so we can link this booking to your
            account:
          </p>
          <p className="mt-1.5 break-all text-[13px] font-semibold text-amber-900">{email}</p>
          <p className="mt-1 text-[12px] text-amber-900/70">
            A different email won’t be matched, and the trip won’t appear in “My trips”.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Button variant="accent" size="lg" onClick={onContinueAsGuest} fullWidth>
            Continue as guest
          </Button>
          <Link
            href="/auth"
            className="text-center text-[12px] text-ink-muted hover:text-ink"
          >
            Prefer to create an account first? <span className="font-semibold text-brand-700">Sign up</span>
          </Link>
        </div>
      </div>
    </Modal>
  );
}
