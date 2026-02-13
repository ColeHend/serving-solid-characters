import { Accessor, Component, createEffect, createMemo, createSignal, onCleanup, onMount, Setter, Show } from "solid-js";
import { UserSettings } from "../../models/userSettings";
import { Style } from "../../shared/customHooks/utility/style/styleHook";
import { useNavigate } from "@solidjs/router";
import { Portal } from "solid-js/web";
import { ExtendedTab } from "../../models/extendedTab";
import { Container } from "coles-solid-library";
import styles from "./SideMenu.module.scss";

interface MenuProps {
    defaultShowList: [Accessor<boolean>, Setter<boolean>],
    defaultIsMobile: [Accessor<boolean>, Setter<boolean>],
    defaultUserSettings: [Accessor<UserSettings>, Setter<UserSettings>],
    anchorElement: Accessor<HTMLElement | undefined>;
    location?: "left" | "right";
}

export const SideMenu:Component<MenuProps> = (props) => {
    const [isClosing, setIsClosing] = createSignal(false);
    const [isOpening, setIsOpening] = createSignal(false);
    const [shouldRender, setShouldRender] = createSignal(false);

    const [showSettings, setShowSettings] = createSignal(false);
    const [isTransitioning, setIsTransitioning] = createSignal(false);
    let transitiionTimer: number | undefined;

    const navigate = useNavigate();

    const [showMenu, setShowMenu] = props.defaultShowList;
    const [isMobile, setIsMobile] = props.defaultIsMobile;
    const [userSettings, setUserSettings] = props.defaultUserSettings;

    const [menuRef, setMenuRef] = createSignal<HTMLDivElement | undefined>();
    
    const anchorEl = createMemo(() => props.anchorElement());

    const updatePosition = () => {
        const anchor = anchorEl();
        const menu = menuRef();

        if (anchor && menu) {
            const anchorRect = anchor.getBoundingClientRect();
            const menuRect = menu.getBoundingClientRect();
            
            menu.style.position = 'absolute';

            if (props.location === "left") {
                menu.style.top = `${anchorRect.bottom}px`;
                menu.style.left = `${anchorRect.left}px`;

                menu.classList.add()
            } else if (props.location === "right") {
                menu.style.top = `0`;
                menu.style.left = `${anchorRect.right - menuRect.width}px`;
            }

        }


    };

    const [MenuItems,] = createSignal<ExtendedTab[]>([
        {
          Name: "Characters", 
          Link: "/characters",
          isOpen: false,
          children: [
            { Name: "View", Link: "/characters/view", isOpen: false },
            { Name: "Create", Link: "/characters/create", isOpen: false }
          ]
        }, 
        {
          Name: "Info", 
          Link: "/info",
          isOpen: false,
          children: [
            { Name: "Spells", Link: "/info/spells", isOpen: false },
            { Name: "Feats", Link: "/info/feats", isOpen: false },
            { Name: "Classes", Link: "/info/classes", isOpen: false },
            { Name: "Backgrounds", Link: "/info/backgrounds", isOpen: false },
            { Name: "Items", Link: "/info/items", isOpen: false },
            { Name: "Races", Link: "/info/races", isOpen: false }
          ]
        }, 
        {
          Name: "Homebrew", 
          Link: "/homebrew",
          isOpen: false,
          children: [
            { Name: "Classes", Link: "/homebrew/view?name=classes", isOpen: false },
            { Name: "Subclasses", Link: "/homebrew/view?name=subclasses", isOpen: false },
            { Name: "Backgrounds", Link: "/homebrew/view?name=backgrounds", isOpen: false },
            { Name: "Races", Link: "/homebrew/view?name=races", isOpen: false },
            { Name: "Subraces", Link: "/homebrew/view?name=subraces",isOpen: false},
            { Name: "Spells", Link: "/homebrew/view?name=spells", isOpen: false },
            { Name: "Feats", Link: "/homebrew/view?name=feats", isOpen: false },
            { Name: "Items", Link: "/homebrew/view?name=items", isOpen: false }
          ]
        }
      ].sort((a, b) => a.Name > b.Name ? 1 : -1));


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
    });

    createEffect(() => updatePosition());

    onMount(() => {
        document.body.addEventListener('click', (e) => updatePosition());
        window.addEventListener('resize', (e) => updatePosition());
    })

    onCleanup(() => {
        document.body.removeEventListener('click', (e) => updatePosition());
        window.removeEventListener('resize', (e) => updatePosition());
    })

    const setOpeningClass = ():string => {
        return props.location === "right" ? styles.openingRight : styles.openingLeft;
    }

    const setClosingClass = ():string => {
        return props.location === "right" ? styles.closingRight : styles.closingLeft;
    }

    return <Show when={shouldRender()}>
        <Portal ref={menuRef()}>
            <Container theme="container" ref={ref => setMenuRef(ref)} class={`${styles.sideMenu} ${isOpening() ? setOpeningClass() : ""} ${isClosing() ? setClosingClass() : ""}`}>
                asgasdf
            </Container>
        </Portal>
    </Show>
}

