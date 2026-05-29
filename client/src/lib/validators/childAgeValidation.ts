/**
 * TBO Child Age Validation
 *
 * TBO requires:
 * - ChildrenAges must be between 0-17
 * - Hotels may treat children 12+ as adults (no extra bed/cot)
 * - Ages are needed for accurate pricing
 *
 * Note: If a child is 0-17 years old, they count as a child.
 * Some hotels treat children 12+ as adults but don't provide extra bed/cot.
 */

export const CHILD_AGE_RANGE = {
  MIN_AGE: 0,
  MAX_AGE: 17,
  ADULT_TREATMENT_AGE: 12, // Some hotels treat 12+ as adults
} as const;

export type ChildAgeValidation = {
  valid: boolean;
  error?: string;
  warning?: string;
};

export function validateChildAge(age: number): ChildAgeValidation {
  if (age < CHILD_AGE_RANGE.MIN_AGE) {
    return { valid: false, error: "Child age must be at least 0 years" };
  }
  if (age > CHILD_AGE_RANGE.MAX_AGE) {
    return {
      valid: false,
      error: `Child age cannot exceed ${CHILD_AGE_RANGE.MAX_AGE} years (TBO limit)`,
    };
  }

  // Warn if child is 12+
  if (age >= CHILD_AGE_RANGE.ADULT_TREATMENT_AGE) {
    return {
      valid: true,
      warning:
        "Some hotels treat children 12+ as adults. No extra bed/cot may be provided unless specified.",
    };
  }

  return { valid: true };
}

export function validateChildrenAges(ages: number[]): ChildAgeValidation {
  for (const age of ages) {
    const validation = validateChildAge(age);
    if (!validation.valid) {
      return validation;
    }
  }

  return { valid: true };
}

export function getChildrenAgesDescription(ages: number[]): string {
  if (ages.length === 0) return "No children";
  const ageStrings = ages.map((age) => {
    if (age >= CHILD_AGE_RANGE.ADULT_TREATMENT_AGE) {
      return `${age} (treated as adult by some hotels)`;
    }
    return `${age}`;
  });
  return ageStrings.join(", ");
}
