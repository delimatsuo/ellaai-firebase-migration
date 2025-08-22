/**
 * Enterprise Design System for EllaAI Admin Interface
 * 
 * A comprehensive design system based on enterprise blue/grey palette
 * Built on 8px spacing grid with consistent typography and components
 */

import { createTheme, Theme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';

// ===== DESIGN TOKENS =====

/**
 * Enterprise Color Palette
 * Professional blue/grey theme suitable for business applications
 */
export const designTokens = {
  // Primary Colors (Enterprise Blue)
  primary: {
    50: '#f0f9ff',   // Very light blue
    100: '#e0f2fe',  // Light blue
    200: '#bae6fd',  // Lighter blue
    300: '#7dd3fc',  // Medium light blue
    400: '#38bdf8',  // Medium blue
    500: '#0ea5e9',  // Primary blue
    600: '#0284c7',  // Dark blue
    700: '#0369a1',  // Darker blue
    800: '#075985',  // Very dark blue
    900: '#0c4a6e',  // Darkest blue
  },

  // Secondary Colors (Professional Grey)
  secondary: {
    50: '#f8fafc',   // Very light grey
    100: '#f1f5f9',  // Light grey
    200: '#e2e8f0',  // Lighter grey
    300: '#cbd5e1',  // Medium light grey
    400: '#94a3b8',  // Medium grey
    500: '#64748b',  // Primary grey
    600: '#475569',  // Dark grey
    700: '#334155',  // Darker grey
    800: '#1e293b',  // Very dark grey
    900: '#0f172a',  // Darkest grey
  },

  // Semantic State Colors
  semantic: {
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',  // Primary success
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',  // Primary warning
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',  // Primary error
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },
    info: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',  // Primary info (same as primary blue)
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
    },
  },

  // Typography Scale (1.25 ratio)
  typography: {
    fontFamily: {
      sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      mono: '"JetBrains Mono", "Fira Code", Consolas, "Liberation Mono", Courier, monospace',
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem',    // 48px
      '6xl': '3.75rem', // 60px
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
    lineHeight: {
      tight: 1.25,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2,
    },
  },

  // Spacing System (8px base)
  spacing: {
    0: '0px',
    1: '0.25rem',  // 4px
    2: '0.5rem',   // 8px
    3: '0.75rem',  // 12px
    4: '1rem',     // 16px
    5: '1.25rem',  // 20px
    6: '1.5rem',   // 24px
    8: '2rem',     // 32px
    10: '2.5rem',  // 40px
    12: '3rem',    // 48px
    16: '4rem',    // 64px
    20: '5rem',    // 80px
    24: '6rem',    // 96px
    32: '8rem',    // 128px
  },

  // Border Radius (consistent scale)
  borderRadius: {
    none: '0px',
    sm: '0.25rem',   // 4px
    base: '0.5rem',  // 8px
    md: '0.75rem',   // 12px
    lg: '1rem',      // 16px
    xl: '1.5rem',    // 24px
    full: '9999px',
  },

  // Elevation/Shadow System
  elevation: {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  },

  // Focus States
  focus: {
    ring: '0 0 0 3px rgba(14, 165, 233, 0.1)',
    ringOffset: '0 0 0 2px white',
  },
};

// ===== COMPONENT SPECIFICATIONS =====

/**
 * Button Component Specifications
 */
export const buttonSpecs = {
  // Size variants
  sizes: {
    sm: {
      padding: `${designTokens.spacing[2]} ${designTokens.spacing[3]}`,
      fontSize: designTokens.typography.fontSize.sm,
      height: '32px',
      iconSize: '16px',
    },
    md: {
      padding: `${designTokens.spacing[3]} ${designTokens.spacing[4]}`,
      fontSize: designTokens.typography.fontSize.base,
      height: '40px',
      iconSize: '20px',
    },
    lg: {
      padding: `${designTokens.spacing[4]} ${designTokens.spacing[6]}`,
      fontSize: designTokens.typography.fontSize.lg,
      height: '48px',
      iconSize: '24px',
    },
  },

  // Style variants
  variants: {
    primary: {
      background: designTokens.primary[500],
      color: 'white',
      hover: {
        background: designTokens.primary[600],
      },
      focus: {
        boxShadow: designTokens.focus.ring,
        background: designTokens.primary[600],
      },
    },
    secondary: {
      background: 'white',
      color: designTokens.secondary[700],
      border: `1px solid ${designTokens.secondary[300]}`,
      hover: {
        background: designTokens.secondary[50],
        border: `1px solid ${designTokens.secondary[400]}`,
      },
      focus: {
        boxShadow: designTokens.focus.ring,
        border: `1px solid ${designTokens.primary[500]}`,
      },
    },
    ghost: {
      background: 'transparent',
      color: designTokens.secondary[700],
      hover: {
        background: designTokens.secondary[100],
      },
      focus: {
        boxShadow: designTokens.focus.ring,
      },
    },
    danger: {
      background: designTokens.semantic.error[500],
      color: 'white',
      hover: {
        background: designTokens.semantic.error[600],
      },
      focus: {
        boxShadow: `0 0 0 3px rgba(239, 68, 68, 0.1)`,
        background: designTokens.semantic.error[600],
      },
    },
  },
};

/**
 * Card Component Specifications
 */
export const cardSpecs = {
  default: {
    background: 'white',
    border: `1px solid ${designTokens.secondary[200]}`,
    borderRadius: designTokens.borderRadius.lg,
    boxShadow: designTokens.elevation.sm,
    padding: designTokens.spacing[6],
  },
  elevated: {
    background: 'white',
    border: 'none',
    borderRadius: designTokens.borderRadius.lg,
    boxShadow: designTokens.elevation.md,
    padding: designTokens.spacing[6],
  },
  interactive: {
    background: 'white',
    border: `1px solid ${designTokens.secondary[200]}`,
    borderRadius: designTokens.borderRadius.lg,
    boxShadow: designTokens.elevation.sm,
    padding: designTokens.spacing[6],
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    hover: {
      borderColor: designTokens.primary[300],
      boxShadow: designTokens.elevation.md,
      transform: 'translateY(-2px)',
    },
  },
};

/**
 * Input Component Specifications
 */
export const inputSpecs = {
  default: {
    height: '40px',
    padding: `${designTokens.spacing[3]} ${designTokens.spacing[4]}`,
    fontSize: designTokens.typography.fontSize.base,
    border: `1px solid ${designTokens.secondary[300]}`,
    borderRadius: designTokens.borderRadius.base,
    background: 'white',
    focus: {
      outline: 'none',
      border: `1px solid ${designTokens.primary[500]}`,
      boxShadow: designTokens.focus.ring,
    },
    error: {
      border: `1px solid ${designTokens.semantic.error[500]}`,
      boxShadow: `0 0 0 3px rgba(239, 68, 68, 0.1)`,
    },
  },
  large: {
    height: '48px',
    padding: `${designTokens.spacing[4]} ${designTokens.spacing[5]}`,
    fontSize: designTokens.typography.fontSize.lg,
  },
  small: {
    height: '32px',
    padding: `${designTokens.spacing[2]} ${designTokens.spacing[3]}`,
    fontSize: designTokens.typography.fontSize.sm,
  },
};

// ===== MATERIAL-UI THEME =====

/**
 * Light Theme Configuration
 */
export const enterpriseLightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: designTokens.primary[500],
      light: designTokens.primary[300],
      dark: designTokens.primary[700],
      contrastText: '#ffffff',
    },
    secondary: {
      main: designTokens.secondary[500],
      light: designTokens.secondary[300],
      dark: designTokens.secondary[700],
      contrastText: '#ffffff',
    },
    success: {
      main: designTokens.semantic.success[500],
      light: designTokens.semantic.success[300],
      dark: designTokens.semantic.success[700],
    },
    warning: {
      main: designTokens.semantic.warning[500],
      light: designTokens.semantic.warning[300],
      dark: designTokens.semantic.warning[700],
    },
    error: {
      main: designTokens.semantic.error[500],
      light: designTokens.semantic.error[300],
      dark: designTokens.semantic.error[700],
    },
    info: {
      main: designTokens.semantic.info[500],
      light: designTokens.semantic.info[300],
      dark: designTokens.semantic.info[700],
    },
    background: {
      default: designTokens.secondary[50],
      paper: '#ffffff',
    },
    text: {
      primary: designTokens.secondary[900],
      secondary: designTokens.secondary[600],
    },
    divider: designTokens.secondary[200],
  },

  typography: {
    fontFamily: designTokens.typography.fontFamily.sans,
    h1: {
      fontSize: designTokens.typography.fontSize['5xl'],
      fontWeight: designTokens.typography.fontWeight.bold,
      lineHeight: designTokens.typography.lineHeight.tight,
      color: designTokens.secondary[900],
    },
    h2: {
      fontSize: designTokens.typography.fontSize['4xl'],
      fontWeight: designTokens.typography.fontWeight.semibold,
      lineHeight: designTokens.typography.lineHeight.tight,
      color: designTokens.secondary[900],
    },
    h3: {
      fontSize: designTokens.typography.fontSize['3xl'],
      fontWeight: designTokens.typography.fontWeight.semibold,
      lineHeight: designTokens.typography.lineHeight.snug,
      color: designTokens.secondary[900],
    },
    h4: {
      fontSize: designTokens.typography.fontSize['2xl'],
      fontWeight: designTokens.typography.fontWeight.semibold,
      lineHeight: designTokens.typography.lineHeight.snug,
      color: designTokens.secondary[900],
    },
    h5: {
      fontSize: designTokens.typography.fontSize.xl,
      fontWeight: designTokens.typography.fontWeight.medium,
      lineHeight: designTokens.typography.lineHeight.snug,
      color: designTokens.secondary[900],
    },
    h6: {
      fontSize: designTokens.typography.fontSize.lg,
      fontWeight: designTokens.typography.fontWeight.medium,
      lineHeight: designTokens.typography.lineHeight.normal,
      color: designTokens.secondary[900],
    },
    body1: {
      fontSize: designTokens.typography.fontSize.base,
      lineHeight: designTokens.typography.lineHeight.relaxed,
      color: designTokens.secondary[700],
    },
    body2: {
      fontSize: designTokens.typography.fontSize.sm,
      lineHeight: designTokens.typography.lineHeight.normal,
      color: designTokens.secondary[600],
    },
    button: {
      textTransform: 'none',
      fontWeight: designTokens.typography.fontWeight.medium,
    },
  },

  shape: {
    borderRadius: parseFloat(designTokens.borderRadius.base.replace('rem', '')) * 16, // Convert rem to px
  },

  shadows: [
    designTokens.elevation.none,
    designTokens.elevation.sm,
    designTokens.elevation.base,
    designTokens.elevation.md,
    designTokens.elevation.md,
    designTokens.elevation.lg,
    designTokens.elevation.lg,
    designTokens.elevation.xl,
    designTokens.elevation.xl,
    designTokens.elevation['2xl'],
    designTokens.elevation['2xl'],
    designTokens.elevation['2xl'],
    designTokens.elevation['2xl'],
    designTokens.elevation['2xl'],
    designTokens.elevation['2xl'],
    designTokens.elevation['2xl'],
    designTokens.elevation['2xl'],
    designTokens.elevation['2xl'],
    designTokens.elevation['2xl'],
    designTokens.elevation['2xl'],
    designTokens.elevation['2xl'],
    designTokens.elevation['2xl'],
    designTokens.elevation['2xl'],
    designTokens.elevation['2xl'],
    designTokens.elevation['2xl'],
  ] as any,

  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          fontWeight: designTokens.typography.fontWeight.medium,
          borderRadius: designTokens.borderRadius.base,
          textTransform: 'none',
          transition: 'all 0.2s ease-in-out',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
            transform: 'translateY(-1px)',
          },
        },
        sizeSmall: buttonSpecs.sizes.sm,
        sizeMedium: buttonSpecs.sizes.md,
        sizeLarge: buttonSpecs.sizes.lg,
        contained: {
          '&:hover': {
            boxShadow: designTokens.elevation.md,
          },
        },
        outlined: {
          borderWidth: '1px',
          '&:hover': {
            borderWidth: '1px',
          },
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          ...cardSpecs.default,
          transition: 'all 0.2s ease-in-out',
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: designTokens.borderRadius.lg,
        },
        outlined: {
          border: `1px solid ${designTokens.secondary[200]}`,
        },
      },
    },

    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: designTokens.borderRadius.base,
            transition: 'all 0.2s ease-in-out',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: designTokens.secondary[400],
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: designTokens.primary[500],
              borderWidth: '1px',
              boxShadow: designTokens.focus.ring,
            },
          },
        },
      },
    },

    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${designTokens.secondary[200]}`,
          boxShadow: designTokens.elevation.sm,
          color: designTokens.secondary[900],
        },
      },
    },

    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRight: `1px solid ${designTokens.secondary[200]}`,
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: designTokens.borderRadius.base,
          fontWeight: designTokens.typography.fontWeight.medium,
        },
      },
    },

    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: designTokens.borderRadius.base,
          border: '1px solid',
        },
        standardSuccess: {
          backgroundColor: designTokens.semantic.success[50],
          borderColor: designTokens.semantic.success[200],
          color: designTokens.semantic.success[800],
        },
        standardError: {
          backgroundColor: designTokens.semantic.error[50],
          borderColor: designTokens.semantic.error[200],
          color: designTokens.semantic.error[800],
        },
        standardWarning: {
          backgroundColor: designTokens.semantic.warning[50],
          borderColor: designTokens.semantic.warning[200],
          color: designTokens.semantic.warning[800],
        },
        standardInfo: {
          backgroundColor: designTokens.semantic.info[50],
          borderColor: designTokens.semantic.info[200],
          color: designTokens.semantic.info[800],
        },
      },
    },
  },
});

/**
 * Dark Theme Configuration
 */
export const enterpriseDarkTheme = createTheme({
  ...enterpriseLightTheme,
  palette: {
    mode: 'dark',
    primary: {
      main: designTokens.primary[400],
      light: designTokens.primary[300],
      dark: designTokens.primary[600],
      contrastText: '#ffffff',
    },
    secondary: {
      main: designTokens.secondary[400],
      light: designTokens.secondary[300],
      dark: designTokens.secondary[600],
      contrastText: '#ffffff',
    },
    background: {
      default: designTokens.secondary[900],
      paper: designTokens.secondary[800],
    },
    text: {
      primary: designTokens.secondary[100],
      secondary: designTokens.secondary[400],
    },
    divider: designTokens.secondary[700],
  },
  components: {
    ...enterpriseLightTheme.components,
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${designTokens.secondary[700]}`,
          color: designTokens.secondary[100],
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRight: `1px solid ${designTokens.secondary[700]}`,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: designTokens.secondary[800],
          border: `1px solid ${designTokens.secondary[700]}`,
          borderRadius: designTokens.borderRadius.lg,
          boxShadow: designTokens.elevation.sm,
        },
      },
    },
  },
});

export default { designTokens, enterpriseLightTheme, enterpriseDarkTheme };