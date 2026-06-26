import { Component, splitProps, JSX, Show } from "solid-js";
import styles from "./dndDialogButton.module.scss";


interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
    roundel?: boolean;
    transparent?: boolean;
}

export const DndDialogButton: Component<ButtonProps> = (props) => {
    const [local, others] = splitProps(props, ["roundel"]);

    const hasRoundel = () => ("roundel" in props && props.roundel !== false);
    const isTransparent = () => ("transparent" in props && props.transparent !== false);
    const explicitType = () => (props.type ?? 'button');
    
    return <button 
        {...others}
        type={explicitType()} 
        class={`${styles.dndStyledButton} ${props.class ?? ""} ${isTransparent() ? styles.transparent : ""}`}>
            <div class={`${hasRoundel() ? styles.roundel : ""}`}>
                {props.children}
            </div>
    </button>
}