import { createSignal } from "solid-js";
import { Clone } from "../../../shared";
import { createNewId } from "../../../shared/customHooks/utility/tools/idGen";

export interface Combatant {
    id: string;
    name: string;
    init: number;
    hp: number;
    maxHp: number;
    ac: number;
    isAlly: boolean;
    conditions: string[];
}

export interface CombatState {
    round: number;
    turnIndex: number;
    combatants: Array<Combatant>;
}

const emptyState = (): CombatState => ({ round: 1, turnIndex: 0, combatants: [] });

// Local demo combat state keyed by event id — nothing is persisted.
const [getCombatStates, setCombatStates] = createSignal<Record<string, CombatState>>({});

const makeCombatant = (name: string, init: number, hp: number, maxHp: number, ac: number, isAlly = false, conditions: string[] = []): Combatant =>
    ({ id: createNewId(), name, init, hp, maxHp, ac, isAlly, conditions });

export function useCombatants(eventId: string) {
    const getState = () => getCombatStates()[eventId] ?? emptyState();

    const patchState = (patch: (state: CombatState) => CombatState) => {
        setCombatStates((old) => Clone({
            ...old,
            [eventId]: patch(old[eventId] ?? emptyState()),
        }));
    };

    /** TEMP demo seed so the initiative tracker matches the mockup's filled state. */
    const seedDemo = () => {
        if (getCombatStates()[eventId]) return;
        patchState(() => ({
            round: 2,
            turnIndex: 1,
            combatants: [
                makeCombatant('Sildar', 20, 12, 12, 16, true),
                makeCombatant('Klarg', 18, 27, 27, 16),
                makeCombatant('Goblin A', 15, 7, 7, 15, false, ['Prone']),
                makeCombatant('Goblin B', 12, 3, 7, 15, false, ['Bloodied']),
            ],
        }));
    };

    const nextTurn = () => {
        patchState((state) => {
            if (state.combatants.length === 0) return state;
            const nextIndex = (state.turnIndex + 1) % state.combatants.length;
            return {
                ...state,
                turnIndex: nextIndex,
                round: nextIndex === 0 ? state.round + 1 : state.round,
            };
        });
    };

    const setHp = (combatantId: string, hp: number) => {
        patchState((state) => ({
            ...state,
            combatants: state.combatants.map((c) =>
                c.id === combatantId ? {...c, hp: Math.max(0, Math.min(c.maxHp, hp))} : c),
        }));
    };

    const addCombatant = (name: string, init: number, maxHp: number, ac: number) => {
        if (!name.trim()) return;
        patchState((state) => ({
            ...state,
            combatants: [...state.combatants, makeCombatant(name.trim(), init, maxHp, maxHp, ac)]
                .sort((a, b) => b.init - a.init),
        }));
    };

    const removeCombatant = (combatantId: string) => {
        patchState((state) => ({
            ...state,
            combatants: state.combatants.filter((c) => c.id !== combatantId),
        }));
    };

    const removeCondition = (combatantId: string, condition: string) => {
        patchState((state) => ({
            ...state,
            combatants: state.combatants.map((c) =>
                c.id === combatantId ? {...c, conditions: c.conditions.filter((x) => x !== condition)} : c),
        }));
    };

    return { getState, seedDemo, nextTurn, setHp, addCombatant, removeCombatant, removeCondition };
}
