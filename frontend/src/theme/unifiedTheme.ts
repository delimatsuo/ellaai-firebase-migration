import { createTheme } from '@mui/material/styles';

// Extend Material-UI's palette interface
declare module '@mui/material/styles' {
  interface Palette {
    admin: {
      gradient: string;
      headerGradient: string;
      cardHover: string;
    };
  }

  interface PaletteOptions {
    admin?: {
      gradient?: string;
      headerGradient?: string;
      cardHover?: string;
    };
  }
}

// Professional EllaAI Brand Colors - Unified for Main App and Admin
const brandColors = {
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9', // Main brand blue from main app
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  secondary: {
    50: '#f8fafc',   // Light background matching main app
    100: '#f1f5f9',  // Card backgrounds
    200: '#e2e8f0',  // Borders
    300: '#cbd5e1',  // Subtle elements
    400: '#94a3b8',  // Muted text
    500: '#64748b',  // Secondary text
    600: '#475569',  // Dark text
    700: '#334155',  // Darker text
    800: '#1e293b',  // Very dark text
    900: '#0f172a',  // Primary text
  },
  // Professional purple gradient colors
  purple: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',   // Main purple for gradients
    600: '#9333ea',
    700: '#7c3aed',
    800: '#6b46c1',
    900: '#553c9a',
  },
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
  },
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
  },
};

// Typography matching main application
const typography = {
  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  h1: {
    fontSize: '2.5rem',
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: '-0.02em',
  },
  h2: {
    fontSize: '2rem',
    fontWeight: 600,
    lineHeight: 1.3,
    letterSpacing: '-0.01em',
  },
  h3: {
    fontSize: '1.5rem',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  h4: {
    fontSize: '1.25rem',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  h5: {
    fontSize: '1.125rem',
    fontWeight: 500,
    lineHeight: 1.5,
  },
  h6: {
    fontSize: '1rem',
    fontWeight: 600,
    lineHeight: 1.5,
  },
  body1: {
    fontSize: '1rem',
    lineHeight: 1.6,
  },
  body2: {
    fontSize: '0.875rem',
    lineHeight: 1.5,
  },
  caption: {
    fontSize: '0.75rem',
    lineHeight: 1.5,
  },
};

// Create unified theme for main app and admin
export const unifiedTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: brandColors.primary[500],  // #0ea5e9 brand blue
      light: brandColors.primary[400],
      dark: brandColors.primary[600],
      contrastText: '#ffffff',
    },
    secondary: {
      main: brandColors.secondary[600],
      light: brandColors.secondary[500],
      dark: brandColors.secondary[700],
      contrastText: '#ffffff',
    },
    success: {
      main: brandColors.success[500],
      light: brandColors.success[400],
      dark: brandColors.success[600],
      contrastText: '#ffffff',
    },
    warning: {
      main: brandColors.warning[500],
      light: brandColors.warning[400],
      dark: brandColors.warning[600],
      contrastText: '#ffffff',
    },
    error: {
      main: brandColors.error[500],
      light: brandColors.error[400],
      dark: brandColors.error[600],
      contrastText: '#ffffff',
    },
    background: {
      default: '#ffffff',              // Pure white like main app
      paper: brandColors.secondary[50], // #f8fafc light background
    },
    text: {
      primary: brandColors.secondary[900],   // #0f172a dark text
      secondary: brandColors.secondary[600], // #475569 secondary text
      disabled: brandColors.secondary[400],  // #94a3b8 disabled text
    },
    divider: brandColors.secondary[200], // #e2e8f0 subtle borders
    // Add admin-specific extensions
    admin: {
      gradient: `linear-gradient(135deg, ${brandColors.purple[500]} 0%, ${brandColors.primary[500]} 100%)`,
      headerGradient: `linear-gradient(135deg, ${brandColors.purple[400]} 0%, ${brandColors.purple[600]} 100%)`,
      cardHover: brandColors.secondary[100],
    },
  },
  typography,
  shape: {
    borderRadius: 12, // Increased border radius for modern look
  },
  shadows: [
    'none',
    '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px 0 rgb(0 0 0 / 0.06)',
    '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -1px rgb(0 0 0 / 0.06)',
    '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05)',
    '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: 8,
          padding: '10px 20px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          },
        },
        sizeLarge: {
          padding: '12px 24px',
          fontSize: '1rem',
        },
        sizeSmall: {
          padding: '6px 12px',
          fontSize: '0.875rem',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: `1px solid ${brandColors.secondary[200]}`,
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px 0 rgb(0 0 0 / 0.06)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05)',
            transform: 'translateY(-1px)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px 0 rgb(0 0 0 / 0.06)',
        },
        elevation2: {
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -1px rgb(0 0 0 / 0.06)',
        },
        elevation3: {
          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            backgroundColor: brandColors.secondary[50],
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: brandColors.primary[300],
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: brandColors.primary[500],
              borderWidth: 2,
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
          fontSize: '0.875rem',
        },
      },
    },
    // Admin-specific component overrides
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#ffffff',
          borderRight: `1px solid ${brandColors.secondary[200]}`,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: brandColors.secondary[900],
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
          borderBottom: `1px solid ${brandColors.secondary[200]}`,
        },
      },
    },
  },
});

export default unifiedTheme;

// Helper function to create admin gradient backgrounds
export const createAdminGradient = (variant: 'header' | 'card' | 'button' = 'header') => {
  switch (variant) {
    case 'header':
      return `linear-gradient(135deg, ${brandColors.purple[500]} 0%, ${brandColors.primary[500]} 100%)`;
    case 'card':
      return `linear-gradient(135deg, ${brandColors.purple[50]} 0%, ${brandColors.primary[50]} 100%)`;
    case 'button':
      return `linear-gradient(135deg, ${brandColors.primary[500]} 0%, ${brandColors.purple[500]} 100%)`;
    default:
      return `linear-gradient(135deg, ${brandColors.purple[500]} 0%, ${brandColors.primary[500]} 100%)`;
  }
};

// Admin-specific color utilities
export const adminColors = {
  primary: brandColors.primary[500],     // #0ea5e9
  secondary: brandColors.purple[500],    // #a855f7
  success: brandColors.success[500],     // #22c55e
  warning: brandColors.warning[500],     // #f59e0b
  error: brandColors.error[500],         // #ef4444
  background: '#ffffff',                 // Pure white
  surface: brandColors.secondary[50],    // #f8fafc
  text: brandColors.secondary[900],      // #0f172a
  textSecondary: brandColors.secondary[600], // #475569
  border: brandColors.secondary[200],    // #e2e8f0
};