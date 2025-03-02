import { effect } from 'solid-js/web';
import getUserSettings from '../../userSettings';
import themeStyle from './themes/themeStyle.module.scss';
import { useContext, createMemo } from 'solid-js';
import { SharedHookContext } from '../../../../components/rootApp';
const theme: Style = {
    body: themeStyle.body,
    primary: themeStyle.primary,
    accent: themeStyle.accent,
    tertiary: themeStyle.tertiary,
    warn: themeStyle.warn,
    hover: themeStyle.hover,
    popup: themeStyle.popup,
    table: themeStyle.table,
};

export function useStyle(styleType?: string): Style {
    const [settingStyle, setSettings] = getUserSettings();
    const chosenTheme = styleType ?? settingStyle().theme;
    
    switch (chosenTheme) {
        case "light":
            document.body.style.backgroundColor = "#fff";
            break;
        case "dark":
            document.body.style.backgroundColor = "#000";
            break;
    }
    return theme;
}
export function useUserStyles() {
    const [userSettings, setUserSettings] = getUserSettings();
    const sharedHooks = useContext(SharedHookContext);
    return createMemo(()=>useStyle(userSettings().theme));
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

export default useStyle;