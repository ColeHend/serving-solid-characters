import { Component, For, JSX } from "solid-js";

type Props = {children: JSX.Element};
const Navbar: Component<Props> = (props) => {
    const Buttons = ["Home", "Classes"]
    return (
        <div>
            <ul style={{"list-style":'none'}}>
                <For each={Buttons}>
                    {(button) => (
                        <li>{button}</li>
                    )}
                </For>
            </ul>
            {props.children}
        </div>
    )
}
export default Navbar;