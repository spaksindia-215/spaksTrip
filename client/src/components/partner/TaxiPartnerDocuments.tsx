"use client";

import { ChangeEvent, useState } from "react";

type DocumentData = {
  vehicleRC?: File;
  commercialPermit?: File;
  insuranceCertificate?: File;
  pollutionCertificate?: File;
  driverLicense?: File;
  vehiclePhotos: File[];
};

interface Props {
  data: Partial<DocumentData>;
  onDataChange: (data: Partial<DocumentData>) => void;
}

interface DocumentField {
  key: keyof DocumentData;
  label: string;
  required: boolean;
  hint: string;
}

const documentFields: DocumentField[] = [
  {
    key: "vehicleRC",
    label: "Vehicle RC (Registration Certificate)",
    required: true,
    hint: "PDF or image of your vehicle's registration certificate",
  },
  {
    key: "commercialPermit",
    label: "Commercial Permit",
    required: true,
    hint: "Commercial taxi permit from your transport authority",
  },
  {
    key: "insuranceCertificate",
    label: "Insurance Certificate",
    required: true,
    hint: "Current insurance certificate for your vehicle",
  },
  {
    key: "pollutionCertificate",
    label: "Pollution Certificate (PUC)",
    required: true,
    hint: "Pollution under control certificate",
  },
  {
    key: "driverLicense",
    label: "Driver License",
    required: true,
    hint: "Valid driver's license of the assigned driver",
  },
];

export default function TaxiPartnerDocuments({ data, onDataChange }: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFileChange = (field: keyof DocumentData, file: File | undefined) => {
    onDataChange({ ...data, [field]: file });
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  const handleVehiclePhotosChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      handleFileChange("vehiclePhotos", files as any);
    }
  };

  const getFileName = (file: File | undefined): string => {
    return file?.name || "No file selected";
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-brand-950">Documents & Verification</h2>
        <p className="mt-2 text-ink-muted">
          Upload required documents for verification
        </p>
      </div>

      <div className="space-y-6">
        {documentFields.map((field) => (
          <div key={field.key} className="border border-slate-200 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <label className="block text-sm font-medium text-brand-950">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>
              {data[field.key] && (
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                  ✓ Uploaded
                </span>
              )}
            </div>
            <p className="text-sm text-ink-muted mb-3">{field.hint}</p>
            <input
              type="file"
              accept=".pdf,image/*"
              onChange={(e) => handleFileChange(field.key, e.target.files?.[0])}
              className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-brand-100 file:text-brand-700 hover:file:bg-brand-200"
            />
            {data[field.key] && (
              <p className="mt-2 text-sm text-slate-600">
                Selected: {getFileName(data[field.key] as File)}
              </p>
            )}
            {errors[field.key] && (
              <p className="mt-2 text-sm text-red-600">{errors[field.key]}</p>
            )}
          </div>
        ))}

        <div className="border border-slate-200 rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <label className="block text-sm font-medium text-brand-950">
              Additional Vehicle Photos *
            </label>
            {data.vehiclePhotos && data.vehiclePhotos.length > 0 && (
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                ✓ {data.vehiclePhotos.length} photos
              </span>
            )}
          </div>
          <p className="text-sm text-ink-muted mb-3">
            Upload 3-5 high-quality photos of your vehicle (front, side, back, interior)
          </p>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleVehiclePhotosChange}
            className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-brand-100 file:text-brand-700 hover:file:bg-brand-200"
          />
          {data.vehiclePhotos && data.vehiclePhotos.length > 0 && (
            <p className="mt-2 text-sm text-slate-600">
              {data.vehiclePhotos.length} photo(s) selected
            </p>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>Note:</strong> All documents will be verified by our admin team. Ensure all documents are clear, valid, and not expired.
        </p>
      </div>
    </div>
  );
}
