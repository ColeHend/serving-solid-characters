import darkStyle from './themes/darkTheme.module.scss';
import lightStyle from './themes/lightTheme.module.scss'
const lightTheme: Style = {
    primary: lightStyle.primary,
    accent: lightStyle.accent,
    warn: lightStyle.warn,
    hover: lightStyle.hover,
    popup: lightStyle.popup,
    table: lightStyle.table,
    tBody: lightStyle.tBody,
    tHead: lightStyle.tHead
};

const darkTheme: Style = {
    primary: darkStyle.primary,
    accent: darkStyle.accent,
    warn: darkStyle.warn,
    hover: darkStyle.hover,
    popup: darkStyle.popup,
    table: darkStyle.table,
    tBody: darkStyle.tBody,
    tHead: darkStyle.tHead
};

export default function useStyle(styleType: string = 'dark'): Style {
    switch (styleType.toLowerCase()) {
        case "light":
            return lightTheme;
        case "dark":
            document.body.style.backgroundColor = "#212121";
            return darkTheme;
        default:
            return darkTheme;
    }
}

export interface Style {
    primary: CSSModuleClasses[string];
    accent: CSSModuleClasses[string];
    warn: CSSModuleClasses[string];
    hover: CSSModuleClasses[string];
    popup: CSSModuleClasses[string];
    table: CSSModuleClasses[string];
    tBody?: CSSModuleClasses[string];
    tHead?: CSSModuleClasses[string];
}