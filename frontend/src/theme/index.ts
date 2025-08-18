// Export all theme-related utilities
export { lightTheme, darkTheme, colors, glassStyles, animations } from './theme';
export type { Theme } from './theme';

// Re-export Material-UI theme utilities for convenience
export { ThemeProvider, createTheme, styled, alpha } from '@mui/material/styles';
export { useTheme } from '@mui/material/styles';