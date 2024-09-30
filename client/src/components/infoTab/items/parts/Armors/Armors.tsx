import { Accessor, Component, createSignal, For,createEffect, Show } from "solid-js";
import { Armor, Button, Chip, homebrewManager, Paginator, SkinnySnowman } from "../../../../../shared";
import styles from "./Armors.module.scss";
import SearchBar from "../../../../../shared/components/SearchBar/SearchBar";
import Table from "../../../../../shared/components/Table/table";
import { Cell, Column, Header, Row, SecondRow } from "../../../../../shared/components/Table/innerTable";
import { ItemType } from "../../item";
import { useNavigate } from "@solidjs/router";
interface props {
    SrdArmors:Accessor<Armor[]>;
}

const ArmorsView:Component<props> = (props) => {

    const SrdArmors = props.SrdArmors

    const [results,setResults] = createSignal<Armor[]>([]);
    const [paginated,setPaginated] = createSignal<Armor[]>([]);

    const navigate = useNavigate()

    const checkForHomebrew = (SrdArmor:Armor):boolean => {
        const itemsHomebrew = homebrewManager.items().filter(x=>x.equipmentCategory === ItemType[2]);

        itemsHomebrew.forEach(armor=>{
            if (armor.name.toLowerCase() === SrdArmor.name.toLowerCase()) {
                true
            }
        })

        return false
    }

    const menuButtons = (armor:Armor) => ([
        {
            name:checkForHomebrew(armor)?"Edit":"Clone & Edit",
            action: () => navigate(`/homebrew/create/items?name=${armor.name}`)
        }
    ])

    createEffect(()=>{
        console.log("armors: ",SrdArmors());
        
    })

    return <div>

        <div class={`${styles.searchBar}`}>
            <SearchBar dataSource={SrdArmors} setResults={setResults} />
        </div>

        <div class={`${styles.armorTable}`}>
            <Table data={paginated} columns={["name","ac","strMin","stealthDisadvant","weight","cost","options"]}>
                
                <Column name="name">
                    <Header>Armor</Header>
                    <Cell<Armor>>
                        { (armor, i) => <span>
                            {armor.name}
                        </span>}
                    </Cell>
                </Column>

                <Column name="ac">
                    <Header>AC</Header>
                    <Cell<Armor>>
                        { (armor, i) => <span>
                            {armor.armorClass.base} <Show when={armor.armorClass.dexBonus}>+ Dex mod</Show>
                        </span>}
                    </Cell>
                </Column>

                <Column name="strMin">
                    <Header>Strength</Header>
                    <Cell<Armor>>
                        { (armor, i) => <span>
                            {armor.strMin > 0 ? `Str: ${armor.strMin}` : "-" }
                        </span>}
                    </Cell>
                </Column>

                <Column name="stealthDisadvant">
                    <Header>Stealth</Header>
                    <Cell<Armor>>
                        { (armor, i) => <span>
                            {armor.stealthDisadvantage? "disadvantage" : "-"}
                        </span>}
                    </Cell>
                </Column>

                <Column name="weight">
                    <Header>Weight</Header>
                    <Cell<Armor>>
                        { (armor, i) => <span>
                            {armor.weight} lb
                        </span>}
                    </Cell>
                </Column>

            
                <Column name="cost">
                    <Header>Cost</Header>
                    <Cell<Armor>>
                        { (armor, i) => <span>
                            {armor.cost.quantity} {armor.cost.unit}
                        </span>}
                    </Cell>
                </Column>

                <Column name="options">
                    <Header><></></Header>
                    <Cell<Armor>>
                        { (armor, i) => <span>
                            <Button enableBackgroundClick menuItems={menuButtons(armor)} class={`${styles.menuBtn}`}>
                                <SkinnySnowman />
                            </Button>
                        </span>}
                    </Cell>
                </Column>


                <Row />
            </Table>
        </div>

        <div class={`${styles.paginator}`}>
            <Paginator items={results} setPaginatedItems={setPaginated} />
        </div>
    </div>
}
export default ArmorsView;