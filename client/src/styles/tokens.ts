/**
 * Semantic token map for programmatic use (charts, inline styles, canvas).
 * Mirrors the CSS custom properties declared in globals.css + tokens.css.
 * Prefer Tailwind utility classes in components; reach for these only when
 * a value must be passed to JS/SVG/style props.
 */

export const color = {
  // Text
  ink: "var(--ink)",
  inkSoft: "var(--ink-soft)",
  inkMuted: "var(--ink-muted)",
  inkSubtle: "var(--ink-subtle)",

  // Surfaces
  surface: "var(--surface)",
  surfaceMuted: "var(--surface-muted)",
  surfaceSunken: "var(--surface-sunken)",

  // Borders
  border: "var(--border)",
  borderSoft: "var(--border-soft)",

  // Primary / link / active
  primary: "var(--brand-600)",
  primarySoft: "var(--brand-50)",

  // Status
  success: "var(--success-600)",
  successSoft: "var(--success-50)",
  warning: "var(--warn-600)",
  warningSoft: "var(--warn-50)",
  danger: "var(--danger-600)",
  dangerSoft: "var(--danger-50)",
} as const;

export const radius = {
  sm: "var(--radius-sm)",
  md: "var(--radius-md)",
  lg: "var(--radius-lg)",
} as const;

export const shadow = {
  card: "var(--shadow-card)",
  cardHover: "var(--shadow-card-hover)",
} as const;

export type ColorToken = keyof typeof color;
