/* eslint-disable @typescript-eslint/no-require-imports */
import themeStyle from './themes/themeStyle.module.scss';
import { createMemo } from 'solid-js';
import { getTheme } from './themeRegistry';

// Define a default style to fall back to if there are any issues
const defaultStyle: Style = {
  body: themeStyle.body || 'default-body-class',
  primary: themeStyle.primary || 'default-primary-class',
  accent: themeStyle.accent || 'default-accent-class',
  tertiary: themeStyle.tertiary || 'default-tertiary-class',
  warn: themeStyle.warn || 'default-warn-class',
  hover: themeStyle.hover || 'default-hover-class',
  popup: themeStyle.popup || 'default-popup-class',
  table: themeStyle.table || 'default-table-class',
  box: themeStyle.box || 'default-box-class',
};

export function useStyle(styleType?: string): Style {
  // Adding console logging to help debug style issues
  
  try {
    // Map any theme id (including variants like 'parchment') to its base mode. The body
    // background itself comes from var(--background-color) — never set it inline here, or it
    // would override the active palette.
    if (getTheme(styleType).base === "light") {
      document.body.classList.add("light-theme");
      document.body.classList.remove("dark-theme");
    } else {
      document.body.classList.add("dark-theme");
      document.body.classList.remove("light-theme");
    }
    
    return defaultStyle;
  } catch (error) {
    console.error("Error applying styles:", error);
    // Return the default style if there's an error
    return defaultStyle;
  }
}

export function useUserStyles() {
  try {
    // Import getUserSettings dynamically to avoid circular dependency
    const { getUserSettings } = require('../../userSettings');
    const [userSettings] = getUserSettings();
    
    return createMemo(() => {
      try {
        const theme = userSettings().theme;
        console.log("User theme from useUserStyles:", theme);
        return useStyle(theme);
      } catch (error) {
        console.error("Error in useUserStyles memo:", error);
        return defaultStyle;
      }
    });
  } catch (error) {
    console.error("Failed to get user settings in useUserStyles:", error);
    // Return a function that returns the default style
    return () => defaultStyle;
  }
}

export interface Style {
  body: CSSModuleClasses[string];
  primary: CSSModuleClasses[string];
  accent: CSSModuleClasses[string];
  tertiary: CSSModuleClasses[string];
  warn: CSSModuleClasses[string];
  hover: CSSModuleClasses[string];
  popup: CSSModuleClasses[string];
  table: CSSModuleClasses[string];
  box: CSSModuleClasses[string];
}

export default useStyle;