import { Component, splitProps } from "solid-js";

interface SparkIconProps {
    size?: number;
    color?: string;
    [key: string]: any;
}

/***
 * A simple spark icon component that can be used to represent AI-related features or actions. 
 */
const SparkIcon: Component<SparkIconProps> = (props) => {
    const [local, others] = splitProps(props, ["size", "color"]);
    const size = () => local.size ?? 24;
    const color = () => local.color ?? "var(--on-surface-color)";

    return (
        <svg
            {...others}
            width={size()}
            height={size()}
            style={{ fill: color(), color: color() }}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
        >
            <path d="M12 2l1.86 4.75L18.1 8l-3.1 2.35L15.6 15 12 12.75 8.4 15l.6-4.65L6 8l4.24-1.25L12 2z" fill={color()} />
        </svg>
    );
};

export default SparkIcon;