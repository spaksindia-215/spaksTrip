import "server-only";

export interface MockCountry {
  Code: string;
  Name: string;
}

export interface MockCity {
  Code: string;
  Name: string;
}

// Sample countries data from TBO API documentation
export const MOCK_COUNTRIES: MockCountry[] = [
  { Code: "IN", Name: "India" },
  { Code: "US", Name: "United States" },
  { Code: "GB", Name: "United Kingdom" },
  { Code: "AU", Name: "Australia" },
  { Code: "CA", Name: "Canada" },
  { Code: "FR", Name: "France" },
  { Code: "DE", Name: "Germany" },
  { Code: "IT", Name: "Italy" },
  { Code: "ES", Name: "Spain" },
  { Code: "JP", Name: "Japan" },
  { Code: "SG", Name: "Singapore" },
  { Code: "TH", Name: "Thailand" },
  { Code: "MX", Name: "Mexico" },
  { Code: "BR", Name: "Brazil" },
  { Code: "ZA", Name: "South Africa" },
  { Code: "AE", Name: "United Arab Emirates" },
  { Code: "NZ", Name: "New Zealand" },
  { Code: "AT", Name: "Austria" },
  { Code: "CH", Name: "Switzerland" },
  { Code: "NL", Name: "Netherlands" },
];

// Sample cities data from TBO API documentation (organized by country code)
export const MOCK_CITIES: Record<string, MockCity[]> = {
  IN: [
    { Code: "100000", Name: "Delhi" },
    { Code: "100001", Name: "Mumbai" },
    { Code: "100002", Name: "Bangalore" },
    { Code: "100003", Name: "Hyderabad" },
    { Code: "100004", Name: "Chennai" },
    { Code: "100005", Name: "Kolkata" },
    { Code: "100006", Name: "Pune" },
    { Code: "100007", Name: "Jaipur" },
    { Code: "100008", Name: "Ahmedabad" },
    { Code: "100009", Name: "Lucknow" },
  ],
  US: [
    { Code: "200000", Name: "New York" },
    { Code: "200001", Name: "Los Angeles" },
    { Code: "200002", Name: "Chicago" },
    { Code: "200003", Name: "Houston" },
    { Code: "200004", Name: "Phoenix" },
    { Code: "200005", Name: "Philadelphia" },
    { Code: "200006", Name: "San Antonio" },
    { Code: "200007", Name: "San Diego" },
    { Code: "200008", Name: "Dallas" },
    { Code: "200009", Name: "San Jose" },
  ],
  GB: [
    { Code: "300000", Name: "London" },
    { Code: "300001", Name: "Manchester" },
    { Code: "300002", Name: "Birmingham" },
    { Code: "300003", Name: "Leeds" },
    { Code: "300004", Name: "Glasgow" },
    { Code: "300005", Name: "Sheffield" },
    { Code: "300006", Name: "Edinburgh" },
    { Code: "300007", Name: "Liverpool" },
    { Code: "300008", Name: "Bristol" },
  ],
  AU: [
    { Code: "400000", Name: "Sydney" },
    { Code: "400001", Name: "Melbourne" },
    { Code: "400002", Name: "Brisbane" },
    { Code: "400003", Name: "Perth" },
    { Code: "400004", Name: "Adelaide" },
    { Code: "400005", Name: "Hobart" },
    { Code: "400006", Name: "Darwin" },
    { Code: "400007", Name: "Canberra" },
  ],
  AT: [
    { Code: "100758", Name: "Abersee" },
    { Code: "100117", Name: "Abfaltersbach" },
    { Code: "100443", Name: "Absam" },
    { Code: "100650", Name: "Abtenau" },
    { Code: "100005", Name: "Vienna" },
    { Code: "100006", Name: "Salzburg" },
    { Code: "100007", Name: "Innsbruck" },
    { Code: "100008", Name: "Graz" },
  ],
};
