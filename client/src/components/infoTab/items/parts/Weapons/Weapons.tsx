import { Accessor, Component, createEffect, createMemo, createSignal, For } from "solid-js";
import { homebrewManager, Paginator, SkinnySnowman, Weapon } from "../../../../../shared";
import styles from "./weapons.module.scss";
import SearchBar from "../../../../../shared/components/SearchBar/SearchBar";
import { useNavigate } from "@solidjs/router";
import { ItemType } from "../../../../../shared/customHooks/utility/tools/itemType";
import { Table, Cell, Column, Header, Row, Button, Icon, Chip  } from "coles-solid-library"
import { WeaponMenu } from "./weaponMenu/weaponMenu";

interface props {
    weapons:Accessor<Weapon[]>;
}

const WeaponsView:Component<props> = (props) => {
  const SrdWeapons = props.weapons;

  const [paginatedResults,setPaginatedResults] = createSignal<Weapon[]>([]);
  const [results,setResults] = createSignal<Weapon[]>([]);

  const displayResults = createMemo(()=>results().length > 0 ? results():SrdWeapons())

  
 

  createEffect(()=>console.log("weapons",props.weapons()));

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
            { (weapon) => <span>
              {weapon.name}    
            </span>}
          </Cell>
          <Cell<Weapon> rowNumber={2}>
            { (weapon) => <span class={`${styles.tagRow}`}>
              <For each={weapon.tags}>
                { (tag) => <Chip key="" value={tag} /> }
              </For>
            </span>}
          </Cell>
        </Column>

        <Column name="options">
          <Header><></></Header>
          <Cell<Weapon>>
            { (weapon) => <WeaponMenu weapon={weapon}/>}
          </Cell>
        </Column>

        <Row />
        

      </Table>
    </div>

    <div class={`${styles.paginator}`}>
      <Paginator items={displayResults} setPaginatedItems={setPaginatedResults} />
    </div>

  </div>
}
export default WeaponsView;