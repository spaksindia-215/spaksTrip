"use client";

type TaxiData = {
  taxiName: string;
  vehicleType: string;
  registrationNumber: string;
  driverName: string;
  driverMobileNumber: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: number;
  seatingCapacity: number;
  luggageCapacity: number;
  fuelType: string;
  acAvailable: boolean;
  vehicleDescription: string;
  vehicleImages: File[];
};

type DocumentData = {
  vehicleRC?: File;
  commercialPermit?: File;
  insuranceCertificate?: File;
  pollutionCertificate?: File;
  driverLicense?: File;
  vehiclePhotos: File[];
};

type ServiceAreaData = {
  operatingCity: string;
  operatingState: string;
  operatingCountry: string;
  airportTransfer: boolean;
  localRental: boolean;
  outstationAvailable: boolean;
  oneWayAvailable: boolean;
  roundTripAvailable: boolean;
};

type PricingData = {
  baseFare: number;
  perKmCharge: number;
  driverAllowance?: number;
  nightCharges?: number;
  waitingCharges?: number;
  tollIncluded: boolean;
  parkingIncluded: boolean;
  currency: string;
};

type AvailabilityData = {
  status: "available" | "unavailable" | "maintenance";
};

interface Props {
  taxiData: Partial<TaxiData>;
  documentData: Partial<DocumentData>;
  serviceAreaData: Partial<ServiceAreaData>;
  pricingData: Partial<PricingData>;
  availabilityData: Partial<AvailabilityData>;
}

export default function TaxiPartnerReview({
  taxiData,
  documentData,
  serviceAreaData,
  pricingData,
  availabilityData,
}: Props) {
  const getServiceTypes = () => {
    const types: string[] = [];
    if (serviceAreaData.airportTransfer) types.push("Airport Transfer");
    if (serviceAreaData.localRental) types.push("Local Rental");
    if (serviceAreaData.outstationAvailable) types.push("Outstation");
    if (serviceAreaData.oneWayAvailable) types.push("One-Way");
    if (serviceAreaData.roundTripAvailable) types.push("Round Trip");
    return types;
  };

  const getIncludedServices = () => {
    const services: string[] = [];
    if (pricingData.tollIncluded) services.push("Toll");
    if (pricingData.parkingIncluded) services.push("Parking");
    return services;
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-brand-950">Review Your Information</h2>
        <p className="mt-2 text-ink-muted">
          Please review all details before submitting
        </p>
      </div>

      {/* Vehicle Information */}
      <div className="border border-slate-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-brand-950 mb-4">Vehicle Information</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-ink-muted">Taxi Name</p>
            <p className="font-medium text-brand-950">{taxiData.taxiName || "—"}</p>
          </div>
          <div>
            <p className="text-sm text-ink-muted">Vehicle Type</p>
            <p className="font-medium text-brand-950 capitalize">
              {taxiData.vehicleType || "—"}
            </p>
          </div>
          <div>
            <p className="text-sm text-ink-muted">Registration Number</p>
            <p className="font-medium text-brand-950">{taxiData.registrationNumber || "—"}</p>
          </div>
          <div>
            <p className="text-sm text-ink-muted">Driver Name</p>
            <p className="font-medium text-brand-950">{taxiData.driverName || "—"}</p>
          </div>
          <div>
            <p className="text-sm text-ink-muted">Driver Mobile</p>
            <p className="font-medium text-brand-950">{taxiData.driverMobileNumber || "—"}</p>
          </div>
          <div>
            <p className="text-sm text-ink-muted">Brand & Model</p>
            <p className="font-medium text-brand-950">
              {taxiData.vehicleBrand} {taxiData.vehicleModel} ({taxiData.vehicleYear})
            </p>
          </div>
          <div>
            <p className="text-sm text-ink-muted">Seating Capacity</p>
            <p className="font-medium text-brand-950">{taxiData.seatingCapacity || "—"} seats</p>
          </div>
          <div>
            <p className="text-sm text-ink-muted">Luggage Capacity</p>
            <p className="font-medium text-brand-950">{taxiData.luggageCapacity || "—"} kg</p>
          </div>
          <div>
            <p className="text-sm text-ink-muted">Fuel Type</p>
            <p className="font-medium text-brand-950 capitalize">{taxiData.fuelType || "—"}</p>
          </div>
          <div>
            <p className="text-sm text-ink-muted">AC Available</p>
            <p className="font-medium text-brand-950">
              {taxiData.acAvailable ? "Yes" : "No"}
            </p>
          </div>
        </div>
      </div>

      {/* Documents */}
      <div className="border border-slate-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-brand-950 mb-4">Documents Uploaded</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-center">
            <span className={documentData.vehicleRC ? "text-green-600" : "text-slate-400"}>
              {documentData.vehicleRC ? "✓" : "✗"}
            </span>
            <span className="ml-2">Vehicle RC</span>
          </div>
          <div className="flex items-center">
            <span className={documentData.commercialPermit ? "text-green-600" : "text-slate-400"}>
              {documentData.commercialPermit ? "✓" : "✗"}
            </span>
            <span className="ml-2">Commercial Permit</span>
          </div>
          <div className="flex items-center">
            <span className={documentData.insuranceCertificate ? "text-green-600" : "text-slate-400"}>
              {documentData.insuranceCertificate ? "✓" : "✗"}
            </span>
            <span className="ml-2">Insurance Certificate</span>
          </div>
          <div className="flex items-center">
            <span className={documentData.pollutionCertificate ? "text-green-600" : "text-slate-400"}>
              {documentData.pollutionCertificate ? "✓" : "✗"}
            </span>
            <span className="ml-2">Pollution Certificate</span>
          </div>
          <div className="flex items-center">
            <span className={documentData.driverLicense ? "text-green-600" : "text-slate-400"}>
              {documentData.driverLicense ? "✓" : "✗"}
            </span>
            <span className="ml-2">Driver License</span>
          </div>
          <div className="flex items-center">
            <span className={documentData.vehiclePhotos && documentData.vehiclePhotos.length > 0 ? "text-green-600" : "text-slate-400"}>
              {documentData.vehiclePhotos && documentData.vehiclePhotos.length > 0 ? "✓" : "✗"}
            </span>
            <span className="ml-2">
              Vehicle Photos ({documentData.vehiclePhotos?.length || 0})
            </span>
          </div>
        </div>
      </div>

      {/* Service Area */}
      <div className="border border-slate-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-brand-950 mb-4">Service Area</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-ink-muted">Location</p>
            <p className="font-medium text-brand-950">
              {serviceAreaData.operatingCity}, {serviceAreaData.operatingState},{" "}
              {serviceAreaData.operatingCountry}
            </p>
          </div>
          <div>
            <p className="text-sm text-ink-muted">Service Types</p>
            <div className="flex flex-wrap gap-2 mt-1">
              {getServiceTypes().length > 0 ? (
                getServiceTypes().map((type) => (
                  <span
                    key={type}
                    className="inline-block bg-brand-100 text-brand-700 text-xs px-2 py-1 rounded"
                  >
                    {type}
                  </span>
                ))
              ) : (
                <p className="text-slate-400">—</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="border border-slate-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-brand-950 mb-4">Pricing</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-ink-muted">Base Fare</p>
            <p className="font-medium text-brand-950">₹ {pricingData.baseFare || "—"}</p>
          </div>
          <div>
            <p className="text-sm text-ink-muted">Per KM Charge</p>
            <p className="font-medium text-brand-950">₹ {pricingData.perKmCharge || "—"}</p>
          </div>
          {pricingData.driverAllowance && (
            <div>
              <p className="text-sm text-ink-muted">Driver Allowance</p>
              <p className="font-medium text-brand-950">₹ {pricingData.driverAllowance}</p>
            </div>
          )}
          {pricingData.nightCharges && (
            <div>
              <p className="text-sm text-ink-muted">Night Charges</p>
              <p className="font-medium text-brand-950">₹ {pricingData.nightCharges}</p>
            </div>
          )}
          {pricingData.waitingCharges && (
            <div>
              <p className="text-sm text-ink-muted">Waiting Charges</p>
              <p className="font-medium text-brand-950">₹ {pricingData.waitingCharges}/hour</p>
            </div>
          )}
          {getIncludedServices().length > 0 && (
            <div>
              <p className="text-sm text-ink-muted">Included Services</p>
              <p className="font-medium text-brand-950">
                {getIncludedServices().join(", ")}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Availability */}
      <div className="border border-slate-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-brand-950 mb-4">Availability Status</h3>
        <div>
          <p className="text-sm text-ink-muted">Status</p>
          <p className="font-medium text-brand-950 capitalize">
            {availabilityData.status || "—"}
          </p>
        </div>
      </div>

      {/* Important Note */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
        <h4 className="font-semibold text-blue-900 mb-2">✓ Ready to Submit</h4>
        <ul className="text-sm text-blue-900 space-y-1">
          <li>✓ Your taxi will be reviewed by our admin team</li>
          <li>✓ Status will be set to "Pending Approval"</li>
          <li>✓ It won't appear in search results until approved</li>
          <li>✓ You'll receive updates via email and dashboard</li>
          <li>✓ You can manage your taxi from the partner dashboard</li>
        </ul>
      </div>
    </div>
  );
}
