import { Accessor, Component, createEffect, createMemo, createSignal, For, onCleanup, onMount, Setter, Show, untrack } from "solid-js";
import { UserSettings } from "../../models/userSettings";
import { useNavigate } from "@solidjs/router";
import { Portal } from "solid-js/web";
import { ExtendedTab } from "../../models/extendedTab";
import { Button, Container, ExpansionPanel, Icon, Modal } from "coles-solid-library";
import styles from "./SideMenu.module.scss";
import useClickOutside from "solid-click-outside";
import { FlatCard } from "../../shared/components/flatCard/flatCard";
import SettingsPopup from "./settings/settingsPopup";



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
                menu.style.left = `${document.body.getBoundingClientRect().left}px`;

            } else if (props.location === "right") {
                menu.style.top = `${anchorRect.bottom}px`;
                menu.style.right = `${document.body.getBoundingClientRect().left}px`;
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
            { Name: "Create", Link: "/characters/create", isOpen: false },
            // { Name: "PDF Create", Link: "/characters/pdfCreate", isOpen: false}
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

        useClickOutside(menuRef, () => {
            if (showMenu() && showSettings() !== true) setShowMenu(false);
        });
    });

    const setOpeningClass = ():string => {
        return props.location === "right" ? styles.openingRight : styles.openingLeft;
    }

    const setClosingClass = ():string => {
        return props.location === "right" ? styles.closingRight : styles.closingLeft;
    }

    const convertHombrewViewToCreate = (link: string) => {
        return link.replace(`view`, 'create').replace("?name=", "/");
    };
  

    createEffect(() => updatePosition());


    return <Show when={shouldRender()}>
        <Portal ref={menuRef()}>
            <Container theme="container" ref={ref => setMenuRef(ref)} class={`${styles.sideMenu} ${isOpening() ? setOpeningClass() : ""} ${isClosing() ? setClosingClass() : ""}`}>
               <ul>
                    <li class={`${styles.headerItem}`}>
                        <h3 onClick={(e)=>{
                            e.stopPropagation();
                            navigate("/");
                        }}>Naviagtion</h3>

                        <Button onClick={()=>setShowSettings(old=>!old)}>
                            <Icon name="settings" size={'large'} />
                        </Button>
                    </li>

                    <For each={MenuItems()}>
                        {(tab) => <>
                            <Show when={tab.Name !== "Homebrew"}>
                                <li>
                                    <FlatCard headerName={<span class={`${styles.headerItem}`} onClick={()=>navigate(tab.Link)}>{tab.Name}</span>} transparent>
                                        <For each={tab.children ?? []}>
                                            {(child) => <li class={`${styles.menuItem}`} onClick={()=>{
                                                navigate(child.Link);
                                                setShowMenu(false);
                                            }}>
                                                {child.Name}
                                            </li>}
                                        </For>  
                                    </FlatCard>
                                </li>
                            </Show>
                            <Show when={tab.Name === "Homebrew"}>
                                <FlatCard headerName={<span class={`${styles.headerItem}`} onClick={()=>navigate(tab.Link)}>{tab.Name}</span>} transparent>
                                    <For each={tab.children ?? []}>
                                        {(child) => <li class={`${styles.menuItem}`} onClick={()=>{
                                            navigate(child.Link);
                                            setShowMenu(false);
                                        }}>
                                            <span>{child.Name}</span>
                                            <Button transparent onClick={(e)=>{
                                                e.stopPropagation();
                                                navigate(child.Link);
                                                setShowMenu(false);
                                            }} >
                                                <Icon name="visibility" size={'small'} />
                                            </Button>
                                            <Button transparent onClick={(e)=>{
                                                e.stopPropagation()
                                                const x = convertHombrewViewToCreate(child.Link);

                                                navigate(x.trim());
                                                setShowMenu(false);
                                            }}>
                                                <Icon name="edit" size={'small'} />
                                            </Button>
                                        </li>}
                                    </For>  
                                </FlatCard>
                            </Show>
                        </>}
                    </For>
                </ul>
            </Container>
        </Portal>
        <Modal title="Settings" show={[showSettings, setShowSettings]}>
            <SettingsPopup 
                defaultUserSettings={userSettings} 
                setDefaultUserSettings={setUserSettings} />
        </Modal>
    </Show>
}

