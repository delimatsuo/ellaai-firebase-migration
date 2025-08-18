import { createTheme, Theme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';

// Enterprise color palette with purple gradients
const colors = {
  primary: {
    50: '#f3f1ff',
    100: '#e8e4ff',
    200: '#d4ccff',
    300: '#b8a8ff',
    400: '#9478ff',
    500: '#6B46C1', // Primary purple
    600: '#5b39a8',
    700: '#4d2f8a',
    800: '#41286e',
    900: '#362258',
  },
  secondary: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#9333EA', // Secondary purple
    600: '#7c3aed',
    700: '#6d28d9',
    800: '#5b21b6',
    900: '#4c1d95',
  },
  gradient: {
    primary: 'linear-gradient(135deg, #6B46C1 0%, #9333EA 100%)',
    secondary: 'linear-gradient(135deg, #9333EA 0%, #c084fc 100%)',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    card: 'linear-gradient(135deg, rgba(107, 70, 193, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)',
  },
  neutral: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  glass: {
    light: 'rgba(255, 255, 255, 0.8)',
    medium: 'rgba(255, 255, 255, 0.6)',
    dark: 'rgba(255, 255, 255, 0.4)',
    backdrop: 'rgba(255, 255, 255, 0.1)',
  },
  shadows: {
    glass: '0 8px 32px rgba(31, 38, 135, 0.37)',
    soft: '0 4px 20px rgba(0, 0, 0, 0.08)',
    medium: '0 8px 40px rgba(0, 0, 0, 0.12)',
    strong: '0 16px 60px rgba(0, 0, 0, 0.16)',
    purple: '0 8px 32px rgba(107, 70, 193, 0.3)',
  }
};

// Animation presets
export const animations = {
  transitions: {
    fast: '0.15s ease-out',
    medium: '0.3s ease-out',
    slow: '0.5s ease-out',
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
  keyframes: {
    fadeInUp: {
      '0%': {
        opacity: 0,
        transform: 'translateY(20px)',
      },
      '100%': {
        opacity: 1,
        transform: 'translateY(0)',
      },
    },
    scaleIn: {
      '0%': {
        opacity: 0,
        transform: 'scale(0.8)',
      },
      '100%': {
        opacity: 1,
        transform: 'scale(1)',
      },
    },
    slideInRight: {
      '0%': {
        opacity: 0,
        transform: 'translateX(30px)',
      },
      '100%': {
        opacity: 1,
        transform: 'translateX(0)',
      },
    },
  },
};

// Light theme
const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: colors.primary[500],
      light: colors.primary[300],
      dark: colors.primary[700],
      contrastText: '#ffffff',
    },
    secondary: {
      main: colors.secondary[500],
      light: colors.secondary[300],
      dark: colors.secondary[700],
      contrastText: '#ffffff',
    },
    background: {
      default: '#fafbfc',
      paper: '#ffffff',
    },
    text: {
      primary: colors.neutral[800],
      secondary: colors.neutral[600],
    },
    divider: colors.neutral[200],
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '3.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2.75rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '2.25rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h4: {
      fontSize: '1.875rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    colors.shadows.soft,
    colors.shadows.soft,
    colors.shadows.medium,
    colors.shadows.medium,
    colors.shadows.strong,
    colors.shadows.strong,
    colors.shadows.strong,
    colors.shadows.strong,
    colors.shadows.strong,
    colors.shadows.strong,
    colors.shadows.strong,
    colors.shadows.strong,
    colors.shadows.strong,
    colors.shadows.strong,
    colors.shadows.strong,
    colors.shadows.strong,
    colors.shadows.strong,
    colors.shadows.strong,
    colors.shadows.strong,
    colors.shadows.strong,
    colors.shadows.strong,
    colors.shadows.strong,
    colors.shadows.strong,
    colors.shadows.strong,
  ] as any,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
          backgroundColor: '#fafbfc',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '10px 24px',
          fontSize: '0.9rem',
          fontWeight: 500,
          textTransform: 'none',
          boxShadow: 'none',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: colors.shadows.medium,
          },
        },
        contained: {
          background: colors.gradient.primary,
          '&:hover': {
            background: colors.gradient.primary,
            transform: 'translateY(-2px)',
            boxShadow: colors.shadows.purple,
          },
        },
        outlined: {
          borderWidth: 2,
          '&:hover': {
            borderWidth: 2,
            backgroundColor: alpha(colors.primary[500], 0.04),
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: `1px solid ${colors.neutral[200]}`,
          boxShadow: colors.shadows.soft,
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: colors.shadows.medium,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: `1px solid ${colors.neutral[200]}`,
        },
        elevation1: {
          boxShadow: colors.shadows.soft,
        },
        elevation2: {
          boxShadow: colors.shadows.medium,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${colors.neutral[200]}`,
          boxShadow: colors.shadows.soft,
          color: colors.neutral[800],
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRight: `1px solid ${colors.neutral[200]}`,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-1px)',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: colors.primary[400],
              },
            },
            '&.Mui-focused': {
              transform: 'translateY(-1px)',
              boxShadow: `0 0 0 3px ${alpha(colors.primary[500], 0.1)}`,
            },
          },
        },
      },
    },
  },
});

// Dark theme
const darkTheme = createTheme({
  ...lightTheme,
  palette: {
    mode: 'dark',
    primary: {
      main: colors.primary[400],
      light: colors.primary[300],
      dark: colors.primary[600],
      contrastText: '#ffffff',
    },
    secondary: {
      main: colors.secondary[400],
      light: colors.secondary[300],
      dark: colors.secondary[600],
      contrastText: '#ffffff',
    },
    background: {
      default: colors.neutral[900],
      paper: colors.neutral[800],
    },
    text: {
      primary: colors.neutral[100],
      secondary: colors.neutral[400],
    },
    divider: colors.neutral[700],
  },
  components: {
    ...lightTheme.components,
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${colors.neutral[700]}`,
          boxShadow: colors.shadows.soft,
          color: colors.neutral[100],
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRight: `1px solid ${colors.neutral[700]}`,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: colors.neutral[800],
          border: `1px solid ${colors.neutral[700]}`,
          borderRadius: 16,
          boxShadow: colors.shadows.soft,
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: colors.shadows.medium,
          },
        },
      },
    },
  },
});

// Glass morphism styles
export const glassStyles = {
  light: {
    background: colors.glass.light,
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: `1px solid ${alpha('#ffffff', 0.2)}`,
    borderRadius: 16,
    boxShadow: colors.shadows.glass,
  },
  medium: {
    background: colors.glass.medium,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: `1px solid ${alpha('#ffffff', 0.3)}`,
    borderRadius: 16,
    boxShadow: colors.shadows.glass,
  },
  dark: {
    background: colors.glass.dark,
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: `1px solid ${alpha('#ffffff', 0.4)}`,
    borderRadius: 16,
    boxShadow: colors.shadows.glass,
  },
};

export { colors, lightTheme, darkTheme };
export type { Theme };