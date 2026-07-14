import { Accessor, createMemo, createSignal, onCleanup, onMount } from "solid-js";

type ScreenSize = 'small' | 'medium' | 'large';
interface ScreenSizeInfo {
    screenSize: Accessor<ScreenSize>;
}
interface ScreenSizeThresholds {
    small?: number;
    medium?: number;
}
/**
 * New utility hook to determine if is mobile
 * Should be used in place of isMobile() from coles-solid-library
 * Since isMobile() is not reactive and does not update on window resize
 * @returns An live updating signal with how wide the screen is.
 */
export const getScreenSize = (customSizes?: ScreenSizeThresholds): ScreenSizeInfo  => {
    const [currScreenSize, setCurrScreenSize] = createSignal<ScreenSize>('large');
    const screenSize = createMemo(() => currScreenSize());
    
    const updateScreenSize = () => {
        const width = window.innerWidth;
        if (width < (customSizes?.small ?? 600)) {
            setCurrScreenSize('small');
        } else if (width < (customSizes?.medium ?? 1024)) {
            setCurrScreenSize('medium');
        } else {
            setCurrScreenSize('large');
        }
    };

    onMount(() => {
        updateScreenSize();
        window.addEventListener('resize', updateScreenSize);
    });

    onCleanup(() => {
        window.removeEventListener('resize', updateScreenSize);
    });

    return { screenSize };
};