import { Accessor, Component, createEffect, createMemo, createSignal, For } from "solid-js";
import { homebrewManager, Paginator, SkinnySnowman, Weapon } from "../../../../../shared";
import styles from "./weapons.module.scss";
import SearchBar from "../../../../../shared/components/SearchBar/SearchBar";
import { useNavigate } from "@solidjs/router";
import { ItemType } from "../../../../../shared/customHooks/utility/tools/itemType";
import { Table, Cell, Column, Header, Row, Button, Icon, Chip  } from "coles-solid-library"

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
      action: ()=> navigate(`/homebrew/create/items?itemType=${weapon.equipmentCategory}&name=${weapon.name}`),
    }
  ])

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
            asdf
            {/* { (weapon) => <span>
              <Button enableBackgroundClick menuItems={menuItems(weapon)} class={`${styles.menuBtn}`}>
                <SkinnySnowman />
              </Button>
            </span>} */}
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