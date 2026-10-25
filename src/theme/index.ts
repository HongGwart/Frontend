import { theme as colors } from './color';
import { globalStyles } from './globalStyles';
import { grid } from './grid';
import { typography } from './typography';

export const theme = {
  ...colors,
  grid,
  typography,
};

export type AppTheme = typeof theme;
export { globalStyles };
