
import { Accessor, Component, createMemo, createSignal, For, JSX, Show } from "solid-js";
import useStyles from "../../../shared/customHooks/utility/style/styleHook";
import style from "./Button.module.scss";
import { Portal } from "solid-js/web";
import { useInjectServices } from "../../customHooks/injectServices";
import getUserSettings from "../../customHooks/userSettings";
import useClickOutside from "solid-click-outside";
export interface MenuButton {
  name: string,
  condition?: () => boolean,
  action: () => void
}
interface ShowMenu {
  show: boolean,
  lastX: number,
  lastY: number
}
interface Props extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
    menuItems?: MenuButton[],
    overrideX?: string,
    overrideY?: string,
    menuStyle?: CSSModuleClasses[string],
    enableBackgroundClick?: boolean,
    onClick?: (e: MouseEvent) => unknown,
    transparent?: boolean
    styleType?: "primary" | "accent" | "tertiary"
}

const Button: Component<Props> = (props) => {
  const [showMenu, setShowMenu] = createSignal<ShowMenu>({ show: false, lastX: 0, lastY: 0 });
  const isMenuButton = createMemo(() => !!props.menuItems && showMenu().show);
  const filteredMenuItems = createMemo(() => props.menuItems?.filter(x => (x.condition ? x.condition() : true)) ?? []);
  const sharedHooks = useInjectServices();
  const [userSettings] = getUserSettings();
  const styleTypeConst = props.styleType ?? "accent";
  const stylin = createMemo(() => useStyles(userSettings().theme));

  const [menuRef, setMenuRefer] = createSignal<HTMLDivElement>();
  const menuStyle: Accessor<JSX.CSSProperties> = createMemo(() => ({
    position: "absolute",
    top: props.overrideY ?? `${showMenu().lastY}px`,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    left: props.overrideX ?? `${showMenu().lastX < 45 ? showMenu().lastX - +(menuRef() ? (menuRef() as any).width : '0') : showMenu().lastX}px`,
    display: `${showMenu().show ? "block" : "none"}`
  } as JSX.CSSProperties));

  useClickOutside(menuRef, () => {
    const xClose = Math.abs(sharedHooks.getMouse().x - showMenu().lastX) < 20;
    const yClose = Math.abs(sharedHooks.getMouse().y - showMenu().lastY) < 20;
    if (showMenu().show && !xClose && !yClose && Object.keys(props).includes("enableBackgroundClick")) {
      setShowMenu({ show: false, lastX: 0, lastY: 0 })
    }
  });

  return (
    <>
      <button
        {...props}
        onClick={(e) => {
          if (props.menuItems?.length) setShowMenu({ show: !showMenu().show, lastX: e.clientX + (e.view?.scrollX ?? 0), lastY: e.clientY + (e.view?.scrollY ?? 0) });
          if (props.onClick) props.onClick(e);
        }}
        class={`${style[styleTypeConst]} ${style.customButtonStyle} ${props.transparent ? style.transparent : ""} ${props.class ?? ""} `}
      >
        {props.children}
      </button>
      <Portal mount={document.getElementById("root")!}>
        <Show when={isMenuButton()}>
          <div 
            ref={setMenuRefer} 
            class={`${stylin()?.popup} ${stylin()?.primary} ${props.menuStyle ?? ""}`} 
            style={menuStyle()} >
            <ul class={`${style.menuButtons}`}>
              <For each={props.menuItems ?? []}>
                {(button) => (
                  <Show when={(button.condition ? button.condition() : true) && isMenuButton()}>
                    <li 
                      style={{ height: `${100 / filteredMenuItems().length}%` }} 
                      class={`${stylin().hover}`}>
                      <button 
                        class={`${stylin().accent} ${style.menuButton}`} 
                        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                        // @ts-expect-error
                        on:click={button.action}>
                        {button.name}
                      </button>
                    </li>
                  </Show>
                )}
              </For>
            </ul>
          </div>
        </Show>
      </Portal>
    </>
  )
}
export { Button };
export default Button;