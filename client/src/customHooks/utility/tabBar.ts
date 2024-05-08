import { Accessor, createSignal } from "solid-js";
import { Tab } from "../../components/navbar/navbar";
import { effect } from "solid-js/web";
import { GameSystems } from "../../models/enums/gameSystems";

export default function useTabs(pageName: Accessor<string>): Accessor<Tab[]> {
    const [getTabPage, setTabPage] = createSignal<Tab[]>([]);
    const defaultSystem = GameSystems.DnD5e;

    effect(()=>{
        if (pageName().startsWith('/info')) {
            const theTabs = [
                {Name: "Characters", Link: "/info/characters"}, 
                {Name: "Races", Link: "/info/races"},
                {Name: "Spells", Link: "/info/spells"},
                {Name: "Feats", Link: "/info/feats"}
            ];
    
            if (defaultSystem === GameSystems.DnD5e) {
                theTabs.push({Name: "Backgrounds", Link: "/info/backgrounds"})
                
            } else if (defaultSystem === GameSystems.TOValient) {
                theTabs.push({Name: "Heritages", Link: "/info/heritages"})
                
            }
    
            setTabPage(theTabs)
        } else if (pageName().startsWith('/characters')) {
            setTabPage([
                {Name: "All", Link: "/characters"}, 
                {Name: "Create", Link: "/characters/create"}
            ])
        } else {
            setTabPage([])
        }
    })

    return getTabPage
}