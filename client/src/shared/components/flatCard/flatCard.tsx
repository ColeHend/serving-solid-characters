import { Component, createEffect, createMemo, createSignal, JSX, Show, splitProps } from "solid-js";
import styles from "./flatCard.module.scss";
import { Button, Container, Icon } from "coles-solid-library";

interface FlatCardProps extends JSX.HTMLAttributes<HTMLDivElement> {
    icon: string;
    headerName: string;
    children: JSX.Element;
    alwaysOpen?: boolean;
    startOpen?: boolean;
    extraHeaderJsx?: JSX.Element;
}

export const FlatCard:Component<FlatCardProps> = (props) => {
    const [local, others] = splitProps(props, [
        "icon",
        "headerName",
        "children",
        "alwaysOpen",
        "startOpen",
        "extraHeaderJsx"
    ])

    const [showCard,setShowCard] = createSignal<boolean>(local.startOpen !== undefined ? local.startOpen : false);

    const isAlwaysOpen = () => ("alwaysOpen" in props && local.alwaysOpen !== false);

    createEffect(()=>{
        if (isAlwaysOpen()) {
            setShowCard(true);
        }
    })

    return <Container {...others} theme="surface" class={`${styles.flatCard}`}>
        <div class={`${styles.cardHeader}`}>
            <div class={`${styles.iconTitle}`}>
                <Icon name={local.icon} />
                <h4>{local.headerName}</h4>
            </div>
            <div>
                {local.extraHeaderJsx}
                <Show when={!isAlwaysOpen()}>
                    <Button borderTheme="none" onClick={()=>setShowCard(old=>!old)}>
                        {!showCard() ? "Expand" : "Collapse"}
                    </Button>
                </Show>
            </div>
        </div>
        <Show when={showCard()}>
            <div class={`${styles.cardContent}`}>{local.children}</div>
        </Show>
    </Container>
}