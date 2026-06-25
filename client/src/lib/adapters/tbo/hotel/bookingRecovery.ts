import "server-only";
import { tboGetHotelBookingDetail, type GetBookingDetailInput, type HotelBookingDetailResult } from "./booking";

/**
 * Timeout Recovery: If booking request times out, use this to verify booking status.
 *
 * TBO Recommendation:
 * "If booking processing time exceeds 120 seconds cutoff, call BookingDetail
 *  using BookingId to know final status and avoid financial loss."
 *
 * This function attempts to retrieve booking status when the initial booking
 * request timed out. It can query by:
 * - bookingId: If partially returned in timeout response
 * - confirmationNo: If confirmation was issued despite timeout
 * - clientReferenceId: Fallback to match against persisted booking records
 */
export async function verifyBookingStatusAfterTimeout(
  input: Partial<GetBookingDetailInput> & {
    bookingId?: number;
    confirmationNo?: string;
    traceId?: string;
    clientReferenceId?: string;
    tboFailureReason?: string;
  },
): Promise<{ found: boolean; booking?: HotelBookingDetailResult; error?: string }> {
  if (!input.bookingId && !input.confirmationNo && !input.traceId) {
    return {
      found: false,
      error: "Cannot verify booking: provide at least bookingId, confirmationNo, or traceId",
    };
  }

  // TBO compliance: Block recovery for explicit failures
  // Per TBO requirement: "No calling in failed booking case"
  if (input.tboFailureReason === "explicit_failure") {
    return {
      found: false,
      error: "Booking was explicitly failed; recovery is not allowed per TBO policy.",
    };
  }

  try {
    const detail = await tboGetHotelBookingDetail({
      bookingId: input.bookingId,
      confirmationNo: input.confirmationNo,
      firstName: input.firstName,
      lastName: input.lastName,
      traceId: input.traceId,
      clientReferenceNo: input.clientReferenceId,
      endUserIp: input.endUserIp,
    });

    return {
      found: true,
      booking: detail,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Failed to verify booking status";
    return {
      found: false,
      error: errorMsg,
    };
  }
}

/**
 * Returns user-friendly message about timeout recovery process.
 */
export function getTimeoutRecoveryMessage(clientReferenceId: string): string {
  return (
    `Your booking request took longer than expected (>120 seconds) to process. ` +
    `This may indicate a network issue, but your booking may have been created at TBO. ` +
    `Please:\n\n` +
    `1. Check your email for booking confirmation\n` +
    `2. Log into your account to check booking status\n` +
    `3. Contact support with reference ID: ${clientReferenceId}\n\n` +
    `Your booking is protected and will be verified through our backend system.`
  );
}
