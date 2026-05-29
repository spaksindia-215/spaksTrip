// Validation utilities for TBO hotel guest requirements

export const ALLOWED_TITLES = ["Mr", "Mrs", "Ms"] as const;

export function validateGuestName(name: string): { valid: boolean; error?: string } {
  if (!name || !name.trim()) {
    return { valid: false, error: "Name is required" };
  }
  const trimmed = name.trim();

  if (trimmed.length < 2) {
    return { valid: false, error: "Name must be at least 2 characters" };
  }
  if (trimmed.length > 25) {
    return { valid: false, error: "Name must be at most 25 characters" };
  }

  // Only allow letters, spaces, hyphens, and apostrophes (common in names)
  if (!/^[a-zA-Z\s\-']+$/.test(trimmed)) {
    return { valid: false, error: "Name can only contain letters, spaces, hyphens, and apostrophes" };
  }

  return { valid: true };
}

export function validateGuestAge(age: number | undefined): { valid: boolean; error?: string } {
  if (age === undefined) {
    return { valid: true }; // Age is optional
  }
  if (age < 0 || age > 120) {
    return { valid: false, error: "Age must be between 0 and 120" };
  }
  return { valid: true };
}

export function validateNoDuplicateFirstNames(
  guests: Array<{ firstName: string; [key: string]: any }>,
): { valid: boolean; error?: string } {
  const firstNames = guests
    .map((g) => g.firstName.trim().toLowerCase())
    .filter((name) => name.length > 0);

  const uniqueNames = new Set(firstNames);
  if (uniqueNames.size !== firstNames.length) {
    return {
      valid: false,
      error: "All guests must have different first names",
    };
  }
  return { valid: true };
}
