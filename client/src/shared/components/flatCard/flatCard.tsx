import { Component, createEffect, createMemo, createSignal, JSX, Show, splitProps } from "solid-js";
import styles from "./flatCard.module.scss";
import { Button, Container, Icon } from "coles-solid-library";

interface FlatCardProps extends JSX.HTMLAttributes<HTMLDivElement> {
    icon?: string;
    headerName: string;
    children?: JSX.Element;
    alwaysOpen?: boolean;
    startOpen?: boolean;
    noIcon?: boolean;
    extraHeaderJsx?: JSX.Element;
}

export const FlatCard:Component<FlatCardProps> = (props) => {
    const [local, others] = splitProps(props, [
        "icon",
        "headerName",
        "children",
        "alwaysOpen",
        "startOpen",
        "extraHeaderJsx",
        "noIcon"
    ])

    
    const isAlwaysOpen = () => ("alwaysOpen" in props && local.alwaysOpen !== false);
    const isStartOpen = () => ("startOpen" in props && local.startOpen !== false);
    const isNoIcon = () => ("noIcon" in props && local.noIcon !== false);
    
    const [showCard,setShowCard] = createSignal<boolean>(isStartOpen());
    createEffect(()=>{
        if (isAlwaysOpen()) {
            setShowCard(true);
        }
    })

    return <Container {...others} theme="surface" class={`${styles.flatCard} ${others.class}`}>
        <div class={`${styles.cardHeader}`}>
            <div class={`${styles.iconTitle}`}>
                <Show when={!isNoIcon()}>
                    <Icon name={local.icon ?? "disabled_by_default"} />
                </Show>
                <h4>{local.headerName}</h4>
            </div>
            <div>
                {local.extraHeaderJsx}
                <Show when={!isAlwaysOpen()}>
                    <Button borderTheme="none" onClick={()=>setShowCard(old=>!old)}>
                        {!showCard() ? <Icon name="add"/> : <Icon name="remove" />}
                    </Button>
                </Show>
            </div>
        </div>
        <Show when={showCard()}>
            <div class={`${styles.cardContent}`}>{local.children}</div>
        </Show>
    </Container>
}