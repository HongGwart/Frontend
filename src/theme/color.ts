const commonColors = {
  blue: {
    50: '#EBEBF5', // Background_Color
    100: '#C0C2E1',
    200: '#A2A5D2',
    300: '#777CBD',
    400: '#5D62B1',
    500: '#343B9D', // Main Color
    600: '#2F368F', // Logo Color
    700: '#252A6F',
    800: '#1D2056',
    900: '#161942',
  },
  grayscale: {
    white: '#FFFFFF',
    100: '#F5F7FA', // Background_Fill
    200: '#E8EDF3', // Line_Tertiary
    300: '#DDE3EB', // Line_Secondary
    400: '#C3CAD4', // Line_Primary
    600: '#818994', // Text_Tertiary / Icon_Secondary
    700: '#474F5A', // Text_Secondary
    800: '#2E353F', // Button_Fill
    900: '#1B2128', // Icon_Primary
    black: '#111111', // Text_Primary
  },
  sub: {
    beige: '#E8C48C',
    gold: '#B99D70',
    brown: '#826E4E',
  },
  warning: '#FF4433',
  success: '#1BB464',
};

// 의미 기반 별칭
export const semanticColors = {
  text: {
    primary: commonColors.grayscale.black,
    secondary: commonColors.grayscale[700],
    tertiary: commonColors.grayscale[600],
    white: commonColors.grayscale.white,
    whiteSecondary: commonColors.grayscale[300],
  },
  icon: {
    primary: commonColors.grayscale[900],
    secondary: commonColors.grayscale[600],
    white: commonColors.grayscale.white,
  },
  line: {
    primary: commonColors.grayscale[400],
    secondary: commonColors.grayscale[300],
    tertiary: commonColors.grayscale[200],
  },
  background: {
    primary: commonColors.grayscale.white,
    fill: commonColors.grayscale[100],
    color: commonColors.blue[50],
  },
  button: {
    fill: commonColors.grayscale[800],
  },
  main: commonColors.blue[500],
  logo: commonColors.blue[600],
  warning: commonColors.warning,
  success: commonColors.success,
};

export const theme = {
  ...commonColors,
  semantic: semanticColors,
};

export type ThemeColorsType = typeof theme;
