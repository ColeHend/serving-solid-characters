import { Accessor, Component, createEffect, createMemo, createSignal, For } from "solid-js";
import { Button, Chip, Paginator, SkinnySnowman, Weapon } from "../../../../../shared";
import styles from "./weapons.module.scss";
import SearchBar from "../../../../../shared/components/SearchBar/SearchBar";
import { create } from "domain";
import Table from "../../../../../shared/components/Table/table";
import { Cell, Column, Header,Row, SecondRow } from "../../../../../shared/components/Table/innerTable";

interface props {
    weapons:Accessor<Weapon[]>;
}

const WeaponsView:Component<props> = (props) => {
    const SrdWeapons = props.weapons;

    const [paginatedResults,setPaginatedResults] = createSignal<Weapon[]>([]);
    const [results,setResults] = createSignal<Weapon[]>([]);

    const displayResults = createMemo(()=>results().length > 0 ? results():SrdWeapons())
    
    createEffect(()=>{
        console.log("weapons: ",SrdWeapons);
        
    })

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
                            <Button class={`${styles.menuBtn}`}>
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