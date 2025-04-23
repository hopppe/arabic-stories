/**
 * Application theme inspired by Apple design principles
 * Provides consistent colors, spacing, typography, and other design tokens
 */

export const theme = {
  colors: {
    primary: '#0071e3', // Apple blue
    background: '#f5f5f7', // Light gray background
    cardBackground: '#ffffff', // White card backgrounds
    text: {
      primary: '#1d1d1f', // Almost black
      secondary: '#6e6e73', // Medium gray
      tertiary: '#86868b', // Lighter gray
      inverse: '#ffffff', // White text
      link: '#0066cc' // Link blue
    },
    border: '#d2d2d7', // Light border color
    success: '#34c759', // Green
    error: '#ff3b30', // Red
    warning: '#ff9500', // Orange
    highlight: '#007aff' // iOS blue
  },
  
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px'
  },
  
  borderRadius: {
    small: '8px',
    medium: '12px',
    large: '16px',
    full: '9999px'
  },
  
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    fontSize: {
      small: '13px', // Min 11pt per Apple guidelines
      base: '16px',
      medium: '20px',
      large: '24px',
      xlarge: '32px',
      xxlarge: '40px'
    },
    fontWeight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    },
    lineHeight: {
      tight: 1.2,
      base: 1.5,
      relaxed: 1.75
    }
  },
  
  shadows: {
    small: '0 1px 3px rgba(0, 0, 0, 0.1)',
    medium: '0 4px 6px rgba(0, 0, 0, 0.07)',
    large: '0 10px 15px rgba(0, 0, 0, 0.05)'
  },
  
  transitions: {
    default: '0.3s ease',
    fast: '0.15s ease',
    slow: '0.5s ease'
  },
  
  // Minimum touch target size per Apple guidelines
  touchTarget: '44px'
}; 