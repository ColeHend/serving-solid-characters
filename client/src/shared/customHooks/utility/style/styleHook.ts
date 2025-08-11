import themeStyle from './themes/themeStyle.module.scss';
import { createMemo } from 'solid-js';

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
  console.log("useStyle called with styleType:", styleType);
  
  try {
    // Apply background color based on theme
    if (styleType === "light") {
      document.body.style.backgroundColor = "#fff";
      document.body.classList.add("light-theme");
      document.body.classList.remove("dark-theme");
    } else {
      // Default to dark theme
      document.body.style.backgroundColor = "#000";
      document.body.classList.add("dark-theme");
      document.body.classList.remove("light-theme");
    }
    
    console.log("Theme styles applied successfully");
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