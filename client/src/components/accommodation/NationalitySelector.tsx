"use client";

type NationalityOption = { code: string; name: string };

// Sorted by booking frequency on TBO India platform.
// ISO 3166-1 alpha-2 codes — passed directly as GuestNationality to TBO API.
// TBO India rule: international destinations = Indian nationality only (PAN required).
//                 domestic destinations     = all nationalities (Passport for non-IN).
const NATIONALITIES: NationalityOption[] = [
  { code: "IN", name: "India" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "SG", name: "Singapore" },
  { code: "MY", name: "Malaysia" },
  { code: "TH", name: "Thailand" },
  { code: "AU", name: "Australia" },
  { code: "NZ", name: "New Zealand" },
  { code: "CA", name: "Canada" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "IT", name: "Italy" },
  { code: "ES", name: "Spain" },
  { code: "NL", name: "Netherlands" },
  { code: "RU", name: "Russia" },
  { code: "CN", name: "China" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "QA", name: "Qatar" },
  { code: "KW", name: "Kuwait" },
  { code: "BH", name: "Bahrain" },
  { code: "OM", name: "Oman" },
  { code: "PK", name: "Pakistan" },
  { code: "BD", name: "Bangladesh" },
  { code: "LK", name: "Sri Lanka" },
  { code: "NP", name: "Nepal" },
  { code: "PH", name: "Philippines" },
  { code: "ID", name: "Indonesia" },
  { code: "ZA", name: "South Africa" },
  { code: "NG", name: "Nigeria" },
  { code: "KE", name: "Kenya" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
  { code: "TR", name: "Turkey" },
  { code: "EG", name: "Egypt" },
  { code: "MA", name: "Morocco" },
  { code: "IL", name: "Israel" },
  { code: "JO", name: "Jordan" },
  { code: "VN", name: "Vietnam" },
];

type Props = {
  value: string;
  onChange: (code: string) => void;
};

export default function NationalitySelector({ value, onChange }: Props) {
  const flagUrl = `https://flagcdn.com/${value.toLowerCase()}.svg`;
  const isNonIndian = value !== "IN";

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[12px] font-medium text-ink-muted">Guest Nationality</span>
      <div className="relative flex items-center">
        <img
          src={flagUrl}
          alt=""
          aria-hidden
          width={20}
          height={15}
          className="pointer-events-none absolute left-3 h-[15px] w-5 rounded-[2px] object-cover"
        />
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Guest nationality"
          className="h-11 w-full appearance-none rounded-lg border border-border bg-white pl-9 pr-7 text-[14px] font-semibold text-ink hover:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors"
        >
          {NATIONALITIES.map((n) => (
            <option key={n.code} value={n.code}>
              {n.name}
            </option>
          ))}
        </select>
        <svg
          viewBox="0 0 24 24"
          width={13}
          height={13}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          className="pointer-events-none absolute right-2.5 text-ink-muted"
          aria-hidden
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
      {isNonIndian && (
        <p className="text-[11px] text-amber-600 font-medium leading-tight mt-0.5">
          International hotels: Indian nationality required by TBO India
        </p>
      )}
    </div>
  );
}
