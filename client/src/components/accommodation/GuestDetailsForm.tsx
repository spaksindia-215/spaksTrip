"use client";

import Input from "@/components/ui/Input";
import type { HotelGuest } from "@/state/hotelBookingStore";
import { ALLOWED_TITLES, validateGuestName, validateGuestAge } from "@/lib/validators/guestValidation";
import { getIdentityRequirement } from "@/lib/validators/nationalityValidation";

type Props = {
  roomNumber: number;
  guest: HotelGuest;
  onChange: (guest: HotelGuest) => void;
  errors?: Partial<Record<keyof HotelGuest, string>>;
  showAge?: boolean;
  guestNationality?: string;
  hotelCountry?: string;
  isLeadPassenger?: boolean;
  preBookPanMandatory?: boolean; // From PreBook response - TBO requirement
  preBookPassportMandatory?: boolean; // From PreBook response - TBO requirement
};

export default function GuestDetailsForm({
  roomNumber,
  guest,
  onChange,
  errors = {},
  showAge = false,
  guestNationality = "IN",
  hotelCountry = "India",
  isLeadPassenger = true,
  preBookPanMandatory = false,
  preBookPassportMandatory = false,
}: Props) {
  const handleTitleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({
      ...guest,
      title: e.target.value as "Mr" | "Mrs" | "Ms",
    });
  };

  const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...guest,
      firstName: e.target.value,
    });
  };

  const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...guest,
      lastName: e.target.value,
    });
  };

  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const age = e.target.value ? parseInt(e.target.value, 10) : undefined;
    onChange({
      ...guest,
      age,
    });
  };

  const handlePanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...guest,
      pan: e.target.value.toUpperCase(),
    });
  };

  const handlePassportChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...guest,
      passport: e.target.value.toUpperCase(),
    });
  };

  const handlePassportIssueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...guest,
      passportIssueDate: e.target.value,
    });
  };

  const handlePassportExpDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...guest,
      passportExpDate: e.target.value,
    });
  };

  // Determine identity requirements based on:
  // 1. Nationality and destination (nationality validation logic)
  // 2. PreBook response flags (TBO requirements)
  // Use OR logic: if either source says it's required, it's required
  const identityReq = isLeadPassenger ? getIdentityRequirement(guestNationality, hotelCountry) : null;
  const panRequired = (identityReq?.panRequired || preBookPanMandatory);
  const passportRequired = (identityReq?.passportRequired || preBookPassportMandatory);

  const titleError = errors.title;
  const firstNameError = errors.firstName;
  const lastNameError = errors.lastName;
  const ageError = errors.age;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[13px] font-semibold text-ink-muted">Room {roomNumber} — Primary Guest</p>

      {/* Title */}
      <div className="flex flex-col gap-1">
        <label htmlFor={`guest-title-${roomNumber}`} className="text-[13px] font-medium text-ink">
          Title <span className="text-danger-600">*</span>
        </label>
        <select
          id={`guest-title-${roomNumber}`}
          value={guest.title || ""}
          onChange={handleTitleChange}
          aria-label="Guest title"
          className={`h-10 w-full appearance-none rounded-lg border px-3 text-[14px] font-semibold bg-white hover:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors ${
            titleError ? "border-danger-500" : "border-border"
          }`}
        >
          <option value="">Select title</option>
          {ALLOWED_TITLES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        {titleError && <p className="text-[11px] text-danger-600 font-medium mt-0.5">{titleError}</p>}
      </div>

      {/* First and Last Name */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor={`guest-first-name-${roomNumber}`} className="text-[13px] font-medium text-ink">
            First Name <span className="text-danger-600">*</span>
          </label>
          <Input
            id={`guest-first-name-${roomNumber}`}
            value={guest.firstName}
            onChange={handleFirstNameChange}
            placeholder="As on ID"
            error={firstNameError}
            hint={firstNameError ? undefined : "2-25 characters, letters and spaces only"}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`guest-last-name-${roomNumber}`} className="text-[13px] font-medium text-ink">
            Last Name <span className="text-danger-600">*</span>
          </label>
          <Input
            id={`guest-last-name-${roomNumber}`}
            value={guest.lastName}
            onChange={handleLastNameChange}
            placeholder="As on ID"
            error={lastNameError}
            hint={lastNameError ? undefined : "2-25 characters, letters and spaces only"}
          />
        </div>
      </div>

      {/* Age (optional, shown for children) */}
      {showAge && (
        <div className="flex flex-col gap-1">
          <label htmlFor={`guest-age-${roomNumber}`} className="text-[13px] font-medium text-ink">
            Age <span className="text-ink-muted">(optional for children)</span>
          </label>
          <Input
            id={`guest-age-${roomNumber}`}
            type="number"
            min="0"
            max="17"
            value={guest.age ?? ""}
            onChange={handleAgeChange}
            placeholder="Child age (0-17)"
            error={ageError}
          />
        </div>
      )}

      {/* Identity Documents (conditional, only for lead passenger) */}
      {isLeadPassenger && (panRequired || passportRequired) && (
        <div className="mt-4 pt-4 border-t border-border-soft">
          <p className="text-[12px] font-medium text-ink-muted mb-3">
            {identityReq?.reason || "Identity document required per hotel requirements"}
          </p>
          {preBookPanMandatory && !identityReq?.panRequired && (
            <p className="text-[11px] text-blue-700 bg-blue-50 rounded px-3 py-2 mb-3">
              ℹ PAN is mandatory per TBO Hotel API requirements for this booking
            </p>
          )}
          {preBookPassportMandatory && !identityReq?.passportRequired && (
            <p className="text-[11px] text-blue-700 bg-blue-50 rounded px-3 py-2 mb-3">
              ℹ Passport is mandatory per TBO Hotel API requirements for this booking
            </p>
          )}

          {/* PAN */}
          {panRequired && (
            <div className="flex flex-col gap-1">
              <label htmlFor={`guest-pan-${roomNumber}`} className="text-[13px] font-medium text-ink">
                PAN <span className="text-danger-600">*</span>
              </label>
              <Input
                id={`guest-pan-${roomNumber}`}
                value={guest.pan ?? ""}
                onChange={handlePanChange}
                placeholder="E.g., AAAPN5055K"
                error={errors.pan}
                hint={errors.pan ? undefined : "10 characters (5 letters, 4 digits, 1 letter)"}
              />
            </div>
          )}

          {/* Passport */}
          {passportRequired && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label htmlFor={`guest-passport-${roomNumber}`} className="text-[13px] font-medium text-ink">
                  Passport Number <span className="text-danger-600">*</span>
                </label>
                <Input
                  id={`guest-passport-${roomNumber}`}
                  value={guest.passport ?? ""}
                  onChange={handlePassportChange}
                  placeholder="Passport number"
                  error={errors.passport}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label htmlFor={`guest-passport-issue-${roomNumber}`} className="text-[13px] font-medium text-ink">
                    Issue Date <span className="text-danger-600">*</span>
                  </label>
                  <Input
                    id={`guest-passport-issue-${roomNumber}`}
                    type="date"
                    value={guest.passportIssueDate ?? ""}
                    onChange={handlePassportIssueDateChange}
                    error={errors.passportIssueDate}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor={`guest-passport-exp-${roomNumber}`} className="text-[13px] font-medium text-ink">
                    Expiry Date <span className="text-danger-600">*</span>
                  </label>
                  <Input
                    id={`guest-passport-exp-${roomNumber}`}
                    type="date"
                    value={guest.passportExpDate ?? ""}
                    onChange={handlePassportExpDateChange}
                    error={errors.passportExpDate}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
