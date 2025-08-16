import { Accessor, Component, createSignal, from, Show } from "solid-js";
import { Armor, homebrewManager, Paginator, } from "../../../../../shared";
import styles from "./Armors.module.scss";
import SearchBar from "../../../../../shared/components/SearchBar/SearchBar";
import { useNavigate } from "@solidjs/router";
import { ItemType } from "../../../../../shared/customHooks/utility/tools/itemType";
import { Table, Cell, Column, Header, Row, Icon, Button } from "coles-solid-library";
import { ArmorMenu } from "./armorMenu/armorMenu";

interface props {
    SrdArmors:Accessor<Armor[]>;
}

const ArmorsView:Component<props> = (props) => {

  const SrdArmors = props.SrdArmors

  const [results,setResults] = createSignal<Armor[]>([]);
  const [paginated,setPaginated] = createSignal<Armor[]>([]);

  return <div>

    <div class={`${styles.searchBar}`}>
      <SearchBar dataSource={SrdArmors} setResults={setResults} />
    </div>

    <div class={`${styles.armorTable}`}>
      <Table data={paginated} columns={["name","ac","strMin","stealthDisadvant","weight","cost","options"]}>
                
        <Column name="name">
          <Header>Armor</Header>
          <Cell<Armor>>
            { (armor) => <span>
              {armor.name}
            </span>}
          </Cell>
        </Column>

        <Column name="ac">
          <Header>AC</Header>
          <Cell<Armor>>
            { (armor) => <span>
              {armor.armorClass.base} <Show when={armor.armorClass.dexBonus}>+ Dex mod</Show>
            </span>}
          </Cell>
        </Column>

        <Column name="strMin">
          <Header>Strength</Header>
          <Cell<Armor>>
            { (armor) => <span>
              {armor.strMin > 0 ? `Str: ${armor.strMin}` : "-" }
            </span>}
          </Cell>
        </Column>

        <Column name="stealthDisadvant">
          <Header>Stealth</Header>
          <Cell<Armor>>
            { (armor) => <span>
              {armor.stealthDisadvantage? "disadvantage" : "-"}
            </span>}
          </Cell>
        </Column>

        <Column name="weight">
          <Header>Weight</Header>
          <Cell<Armor>>
            { (armor) => <span>
              {armor.weight} lb
            </span>}
          </Cell>
        </Column>

            
        <Column name="cost">
          <Header>Cost</Header>
          <Cell<Armor>>
            { (armor) => <span>
              {armor.cost.quantity} {armor.cost.unit}
            </span>}
          </Cell>
        </Column>

        <Column name="options">
          <Header><></></Header>
          <Cell<Armor>>
            { (armor) => <ArmorMenu armor={armor}/>}
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