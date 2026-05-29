import { NextRequest, NextResponse } from "next/server";
import { tboGetChangeRequestStatus } from "@/lib/adapters/tbo/hotel/sendChangeRequest";
import { tboGetHotelBookingDetail } from "@/lib/adapters/tbo/hotel/booking";
import { TboError } from "@/lib/adapters/tbo/errors";

function err(message: string, status: number) {
  return NextResponse.json({ success: false, error: message }, { status });
}

/**
 * GET /api/hotels/cancel/status?changeRequestId=123&bookingRefNo=TBO123
 * Check status of a cancellation request
 *
 * Query params:
 * - changeRequestId: number (required) - from cancel response
 * - bookingRefNo: string (optional) - for fallback verification if status check fails
 *
 * Response (200):
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
 * Response if status check fails (408):
 * {
 *   success: true,
 *   data: {
 *     changeRequestId: number,
 *     status: "Pending",
 *     note: "Status check pending, try again later"
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const changeRequestId = searchParams.get("changeRequestId");
    const bookingRefNo = searchParams.get("bookingRefNo");

    if (!changeRequestId) {
      return err("changeRequestId is required.", 400);
    }

    const id = parseInt(changeRequestId, 10);
    if (!Number.isFinite(id) || id <= 0) {
      return err("changeRequestId must be a positive integer.", 400);
    }

    try {
      // Try to get change request status
      const statusResult = await tboGetChangeRequestStatus({
        changeRequestId: id,
      });

      console.log(
        `[Cancel Status] ChangeRequestId ${id}: ${statusResult.changeRequestStatus}`
      );

      return NextResponse.json({
        success: true,
        data: {
          changeRequestId: statusResult.changeRequestId,
          status: statusResult.changeRequestStatus,
          refundAmount: statusResult.refundAmount,
          cancellationCharge: statusResult.cancellationCharge,
          responseStatus: statusResult.responseStatus,
        },
      });
    } catch (statusErr) {
      const errorMsg = statusErr instanceof Error ? statusErr.message : String(statusErr);
      console.warn(
        `[Cancel Status] Failed to get status for changeRequestId ${id}: ${errorMsg}`
      );

      // Fallback: Try to verify via BookingDetail if bookingRefNo provided
      if (bookingRefNo) {
        try {
          console.log(`[Cancel Status] Attempting fallback verification via BookingDetail`);
          const bookingDetail = await tboGetHotelBookingDetail({
            bookingRefNo,
          });

          const isCancelled = bookingDetail.bookingStatus === "Cancelled";

          return NextResponse.json({
            success: true,
            data: {
              changeRequestId: id,
              status: isCancelled ? "Processed" : "InProgress",
              bookingStatus: bookingDetail.bookingStatus,
              note: isCancelled
                ? "Booking confirmed as cancelled"
                : `Booking status: ${bookingDetail.bookingStatus}`,
            },
          });
        } catch (detailErr) {
          console.warn(
            `[Cancel Status] BookingDetail fallback also failed: ${
              detailErr instanceof Error ? detailErr.message : String(detailErr)
            }`
          );

          // Return pending status with note
          return NextResponse.json({
            success: true,
            data: {
              changeRequestId: id,
              status: "InProgress",
              note: "Status verification pending. Please try again later.",
            },
          });
        }
      }

      // No fallback available, return pending
      return NextResponse.json({
        success: true,
        data: {
          changeRequestId: id,
          status: "InProgress",
          note: "Status check pending. Please provide bookingRefNo for verification.",
        },
      });
    }
  } catch (e) {
    const stack = e instanceof Error ? e.stack : String(e);
    console.error("[API /api/hotels/cancel/status] FAILED");
    console.error("  stack:", stack);

    const message = e instanceof Error ? e.message : "Status check failed";
    return err(message, 500);
  }
}
