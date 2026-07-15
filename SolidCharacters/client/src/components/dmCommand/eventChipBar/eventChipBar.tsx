import { Component, createMemo, createSignal, For, JSX, onMount, Show } from "solid-js";
import { useActiveEvents } from "../hooks/activeEvents";
import { EventChip } from "./eventChip";
import { AddEventChip } from "./addEventChip";
import styles from './eventChipBar.module.scss';
import { Button, Icon } from "coles-solid-library";
import { ArrowBack, ArrowForward } from "coles-solid-library/icons";

export const EventChipBar: Component = () => {
    const { getActiveEvents, selectActiveEvent } = useActiveEvents();
    const [isLeftScrolled, setIsLeftScrolled] = createSignal(false);
    const [isRightScrolled, setIsRightScrolled] = createSignal(false);
    let elemental: HTMLDivElement;

    const scrollBy = (dir: 'left' | 'right') => {
        const AMNT = 75;
        if (elemental) {
            if (!isLeftScrolled() && !isRightScrolled()) {
                elemental.style.width = 'calc(100% - 80px)';
            } else if (!isLeftScrolled() || !isRightScrolled()) {
                elemental.style.width = 'calc(100% - 40px)';
            } else {
                elemental.style.width =  '100%';
            }
        }
        elemental?.scrollBy({
            left: dir !== 'left' ? AMNT : -AMNT,
            behavior: 'smooth'
        });
    };

    onMount(() => {
        setIsLeftScrolled(elemental?.scrollLeft === 0);
        setIsRightScrolled(Math.ceil(elemental.scrollLeft + elemental.clientWidth) >= elemental.scrollWidth);
        elemental?.addEventListener('scroll', ()=> {
            setIsLeftScrolled(elemental?.scrollLeft === 0);
            setIsRightScrolled(Math.ceil(elemental.scrollLeft + elemental.clientWidth) >= elemental.scrollWidth);
        });
    })

    return <div class={styles.barWrap}>
        <Show when={!isLeftScrolled()}>
            <Button onClick={()=>scrollBy('left')}><Icon icon={ArrowBack}/></Button>
        </Show>
        <div class={styles.bar} ref={(e)=>{elemental=e}}>
            <For each={getActiveEvents()}>{(event) =>
                <EventChip event={event} onSelect={selectActiveEvent} />
            }</For>
            <AddEventChip />
        </div>
        <Show when={!isRightScrolled()}>
            <Button onClick={()=>scrollBy('right')}><Icon icon={ArrowForward} /></Button>
        </Show>
    </div>;
};
