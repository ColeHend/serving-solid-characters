import { Component, Match, Show, Switch, createMemo, createSignal, onMount } from "solid-js";
import { Button, Input } from "coles-solid-library";
import { useActiveEvents } from "../../hooks/activeEvents";
import { TypeBadge } from "../../shared/typeBadge/typeBadge";
import { EventNav } from "./eventNav";
import { TimelineModal } from "./timelineModal";
import { EndOfTimeline } from "./endOfTimeline";
import { CombatEvent } from "./events/combat/combat";
import { ExplorationEvent } from "./events/exploration/exploration";
import { SocialEvent } from "./events/social/social";
import { TravelEvent } from "./events/travel/travel";
import { PuzzleEvent } from "./events/puzzle/puzzle";
import { RestEvent } from "./events/rest/rest";
import { SceneEvent } from "./events/scene/scene";
import { CustomEvent } from "./events/custom/custom";
import styles from './activeEvent.module.scss';
import { isMobile } from "coles-solid-library/dist/tools/tools.js";

interface ActiveEventProps {
    campaign: string;
    session: string;
}

export const ActiveEvent: Component<ActiveEventProps> = (props) => {
    const { getActiveEvents, addActiveEvent, removeActiveEvent, toggleResolved, renameActiveEvent } = useActiveEvents();
    const [showTimeline, setShowTimeline] = createSignal(false);
    const theActiveEvent = createMemo(() => {
        return getActiveEvents().find(v => v.isActive);
    });

    onMount(() => {
        if (getActiveEvents().length === 0) {
            //TEMP added for testing
            addActiveEvent("Setting Sail", 'travel', false, { resolved: true });
            addActiveEvent("Shakkys Bar", 'social');
            addActiveEvent("Kraken Ambush", 'combat', true);
            addActiveEvent("Stormy Seas", 'exploration');
            addActiveEvent("The Rune Door", 'puzzle');
            addActiveEvent("Keras Baal Fight", 'combat', false, { isBoss: true });
            addActiveEvent("The Storm Breaks", 'scene');
            addActiveEvent("Dockside Respite", 'rest');
            addActiveEvent("Session Scratchpad", 'custom');
        }
    });

    return <div class={styles.tile}>
        <Show when={theActiveEvent()} fallback={<>
            <EventNav onOpenTimeline={() => setShowTimeline(true)} />
            <EndOfTimeline />
        </>}>
            {(event) => <>
                <div class={styles.headerRow}>
                    <TypeBadge type={event().isBoss ? 'combat' : event().type} />
                    <Show when={event().type === 'custom'} fallback={
                        <h2 class={styles.eventName}>{event().name}</h2>
                    }>
                        <Input
                            class={styles.eventNameInput}
                            value={event().name}
                            onChange={(e) => renameActiveEvent(event().id, e.currentTarget.value)} />
                    </Show>
                    <Show when={!isMobile()}>
                        <span class={styles.headerSpacer} />
                    </Show>
                    <span class={styles.resolvedBtnGroup}>
                        <Button transparent
                            class={`${styles.resolveBtn} ${event().resolved ? styles.resolved : ''}`}
                            onClick={() => toggleResolved(event().id)}>
                            {event().resolved ? 'Resolved ✓' : 'Mark resolved'}
                        </Button>
                        <Button transparent class={styles.closeBtn}
                            onClick={() => removeActiveEvent(event().id)}>✕</Button>
                    </span>
                </div>
                <EventNav onOpenTimeline={() => setShowTimeline(true)} />
                <div class={styles.eventBody}>
                    <Switch fallback={<span class={styles.unknown}>Unknown event type</span>}>
                        <Match when={event().type === 'combat'}>
                            <CombatEvent eventId={event().id} isBoss={!!event().isBoss} />
                        </Match>
                        <Match when={event().type === 'exploration'}>
                            <ExplorationEvent />
                        </Match>
                        <Match when={event().type === 'social'}>
                            <SocialEvent />
                        </Match>
                        <Match when={event().type === 'travel'}>
                            <TravelEvent />
                        </Match>
                        <Match when={event().type === 'puzzle'}>
                            <PuzzleEvent />
                        </Match>
                        <Match when={event().type === 'rest'}>
                            <RestEvent />
                        </Match>
                        <Match when={event().type === 'scene'}>
                            <SceneEvent />
                        </Match>
                        <Match when={event().type === 'custom'}>
                            <CustomEvent />
                        </Match>
                    </Switch>
                </div>
            </>}
        </Show>
        <TimelineModal show={[showTimeline, setShowTimeline]} />
    </div>;
};
