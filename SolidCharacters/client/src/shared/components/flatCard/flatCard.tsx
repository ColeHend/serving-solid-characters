import { Component, createEffect, createMemo, createSignal, JSX, onCleanup, Show, splitProps } from "solid-js";
import styles from "./flatCard.module.scss";
import { Button, Container, Icon } from "coles-solid-library";

interface FlatCardProps extends JSX.HTMLAttributes<HTMLDivElement> {
    icon?: string;
    headerName: JSX.Element;
    children?: JSX.Element;
    alwaysOpen?: boolean;
    startOpen?: boolean;
    extraHeaderJsx?: JSX.Element;
    transparent?: boolean;
}

export const FlatCard:Component<FlatCardProps> = (props) => {
    const [local, others] = splitProps(props, [
        "icon",
        "headerName",
        "children",
        "alwaysOpen",
        "startOpen",
        "extraHeaderJsx",
        "transparent"
    ])

    
    const isAlwaysOpen = () => ("alwaysOpen" in props && local.alwaysOpen !== false);
    const isStartOpen = () => ("startOpen" in props && local.startOpen !== false);
    const isNoIcon = () => (local.icon === undefined);
    const isTransparent = ():boolean => ("transparent" in props && local.transparent !== false);
    
    const [showCard,setShowCard] = createSignal<boolean>(isStartOpen());
    const [contentRef, setContentRef] = createSignal<HTMLDialogElement |undefined>();

    // helper to animate open/close using measured height
    const openAnimated = async () => {
        setShowCard(true);
        const el = contentRef();
        if (!el) return;
        el.style.removeProperty("transition");
        // from 0 to measured px
        el.style.height = "0px";
        // force reflow
        void el.offsetHeight;
        const target = el.scrollHeight + "px";
        el.style.transition = "height 300ms ease, opacity 200ms ease";
        el.style.height = target;
        el.style.opacity = "1";
        const onEnd = (e: TransitionEvent) => {
            if (e.propertyName !== "height") return;
            el.style.height = "auto";
            el.removeEventListener("transitionend", onEnd);
        };
        el.addEventListener("transitionend", onEnd);
    };

    const closeAnimated = () => {
        const el = contentRef();
        
        if (!el) {
            setShowCard(false);
            return;
        }
        
        // from auto to fixed px, then to 0
        const start = el.scrollHeight + "px";
        el.style.height = start;
        // force reflow
        void el.offsetHeight;
        el.style.transition = "height 300ms ease, opacity 200ms ease";
        el.style.height = "0px";
        el.style.opacity = "0";
        const onEnd = (e: TransitionEvent) => {
            if (e.propertyName !== "height") return;
            el.removeEventListener("transitionend", onEnd);
            // finally unmount
            setShowCard(false);
            // cleanup inline styles
            el.style.removeProperty("height");
            el.style.removeProperty("transition");
            el.style.removeProperty("opacity");
        };
        el.addEventListener("transitionend", onEnd);
    };

    const toggle = () => {
        if (isAlwaysOpen()) return;
        if (!showCard()) {
            openAnimated();
        } else {
            closeAnimated();
        }
    };

    onCleanup(() => {
        const el = contentRef();
        if (el) {
            el.removeEventListener("transitionend", () => {});
        }
    });

    createEffect(()=>{
        if (isAlwaysOpen()) {
            setShowCard(true);
        }
    })

    return <Container {...others} theme="surface" class={`${styles.flatCard} ${others.class} ${isTransparent() ? styles.transparent : ''}`}>
        <div class={`${styles.cardHeader}`}>
            <div class={`${styles.iconTitle}`}>
                <Show when={!isNoIcon()}>
                    <Icon name={local.icon ?? "disabled_by_default"} />
                </Show>
                <div>
                    {local.headerName}
                </div>
            </div>
            <div>
                {local.extraHeaderJsx}

                <Show when={!isAlwaysOpen()}>
                    <div tabIndex={0} onKeyDown={(e)=>{
                        if (e.key === "Enter") toggle();
                    }}>
                        <Button onClick={toggle} >
                            {!showCard() ? <Icon name="add"/> : <Icon name="remove" />}
                        </Button>
                    </div>
                </Show>
            </div>
        </div>
        <div class={`${showCard() && !isAlwaysOpen() ? styles.titleBorder : ""}`}></div>
        <Show when={showCard()}>
            <div 
                class={`${styles.cardContent}`} 
                ref={setContentRef}
                aria-hidden={!showCard()}
            >
                {local.children}
            </div>
        </Show>
    </Container>
}