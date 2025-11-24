/**
 * Centralized Color Configuration
 *
 * This file defines all theme colors used throughout the application.
 * Use these constants for inline styles and non-Tailwind color needs.
 *
 * For Tailwind classes, the CSS variables in index.css are automatically applied:
 * - text-foreground → uses textPrimary (blue)
 * - text-muted-foreground → uses textSecondary (black)
 */

export const colors = {
  // Primary Theme Colors
  primary: '#01005a',           // Main brand color (dark blue)
  primaryDark: '#02066F',        // Slightly lighter blue for table headers
  primaryLight: '#6495ED',       // Lighter blue for dark mode and accents

  // Text Colors (Light Mode)
  textPrimary: '#01005a',        // Headings, titles, main text (blue) - was black
  textSecondary: '#000000',      // Body text, descriptions (black) - was grey
  textMuted: '#6b7280',          // Hints, labels, disabled text (grey)
  textWhite: '#FFFFFF',          // White text for dark backgrounds

  // Text Colors (Dark Mode)
  textPrimaryDark: '#6495ED',    // Headings in dark mode (lighter blue)
  textSecondaryDark: '#FFFFFF',  // Body text in dark mode (white)

  // Background Colors
  background: '#FFFFFF',         // Main background (white)
  backgroundDark: '#1a1a1a',     // Dark mode background
  backgroundMuted: '#F9FAFB',    // Muted/secondary background

  // UI Element Colors
  border: '#E5E7EB',             // Border color
  input: '#E5E7EB',              // Input border color
  card: '#FFFFFF',               // Card background

  // Status Colors
  success: '#10B981',            // Green for success states
  error: '#EF4444',              // Red for error states
  warning: '#F59E0B',            // Amber for warning states
  info: '#3B82F6',               // Blue for info states

  // Arrow/Sort Colors
  arrowUp: '#16A34A',            // Green for ascending sort (ArrowUp)
  arrowDown: '#2563EB',          // Blue for descending sort (ArrowDown)
};

/**
 * Semantic Color Names
 * Use these for better code readability and maintainability
 */
export const semanticColors = {
  heading: colors.textPrimary,           // For h1, h2, h3, titles
  body: colors.textSecondary,            // For paragraph text, descriptions
  label: colors.textSecondary,           // For form labels
  placeholder: colors.textMuted,         // For input placeholders
  disabled: colors.textMuted,            // For disabled elements
  link: colors.primary,                  // For links and interactive text
  linkHover: colors.primaryDark,         // For link hover states
};

/**
 * Component-specific Colors
 * Pre-defined colors for common UI components
 */
export const componentColors = {
  button: {
    primary: colors.primary,
    primaryHover: colors.primaryDark,
    text: colors.textWhite,
  },
  table: {
    header: colors.primaryDark,
    headerText: colors.textWhite,
    rowHover: '#F9FAFB',
  },
  badge: {
    success: {
      bg: '#D1FAE5',
      text: '#065F46',
    },
    error: {
      bg: '#FEE2E2',
      text: '#991B1B',
    },
    warning: {
      bg: '#FEF3C7',
      text: '#92400E',
    },
    info: {
      bg: '#DBEAFE',
      text: '#1E40AF',
    },
  },
};

/**
 * Usage Examples:
 *
 * // In JSX with inline styles:
 * <div style={{ color: colors.textPrimary }}>Heading</div>
 * <p style={{ color: colors.textSecondary }}>Description</p>
 *
 * // With semantic names:
 * <h1 style={{ color: semanticColors.heading }}>Title</h1>
 * <label style={{ color: semanticColors.label }}>Name:</label>
 *
 * // With Tailwind classes (automatically uses CSS variables):
 * <h1 className="text-foreground">Title</h1>  // Uses textPrimary (blue)
 * <p className="text-muted-foreground">Text</p>  // Uses textSecondary (black)
 */

export default colors;
