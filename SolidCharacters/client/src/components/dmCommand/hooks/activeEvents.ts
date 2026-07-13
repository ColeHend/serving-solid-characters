import { createSignal } from "solid-js";
import { Clone } from "../../../shared";
import { createNewId } from "../../../shared/customHooks/utility/tools/idGen";

export type ActiveEventType = 'combat' | 'social' | 'travel' | 'exploration' | 'scene';

export interface ActiveEvent {
    id: string;
    name: string;
    type: ActiveEventType;
    isActive: boolean;
}

const [getActiveEvents, setActiveEvents] = createSignal<Array<ActiveEvent>>([]);

export function useActiveEvents(defaultEvents?: Array<ActiveEvent>) {
    if (Array.isArray(defaultEvents) && defaultEvents.length > 0) {
        setActiveEvents(defaultEvents);
    }

    const selectActiveEvent = (id: string) => {
        setActiveEvents((old) => {
            return Clone(old
                .map((ev) => ({...ev, isActive: id === ev.id}))
            );
        })
    }

    const removeActiveEvent = (name: string) => {
        setActiveEvents((old) => Clone(old.filter(e=> e.id !== name)));
    }

    const addActiveEvent = (name:string, type: ActiveEventType, isActive: boolean = false) => {
        const newID = createNewId();
        setActiveEvents((old) => getUniqueEventsArray([
            ...old,
            {
                id: newID,
                name,
                type,
                isActive: false
            }
        ]));
        if (isActive) {
            selectActiveEvent(newID);
        }
    }

    return {
        getActiveEvents,
        addActiveEvent,
        removeActiveEvent,
        selectActiveEvent
    };
};

const getUniqueEventsArray = (activeEvents: Array<ActiveEvent>) => {
    const events: Record<string, ActiveEvent> = {};
    activeEvents.forEach(key => events[key.id] = key)
    return Object.values(events).filter(x=>!!x);
};