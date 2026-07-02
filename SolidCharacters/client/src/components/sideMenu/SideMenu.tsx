import {
  Accessor,
  Component,
  createEffect,
  createMemo,
  createSignal,
  For,
  Setter,
  Show,
} from "solid-js";
import { UserSettings } from "../../models/userSettings";
import { useNavigate } from "@solidjs/router";
import { Portal } from "solid-js/web";
import { ExtendedTab } from "../../models/extendedTab";
import { Button, Container, Icon, Modal } from "coles-solid-library";
import { Settings } from "coles-solid-library/icons";
import styles from "./SideMenu.module.scss";
import useClickOutside from "solid-click-outside";
import { FlatCard } from "../../shared/components/flatCard/flatCard";
import SettingsPopup from "./settings/settingsPopup";

interface MenuProps {
  defaultShowList: [Accessor<boolean>, Setter<boolean>];
  defaultIsMobile: [Accessor<boolean>, Setter<boolean>];
  defaultUserSettings: [Accessor<UserSettings>, Setter<UserSettings>];
  anchorElement: Accessor<HTMLElement | undefined>;
  location?: "left" | "right";
}

export const SideMenu: Component<MenuProps> = (props) => {
  const [isClosing, setIsClosing] = createSignal(false);
  const [isOpening, setIsOpening] = createSignal(false);
  const [shouldRender, setShouldRender] = createSignal(false);

  const [showSettings, setShowSettings] = createSignal(false);

  const navigate = useNavigate();

  const [showMenu, setShowMenu] = props.defaultShowList;
  const isMobile = props.defaultIsMobile[0];
  const [userSettings, setUserSettings] = props.defaultUserSettings;

  const [menuRef, setMenuRef] = createSignal<HTMLDivElement | undefined>();

  const anchorEl = createMemo(() => props.anchorElement());

  const updatePosition = () => {
    const anchor = anchorEl();
    const menu = menuRef();

    if (anchor && menu) {
      const anchorRect = anchor.getBoundingClientRect();
      // const menuRect = menu.getBoundingClientRect();

      menu.style.position = "absolute";

      if (props.location === "left") {
        menu.style.top = `${anchorRect.bottom}px`;
        menu.style.left = `${document.body.getBoundingClientRect().left}px`;
      } else if (props.location === "right") {
        menu.style.top = `${anchorRect.bottom}px`;
        menu.style.right = `${document.body.getBoundingClientRect().left}px`;
      }
    }
  };

  const [MenuItems] = createSignal<ExtendedTab[]>([
    {
      Name: "Characters",
      Link: "/characters",
      isOpen: false,
      children: [
        { Name: "View", Link: "/characters/view", isOpen: false },
        { Name: "Create", Link: "/characters/create", isOpen: false },
        { Name: "Sheet Mapper", Link: "/characters/pdfCreate", isOpen: false },
      ],
    },
    {
      Name: "Homebrew",
      isOpen: false,
      children: [
        { Name: "Classes", Link: "/homebrew/create/classes", isOpen: false },
        {
          Name: "Subclasses",
          Link: "/homebrew/create/subclasses",
          isOpen: false,
        },
        {
          Name: "Backgrounds",
          Link: "/homebrew/create/backgrounds",
          isOpen: false,
        },
        { Name: "Races", Link: "/homebrew/create/races", isOpen: false },
        { Name: "Subraces", Link: "/homebrew/create/subraces", isOpen: false },
        { Name: "Spells", Link: "/homebrew/create/spells", isOpen: false },
        { Name: "Feats", Link: "/homebrew/create/feats", isOpen: false },
        { Name: "Items", Link: "/homebrew/create/items", isOpen: false },
      ],
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
        { Name: "Races", Link: "/info/races", isOpen: false },
      ],
    },
    {
      Name: "DM",
      isOpen: false,
      children: [{ Name: "DM Tools", Link: "/dm/command", isOpen: false }],
    },
  ]);

  createEffect(() => {
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
      }, 300);
    }

    useClickOutside(menuRef, () => {
      if (showSettings() !== true) setShowMenu(false);
    });
  });

  const setOpeningClass = (): string => {
    return props.location === "right"
      ? styles.openingRight
      : styles.openingLeft;
  };

  const setClosingClass = (): string => {
    return props.location === "right"
      ? styles.closingRight
      : styles.closingLeft;
  };

  createEffect(() => updatePosition());

  return (
    <Show when={shouldRender()}>
      <Portal ref={menuRef()}>
        <Container
          theme="container"
          ref={(ref) => setMenuRef(ref)}
          class={`${styles.sideMenu} ${isOpening() ? setOpeningClass() : ""} ${isClosing() ? setClosingClass() : ""}`}
        >
          <ul>
            <li class={`${styles.headerItem}`}>
              <h3
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/");
                }}
              >
                Naviagtion
              </h3>

              <Button onClick={() => setShowSettings((old) => !old)}>
                <Icon icon={Settings} size={"large"} />
              </Button>
            </li>

            <For each={MenuItems()}>
              {(tab) => (
                <>
                  <li>
                    <FlatCard
                      headerName={
                        <span
                          class={`${styles.headerItem}`}
                          onClick={() =>
                            !tab.Link ? null : navigate(tab.Link)
                          }
                          style={{
                            'cursor': !tab.Link ? 'auto' : 'pointer'
                          }}
                        >
                          {tab.Name}
                        </span>
                      }
                      transparent
                    >
                      <For each={tab.children ?? []}>
                        {(child) => (
                          <li
                            class={`${styles.menuItem}`}
                            onClick={() => {
                              !child.Link ? null : navigate(child.Link);
                              setShowMenu(false);
                            }}
                          >
                            {child.Name}
                          </li>
                        )}
                      </For>
                    </FlatCard>
                  </li>
                </>
              )}
            </For>
          </ul>
        </Container>
      </Portal>
      <Modal
        title="Settings"
        show={[showSettings, setShowSettings]}
        width="min(640px, 92vw)"
        height={isMobile() ? "95vh" : "70vh"}
      >
        <SettingsPopup
          defaultUserSettings={userSettings}
          setDefaultUserSettings={setUserSettings}
        />
      </Modal>
    </Show>
  );
};
