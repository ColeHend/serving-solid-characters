import { Accessor, Component, createSignal, For, onCleanup, onMount, Setter, Show } from "solid-js";
import style from "./chipbar.module.scss";
import type ChipType from "../../models/chip";
import { Chip } from "../Chip/Chip";
import Button from "../Button/Button";
import { effect } from "solid-js/web";

interface Props {
    chips: Accessor<ChipType[]>;
    setChips: Setter<ChipType[]>;
}
const Chipbar: Component<Props> = (props) => {
    const [showLeft, setShowLeft] = createSignal(false);
    const [showRight, setShowRight] = createSignal(false);
    const scrollFunction = (e: any) => {
        setShowRight(chipContainer.scrollLeft !== chipContainer.scrollWidth - chipContainer.clientWidth);
        setShowLeft(chipContainer.scrollLeft > 0);
        if (chipContainer.scrollLeft <= 0) {
            setShowLeft(false);
        }
    }
    onMount(()=>{
        if (!!chipContainer) {
            chipContainer.addEventListener("scroll", scrollFunction)
        }
    });
    onCleanup(()=>{
        if (!!chipContainer) {
            chipContainer.removeEventListener("scroll", scrollFunction)
        }
    });
    let chipContainer: HTMLDivElement;
    effect(()=>{
        if (props.chips().length > 0) {
            scrollFunction(null);
        }
    });
    const scrollLeft = () => {
        chipContainer.scrollLeft -= 100;
        scrollFunction(null);
    }
    const scrollRight = () => {
        chipContainer.scrollLeft += 100;
        scrollFunction(null);
        setShowLeft(true);
    }
    return (
        <Show when={props.chips().length > 0}>
            <div  class={`${style.chipbar}`}>
                <Show when={showLeft()}>
                    <span class={`${style.leftArrow}`}>
                        <Button onClick={scrollLeft}>←</Button>
                    </span>
                </Show>
                <div ref={chipContainer!} class={`${style.chipContainer}`}>
                    <span>
                        <Button onClick={() => props.setChips([])}>Clear All</Button>
                    </span>
                    <For each={props.chips()}>
                        {(chip, i) => (
                            <Chip key={chip.key} value={chip.value} remove={()=>props.setChips((old)=> [...old].filter((x, index)=>index !== i()))} />
                        )}
                    </For>
                </div>
                <Show when={showRight()}>
                    <span class={`${style.rightArrow}`}>
                        <Button onClick={scrollRight}>→</Button>
                    </span>
                </Show>
            </div>
        </Show>
    );
}
export { Chipbar };
export default Chipbar;