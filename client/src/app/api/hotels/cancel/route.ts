import { NextRequest, NextResponse } from "next/server";
import {
  tboSendChangeRequest,
  tboGetChangeRequestStatus,
  ChangeRequestType,
} from "@/lib/adapters/tbo/hotel/sendChangeRequest";
import { tboGetHotelBookingDetail } from "@/lib/adapters/tbo/hotel/booking";
import { TboError, TboBookingFailedError } from "@/lib/adapters/tbo/errors";
import { fetchWithTimeout, isTimeoutError } from "@/lib/adapters/tbo/timeout";

function err(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

/**
 * POST /api/hotels/cancel
 * Cancel a hotel booking via TBO API
 *
 * Request:
 * {
 *   bookingId: number,
 *   bookingRefNo: string,
 *   remarks?: string,
 *   endUserIp?: string
 * }
 *
 * Response on Success (200):
 * {
 *   success: true,
 *   data: {
 *     changeRequestId: number,
 *     status: "Pending" | "InProgress" | "Processed" | "Rejected",
 *     refundAmount?: number,
 *     cancellationCharge?: number
 *   }
 * }
 *
 * Response on Timeout (408):
 * {
 *   success: false,
 *   error: "Cancel request timed out. Verifying booking status...",
 *   bookingStatus?: "confirmed" | "cancelled" | "unknown"
 * }
 *
 * Response when unable to cancel (422):
 * {
 *   success: false,
 *   error: "Cannot cancel booking. Please contact support with booking ID: ...",
 *   escalationRequired: true,
 *   opsEmail: "ops@tbo.com"
 * }
 */
export async function POST(request: NextRequest) {
  let bookingId: number | undefined;
  let bookingRefNo: string | undefined;

  try {
    const body = await request.json();

    bookingId = body?.bookingId;
    bookingRefNo = body?.bookingRefNo;

    if (!bookingId || bookingId <= 0) {
      return err("bookingId is required and must be positive.", 400);
    }

    if (!bookingRefNo) {
      return err("bookingRefNo is required.", 400);
    }

    let changeRequestId: number | null = null;

    try {
      // Step 1: Send cancel request to TBO
      console.log(`[Cancel] Initiating cancel for booking ${bookingId}`);

      const sendResult = await tboSendChangeRequest({
        bookingId,
        requestType: ChangeRequestType.HotelCancel,
        remarks: body.remarks || "Customer-initiated cancellation",
        endUserIp: body.endUserIp,
      });

      changeRequestId = sendResult.changeRequestId;
      console.log(`[Cancel] ChangeRequestId: ${changeRequestId}, Status: ${sendResult.changeRequestStatus}`);

      // Step 2: Check status if we got a request ID
      if (changeRequestId) {
        try {
          const statusResult = await tboGetChangeRequestStatus({
            changeRequestId,
            endUserIp: body.endUserIp,
          });

          console.log(`[Cancel] Status check: ${statusResult.changeRequestStatus}`);

          return NextResponse.json({
            success: true,
            data: {
              changeRequestId: statusResult.changeRequestId,
              status: statusResult.changeRequestStatus,
              refundAmount: statusResult.refundAmount,
              cancellationCharge: statusResult.cancellationCharge,
              bookingId,
              bookingRefNo,
            },
          });
        } catch (statusErr) {
          // If status check fails, still return success since we have the request ID
          console.warn(`[Cancel] Status check failed, but request was submitted: ${statusErr}`);
          return NextResponse.json({
            success: true,
            data: {
              changeRequestId: changeRequestId,
              status: "Pending",
              note: "Cancellation request submitted. Status verification pending.",
              bookingId,
              bookingRefNo,
            },
          });
        }
      }

      // Shouldn't reach here
      return err("Failed to get ChangeRequestId from TBO", 502);
    } catch (cancelErr) {
      const errorMsg = cancelErr instanceof Error ? cancelErr.message : String(cancelErr);

      // Check if timeout occurred
      if (isTimeoutError(cancelErr)) {
        console.warn(
          `[Cancel] Timeout occurred for booking ${bookingId}. Verifying status via BookingDetail...`
        );

        // Step 3: Timeout fallback - verify status via BookingDetail
        try {
          const bookingDetail = await tboGetHotelBookingDetail({
            bookingRefNo,
          });

          const isCancelled = bookingDetail.bookingStatus === "Cancelled";

          console.log(
            `[Cancel] Timeout verification: Booking status = ${bookingDetail.bookingStatus}, isCancelled=${isCancelled}`
          );

          return err(
            `Cancel request timed out after 120 seconds. Booking status verified: ${
              isCancelled ? "CANCELLED ✓" : "Still " + bookingDetail.bookingStatus
            }`,
            408
          );
        } catch (detailErr) {
          console.error(
            `[Cancel] BookingDetail verification also failed: ${
              detailErr instanceof Error ? detailErr.message : String(detailErr)
            }`
          );

          // Cannot verify, recommend manual escalation
          return err(
            `Cancel request timed out and status verification failed. ` +
            `Please contact ops@tbo.com with booking reference: ${bookingRefNo}`,
            408
          );
        }
      }

      // Regular error (not timeout)
      console.error(`[Cancel] Cancel request failed: ${errorMsg}`);

      if (cancelErr instanceof TboBookingFailedError) {
        return err(
          `Cannot cancel: ${cancelErr.message}. ` +
          `If issue persists, contact ops@tbo.com with reference: ${bookingRefNo}`,
          422
        );
      }

      if (cancelErr instanceof TboError) {
        return err(
          `TBO error during cancel: ${cancelErr.message}. ` +
          `Contact ops@tbo.com with booking reference: ${bookingRefNo}`,
          502
        );
      }

      // Unknown error - recommend escalation
      return err(
        `Cancel request failed: ${errorMsg}. ` +
        `Contact ops@tbo.com with booking reference: ${bookingRefNo}`,
        500
      );
    }
  } catch (e) {
    const stack = e instanceof Error ? e.stack : String(e);
    console.error("[API /api/hotels/cancel] FAILED");
    console.error("  bookingId:", bookingId);
    console.error("  bookingRefNo:", bookingRefNo);
    console.error("  stack:", stack);

    const message = e instanceof Error ? e.message : "Cancel request failed";
    return err(message, 500);
  }
}
