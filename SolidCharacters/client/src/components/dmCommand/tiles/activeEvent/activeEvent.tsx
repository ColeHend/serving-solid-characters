import { Component, createMemo, Match, onMount, Switch } from "solid-js";
import styles from './activeEvent.module.scss';
import { useActiveEvents } from "../../hooks/activeEvents";

interface ActiveEventProps {
    campaign: string;
    session: string;
}
export const ActiveEvent: Component<ActiveEventProps> = (props) => {
    const { getActiveEvents, addActiveEvent } = useActiveEvents();
    const theActiveEvent = createMemo(() => {
        return getActiveEvents().find(v=> v.isActive);
    });
    onMount(()=>{
        if (getActiveEvents().length === 0) {
            //TEMP added for testing
            addActiveEvent("Kraken Ambush", 'combat', true)
            addActiveEvent("Stormy Seas", 'exploration');
            addActiveEvent("Shakkys Bar", 'social');
            addActiveEvent("Setting Sail", 'travel');
            addActiveEvent("Keras Baal Fight", 'scene');
        }
    })
    return <span style={{width: '100%', height: '100%', margin: '0px', padding: '0px'}}>
        <Switch fallback={'Unknown Event'}>
            <Match when={theActiveEvent()?.type === 'combat'}>
                Combat
            </Match>
            <Match when={theActiveEvent()?.type === 'exploration'}>
                Exploration
            </Match>
            <Match when={theActiveEvent()?.type === 'travel'}>
                Travel
            </Match>
            <Match when={theActiveEvent()?.type === 'social'}>
                Social
            </Match>
            <Match when={theActiveEvent()?.type === 'scene'}>
                Scene
            </Match>
        </Switch>
    </span>
}