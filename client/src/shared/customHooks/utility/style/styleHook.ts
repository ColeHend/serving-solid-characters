import { effect } from 'solid-js/web';
import getUserSettings from '../../userSettings';
import darkStyle from './themes/darkTheme.module.scss';
import lightStyle from './themes/lightTheme.module.scss'
const lightTheme: Style = {
    body: lightStyle.body,
    primary: lightStyle.primary,
    accent: lightStyle.accent,
    tertiary: lightStyle.tertiary,
    warn: lightStyle.warn,
    hover: lightStyle.hover,
    popup: lightStyle.popup,
    table: lightStyle.table,
};

const darkTheme: Style = {
    body: darkStyle.body,
    primary: darkStyle.primary,
    accent: darkStyle.accent,
    tertiary: darkStyle.tertiary,
    warn: darkStyle.warn,
    hover: darkStyle.hover,
    popup: darkStyle.popup,
    table: darkStyle.table,
};

export default function useStyle(styleType?: string): Style {
    const [settingStyle, setSettings] = getUserSettings();
    const chosenTheme = styleType ?? settingStyle().theme;
    
    switch (chosenTheme) {
        case "light":
            document.body.style.backgroundColor = "#fff";
            return lightTheme;
        case "dark":
            document.body.style.backgroundColor = "#000";
            return darkTheme;
        default:
            return darkTheme;
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
}