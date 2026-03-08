import { Accessor, Component, createEffect, createMemo, createSignal, JSX, Setter, Show, splitProps } from "solid-js";
import { Portal } from "solid-js/web";
import { Container } from "coles-solid-library";
import styles from "./SideMenu.module.scss";
import useClickOutside from "solid-click-outside";

interface MenuProps extends JSX.HTMLAttributes<HTMLDivElement> {
    show: [Accessor<boolean>, Setter<boolean>],
    anchorElement: Accessor<HTMLElement | undefined>;
    location?: "left" | "right";
    children: JSX.Element;
}

const highestZIndex:number = 0;

export const SideMenu:Component<MenuProps> = (props) => {
    const [local, other] = splitProps(props, ["anchorElement","children","location","show"]);

    const [isClosing, setIsClosing] = createSignal(false);
    const [isOpening, setIsOpening] = createSignal(false);
    const [shouldRender, setShouldRender] = createSignal(false);

    const [showMenu, setShowMenu] = local.show;

    const [menuRef, setMenuRef] = createSignal<HTMLDivElement | undefined>();
    
    const anchorEl = createMemo(() => local.anchorElement());

    const isTopmost = () => {
        const menu = menuRef();
        if (!menu) return false;
        const menuZ = +window.getComputedStyle(menu).zIndex;
        return menuZ >= highestZIndex;
    };

    const updatePosition = () => {
        const anchor = anchorEl();
        const menu = menuRef();

        if (anchor && menu) {
            const anchorRect = anchor.getBoundingClientRect();
            // const menuRect = menu.getBoundingClientRect();
            
            menu.style.position = 'absolute';

            if (local.location === "left") {
                menu.style.top = `${anchorRect.bottom}px`;
                menu.style.left = `${document.body.getBoundingClientRect().left}px`;

            } else if (local.location === "right") {
                menu.style.top = `${anchorRect.bottom}px`;
                menu.style.right = `${document.body.getBoundingClientRect().left}px`;
            }

        }


    };

    createEffect(()=>{
        if (showMenu()) {
            setShouldRender(true);
            setIsClosing(false);
            setIsOpening(true);
            
            // Remove opening class after animation
            setTimeout(() => {
                setIsOpening(false);
            }, 300);
        } else if (shouldRender()) {
            setIsClosing(true);
            setIsOpening(false);

            // Remove after animation completes
            setTimeout(() => {
                setShouldRender(false);
                setIsClosing(false);
            },300)
        }

        useClickOutside(menuRef, () => {
            if (showMenu() !== true) {
                if (isTopmost()) setShowMenu(false); // this doesn't work properly. this can only setShowMenu to false when its the topmost element being displayed.
            };
        });
    });

    const setOpeningClass = ():string => {
        return local.location === "right" ? styles.openingRight : styles.openingLeft;
    }

    const setClosingClass = ():string => {
        return local.location === "right" ? styles.closingRight : styles.closingLeft;
    }

    createEffect(() => updatePosition());


    return <Show when={shouldRender()}>
        <Portal ref={menuRef()}>
            <Container theme="container" {...other} ref={ref => setMenuRef(ref)} class={`${styles.sideMenu} ${isOpening() ? setOpeningClass() : ""} ${isClosing() ? setClosingClass() : ""}`}>
              {local.children}
            </Container>
        </Portal>
    </Show>
}

