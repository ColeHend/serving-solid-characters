import { createSignal } from "solid-js";
import { Clone } from "../../../shared";
import { createNewId } from "../../../shared/customHooks/utility/tools/idGen";
import { EventType } from "../shared/eventTypes.shared";

export type ActiveEventType = EventType;

export interface ActiveEvent {
    id: string;
    name: string;
    type: ActiveEventType;
    isActive: boolean;
    resolved: boolean;
    /** Combat-only: boss fights get a legendary / lair actions section. */
    isBoss?: boolean;
}

interface AddEventOptions {
    isBoss?: boolean;
    resolved?: boolean;
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

    const addActiveEvent = (name:string, type: ActiveEventType, isActive: boolean = false, options?: AddEventOptions) => {
        const newID = createNewId();
        setActiveEvents((old) => getUniqueEventsArray([
            ...old,
            {
                id: newID,
                name,
                type,
                isActive: false,
                resolved: options?.resolved ?? false,
                isBoss: options?.isBoss,
            }
        ]));
        if (isActive) {
            selectActiveEvent(newID);
        }
    }

    const toggleResolved = (id: string) => {
        setActiveEvents((old) => Clone(old
            .map((ev) => ev.id === id ? {...ev, resolved: !ev.resolved} : ev)
        ));
    }

    const renameActiveEvent = (id: string, name: string) => {
        setActiveEvents((old) => Clone(old
            .map((ev) => ev.id === id ? {...ev, name} : ev)
        ));
    }

    const activeIndex = () => getActiveEvents().findIndex(ev => ev.isActive);

    /**
     * Move the active selection by offset. Stepping past the last event lands on
     * the "end of timeline" state (nothing active); stepping back from there
     * returns to the last event.
     */
    const stepActiveEvent = (offset: number) => {
        const events = getActiveEvents();
        if (events.length === 0) return;
        const idx = activeIndex();
        const next = (idx === -1 ? events.length : idx) + offset;
        if (next < 0) return;
        if (next >= events.length) {
            setActiveEvents((old) => Clone(old.map((ev) => ({...ev, isActive: false}))));
            return;
        }
        selectActiveEvent(events[next].id);
    }

    return {
        getActiveEvents,
        addActiveEvent,
        removeActiveEvent,
        selectActiveEvent,
        toggleResolved,
        renameActiveEvent,
        activeIndex,
        stepActiveEvent
    };
};

const getUniqueEventsArray = (activeEvents: Array<ActiveEvent>) => {
    const events: Record<string, ActiveEvent> = {};
    activeEvents.forEach(key => events[key.id] = key)
    return Object.values(events).filter(x=>!!x);
};
