import "server-only";

/**
 * Validate Voucher Deadline
 *
 * TBO Requirement: Must generate voucher before LastVoucherDate.
 * If booking is held and user misses this deadline, TBO won't take liability.
 */

export interface VoucherDeadlineInfo {
  lastVoucherDate: string; // ISO date string
  isExpired: boolean;
  daysRemaining: number;
  message: string;
}

/**
 * Check if voucher deadline has passed.
 * @param lastVoucherDate ISO date string from PreBook response
 * @returns {VoucherDeadlineInfo} Information about deadline status
 */
export function getVoucherDeadlineInfo(lastVoucherDate: string | undefined): VoucherDeadlineInfo {
  if (!lastVoucherDate) {
    return {
      lastVoucherDate: "N/A",
      isExpired: false,
      daysRemaining: -1,
      message: "No voucher deadline specified",
    };
  }

  const deadline = new Date(lastVoucherDate);
  const now = new Date();

  const isExpired = now > deadline;
  const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  let message = "";
  if (isExpired) {
    message = `Voucher deadline has passed (was ${lastVoucherDate}). Booking may be automatically cancelled by TBO.`;
  } else if (daysRemaining === 0) {
    message = `Voucher must be generated TODAY (deadline: ${lastVoucherDate})`;
  } else if (daysRemaining === 1) {
    message = `Voucher must be generated within 1 day (deadline: ${lastVoucherDate})`;
  } else {
    message = `Voucher must be generated within ${daysRemaining} days (deadline: ${lastVoucherDate})`;
  }

  return {
    lastVoucherDate,
    isExpired,
    daysRemaining,
    message,
  };
}

/**
 * Prevents voucher generation if deadline has passed.
 * @param lastVoucherDate ISO date string
 * @throws Error if deadline exceeded
 */
export function validateVoucherDeadline(lastVoucherDate: string | undefined): void {
  const deadline = getVoucherDeadlineInfo(lastVoucherDate);

  if (deadline.isExpired) {
    throw new Error(
      `Cannot generate voucher: deadline has passed (${lastVoucherDate}). ` +
      `TBO may have automatically cancelled this booking. ` +
      `Contact support for assistance.`
    );
  }
}
