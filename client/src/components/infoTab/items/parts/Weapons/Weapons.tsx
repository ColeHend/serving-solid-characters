import { Accessor, Component, createEffect, createMemo, createSignal, For } from "solid-js";
import { Button, Chip, homebrewManager, Paginator, SkinnySnowman, Weapon } from "../../../../../shared";
import styles from "./weapons.module.scss";
import SearchBar from "../../../../../shared/components/SearchBar/SearchBar";
import { create } from "domain";
import Table from "../../../../../shared/components/Table/table";
import { Cell, Column, Header,Row, SecondRow } from "../../../../../shared/components/Table/innerTable";
import { ItemType } from "../../item";
import { useNavigate } from "@solidjs/router";

interface props {
    weapons:Accessor<Weapon[]>;
}

const WeaponsView:Component<props> = (props) => {
    const SrdWeapons = props.weapons;

    const [paginatedResults,setPaginatedResults] = createSignal<Weapon[]>([]);
    const [results,setResults] = createSignal<Weapon[]>([]);

    const displayResults = createMemo(()=>results().length > 0 ? results():SrdWeapons())
    
    const navigate = useNavigate();

    const checkForHomebrew = (weapon:Weapon): boolean => {
        const itemsHomebrew = homebrewManager.items().filter(x=>x.equipmentCategory === ItemType[1]);

        itemsHomebrew.forEach((customWeapon) => {
            if (customWeapon.name.toLowerCase() === weapon.name.toLowerCase()) {
                return true 
            }
        })

        return false
    }

    const menuItems = (weapon:Weapon) => ([
        {
            name: checkForHomebrew(weapon) ? "Edit" : "Clone & Edit",
            action: ()=> navigate(`/homebrew/create/items?name=${weapon.name}`),
        }
    ])

    return <div>

        <div class={`${styles.searchBar}`}>
            <SearchBar 
                dataSource={SrdWeapons} 
                setResults={setResults} />
        </div>
        <div class={`${styles.weaponsTable}`}>
            <Table data={paginatedResults} columns={["name","options"]}>
                
                <Column name="name">
                    <Header><></></Header>
                    <Cell<Weapon>>
                        { (weapon, i) => <span>
                            {weapon.name}    
                        </span>}
                    </Cell>
                </Column>

                <Column name="options">
                    <Header><></></Header>
                    <Cell<Weapon>>
                        { (weapon, i) => <span>
                            <Button enableBackgroundClick menuItems={menuItems(weapon)} class={`${styles.menuBtn}`}>
                                <SkinnySnowman />
                            </Button>
                        </span>}
                    </Cell>
                </Column>

                <Row />
                <SecondRow<Weapon>>
                    { (weapon, i) => <span class={`${styles.tagRow}`}>
                        <For each={weapon.tags}>
                                { (tag, i) => <Chip key="" value={tag} /> }
                        </For>
                    </span>}
                </SecondRow>

            </Table>
        </div>

        <div class={`${styles.paginator}`}>
            <Paginator items={displayResults} setPaginatedItems={setPaginatedResults} />
        </div>

    </div>
}
export default WeaponsView;