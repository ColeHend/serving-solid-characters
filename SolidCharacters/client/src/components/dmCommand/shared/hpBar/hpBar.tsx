import { Component, createMemo } from "solid-js";
import styles from './hpBar.module.scss';

interface HpBarProps {
    current: number;
    max: number;
}

export const HpBar: Component<HpBarProps> = (props) => {
    const percent = createMemo(() => {
        if (props.max <= 0) return 0;
        return Math.max(0, Math.min(100, (props.current / props.max) * 100));
    });
    const color = createMemo(() => {
        if (percent() > 50) return 'var(--dm-hp-high)';
        if (percent() > 25) return 'var(--dm-hp-mid)';
        return 'var(--dm-hp-low)';
    });
    return <div class={styles.track}>
        <div class={styles.fill} style={{ width: `${percent()}%`, 'background-color': color() }} />
    </div>;
};
