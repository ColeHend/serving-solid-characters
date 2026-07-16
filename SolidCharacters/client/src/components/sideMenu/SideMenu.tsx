import {
  Accessor,
  Component,
  createEffect,
  createMemo,
  createSignal,
  Setter,
  Show,
} from "solid-js";
import { UserSettings } from "../../models/userSettings";
import { useLocation, useNavigate } from "@solidjs/router";
import { Portal } from "solid-js/web";
import { Container, Modal } from "coles-solid-library";
import styles from "./SideMenu.module.scss";
import useClickOutside from "solid-click-outside";
import SettingsPopup from "./settings/settingsPopup";
import { SettingsTab } from "./settings/folderTabs.shared";
import { SECTIONS, SectionId, resolveActiveSection } from "./sideMenu.shared";
import { NavRail } from "./NavRail";
import { NavPanel } from "./NavPanel";
import { refreshRecent } from "../../shared/customHooks/useRecentItems";

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
  const [settingsInitialTab, setSettingsInitialTab] = createSignal<
    SettingsTab | undefined
  >(undefined);

  const navigate = useNavigate();
  const location = useLocation();

  const [showMenu, setShowMenu] = props.defaultShowList;
  const isMobile = props.defaultIsMobile[0];
  const [userSettings, setUserSettings] = props.defaultUserSettings;

  const [activeSection, setActiveSection] = createSignal<SectionId>(
    resolveActiveSection(location.pathname),
  );
  const currentSection = createMemo(
    () => SECTIONS.find((s) => s.id === activeSection()) ?? SECTIONS[0],
  );

  const [menuRef, setMenuRef] = createSignal<HTMLDivElement | undefined>();

  const anchorEl = createMemo(() => props.anchorElement());

  const updatePosition = () => {
    const anchor = anchorEl();
    const menu = menuRef();

    if (anchor && menu) {
      const anchorRect = anchor.getBoundingClientRect();

      menu.style.position = "absolute";
      // Explicit height so the RECENT block can pin to the drawer's bottom.
      menu.style.height = `calc(100dvh - ${anchorRect.bottom}px)`;

      if (props.location === "left") {
        menu.style.top = `${anchorRect.bottom}px`;
        menu.style.left = `${document.body.getBoundingClientRect().left}px`;
      } else if (props.location === "right") {
        menu.style.top = `${anchorRect.bottom}px`;
        menu.style.right = `${document.body.getBoundingClientRect().left}px`;
      }
    }
  };

  createEffect(() => {
    if (showMenu()) {
      setActiveSection(resolveActiveSection(location.pathname));
      refreshRecent();

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

  // The gear must not inherit "Account" from a prior avatar click.
  createEffect(() => {
    if (!showSettings()) setSettingsInitialTab(undefined);
  });

  const openSettings = (tab?: SettingsTab) => {
    setSettingsInitialTab(tab);
    setShowSettings(true);
  };

  const handleNavigate = (route: string) => {
    navigate(route);
    setShowMenu(false);
  };

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
          <div class={styles.shell}>
            <NavRail
              activeSection={activeSection()}
              onSelectSection={setActiveSection}
              username={userSettings().username}
              onOpenSettings={openSettings}
            />
            <NavPanel
              section={currentSection()}
              onNavigate={handleNavigate}
              onClose={() => setShowMenu(false)}
            />
          </div>
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
          initialTab={settingsInitialTab()}
        />
      </Modal>
    </Show>
  );
};
