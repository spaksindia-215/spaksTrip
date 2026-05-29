import { useState } from "react";
import type { HotelGuest } from "@/state/hotelBookingStore";

export interface BookResult {
  bookingId: number | null;
  bookingRefNo: string | null;
  confirmationNo: string | null;
  invoiceNumber: string | null;
  status: "Confirmed" | "BookFailed" | "VerifyPrice" | "Cancelled" | "Unknown";
}

export interface UseBookState {
  loading: boolean;
  error: string | null;
  result: BookResult | null;
}

export function useBook() {
  const [state, setState] = useState<UseBookState>({
    loading: false,
    error: null,
    result: null,
  });

  const makeBooking = async (params: {
    bookingCode: string;
    netAmount: number;
    isVoucherBooking: boolean;
    guests: HotelGuest[];
    guestNationality?: string;
    clientReferenceId?: string;
  }): Promise<BookResult | null> => {
    setState({ loading: true, error: null, result: null });

    try {
      // Build passengers array from guests
      const passengers = params.guests.map((guest, idx) => ({
        title: guest.title,
        firstName: guest.firstName,
        lastName: guest.lastName,
        paxType: 1, // 1 = Adult; TODO: support children (2)
        leadPassenger: idx === 0, // First guest is lead
        age: guest.age,
      }));

      const response = await fetch("/api/hotels/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingCode: params.bookingCode,
          netAmount: params.netAmount,
          isVoucherBooking: params.isVoucherBooking,
          guestNationality: params.guestNationality || "IN",
          clientReferenceId: params.clientReferenceId,
          roomsDetails: [
            {
              passengers,
            },
          ],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Booking failed");
      }

      const { data } = await response.json();

      const result: BookResult = {
        bookingId: data.bookingId,
        bookingRefNo: data.bookingRefNo,
        confirmationNo: data.confirmationNo,
        invoiceNumber: data.invoiceNumber,
        status: data.bookingStatus || "Unknown",
      };

      setState({ loading: false, error: null, result });
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Booking request failed";
      setState({ loading: false, error: errorMessage, result: null });
      return null;
    }
  };

  return {
    ...state,
    makeBooking,
  };
}
