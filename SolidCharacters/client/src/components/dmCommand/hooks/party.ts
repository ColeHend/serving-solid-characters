import { createSignal } from "solid-js";
import { Clone } from "../../../shared";
import { createNewId } from "../../../shared/customHooks/utility/tools/idGen";

export interface PartyMember {
    id: string;
    name: string;
    hp: number;
    maxHp: number;
    ac: number;
    pp: number;
}

// TEMP demo party until campaign data is wired in.
const seedMember = (name: string, hp: number, maxHp: number, ac: number, pp: number): PartyMember =>
    ({ id: createNewId(), name, hp, maxHp, ac, pp });

const [getParty, setParty] = createSignal<Array<PartyMember>>([
    seedMember('Thorne', 32, 45, 18, 13),
    seedMember('Lia', 28, 28, 16, 15),
    seedMember('Wren', 9, 24, 14, 16),
    seedMember('Bram', 22, 22, 12, 11),
]);

export function useParty() {
    const setMemberHp = (id: string, hp: number) => {
        setParty((old) => Clone(old
            .map((m) => m.id === id ? {...m, hp: Math.max(0, Math.min(m.maxHp, hp))} : m)
        ));
    };

    const addMember = (name: string, maxHp: number, ac: number) => {
        if (!name.trim()) return;
        setParty((old) => Clone([
            ...old,
            seedMember(name.trim(), maxHp, maxHp, ac, 10),
        ]));
    };

    const removeMember = (id: string) => {
        setParty((old) => Clone(old.filter((m) => m.id !== id)));
    };

    return { getParty, setMemberHp, addMember, removeMember };
}
