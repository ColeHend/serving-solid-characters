import { Component, createEffect, createMemo, createSignal, For, JSX, onCleanup, onMount, Show } from "solid-js";
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
    let innerScrollBar: HTMLDivElement;

    const setScrollWidth = () => {
        if (innerScrollBar) {
            if (!isLeftScrolled() && !isRightScrolled()) {
                innerScrollBar.style.width = 'calc(100% - 80px)';
            } else if (!isLeftScrolled() || !isRightScrolled()) {
                innerScrollBar.style.width = 'calc(100% - 40px)';
            } else {
                innerScrollBar.style.width =  '100%';
            }
        }
    };

    const scrollBy = (dir: 'left' | 'right') => {
        const AMNT = 75;
        innerScrollBar?.scrollBy({
            left: dir !== 'left' ? AMNT : -AMNT,
            behavior: 'smooth'
        });
    };

    const setScroll = () => {
        if (!innerScrollBar) return;
        setIsLeftScrolled(innerScrollBar.scrollLeft === 0);
        setIsRightScrolled(Math.ceil(innerScrollBar.scrollLeft + innerScrollBar.clientWidth) >= innerScrollBar.scrollWidth);
        setScrollWidth();
    }

    createEffect(() => {
        getActiveEvents();
        setScroll();
    });

    onMount(() => {
        innerScrollBar?.addEventListener('scroll', setScroll);
    });

    onCleanup(()=>{
        innerScrollBar?.removeEventListener('scroll', setScroll);
    });

    return <div class={styles.barWrap}>
        <Show when={!isLeftScrolled()}>
            <Button onClick={()=>scrollBy('left')}><Icon icon={ArrowBack}/></Button>
        </Show>
        <div class={styles.bar} ref={(e)=>{innerScrollBar=e}}>
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
