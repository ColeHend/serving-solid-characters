import { 
  Component, 
  createEffect, 
  createMemo, 
  createSignal,
  onCleanup,
  onMount
} from "solid-js";
import { useSearchParams } from "@solidjs/router";
import { Body, Carousel, CarouselElement } from "coles-solid-library";
import { ItemType } from "../../../models/generated";
import { useDnDItems } from "../../../shared/customHooks/dndInfo/info/all/items";
import { ItemsView } from "./parts/items/itemsView";
import { WeaponsView } from "./parts/weapon/weaponView";
import { ArmorView } from "./parts/armor/armorView";
import styles from "./item.module.scss";
import { srdItem } from "../../../models/data/generated";

// Normalize cost string: keep only the first number (commas stripped) + coin type, ignore trailing text
const normalizeCost = (cost: string): string => {
  const match = cost.match(/^\s*(\d[\d,]*)\s*(CP|SP|EP|GP|PP)/i);
  return match ? `${match[1].replaceAll(",", "")} ${match[2].toUpperCase()}` : cost;
}

// Cost in copper pieces, or undefined when unparseable so those rows sort last instead of as free
const costToCopper = (cost: string): number | undefined => {
  const match = normalizeCost(cost).match(/^(\d+)\s*(CP|SP|EP|GP|PP)$/i);
  if (!match) return undefined;
  const value = parseInt(match[1], 10);
  switch (match[2].toUpperCase()) {
    case "PP":
      return value * 1000;
    case "GP":
      return value * 100;
    case "EP":
      return value * 50;
    case "SP":
      return value * 10;
    case "CP":
      return value;
    default:
      return undefined;
  }
}

const ItemsViewTab:Component = () => {
  
  const SrdItems = useDnDItems();
  const [searchParam,setSearchParam] = useSearchParams();
  
  // items sorted by equipment Category
  const srdItems = createMemo<srdItem[]>(() => SrdItems().filter(item => item.type === ItemType.Item));
  const srdArmors = createMemo<srdItem[]>(() => SrdItems().filter(item => item.type === ItemType.Armor));
  const srdWeapons = createMemo<srdItem[]>(() => SrdItems().filter(item => item.type === ItemType.Weapon));
  const srdTools = createMemo<srdItem[]>(() => SrdItems().filter(item => item.type === ItemType.Tool));
  const srdEquipment = createMemo<srdItem[]>(() => [...srdItems(),...srdTools()]);

  const elementMemo = createMemo<CarouselElement[]>(()=>([
    {name: "Equipment", element: <ItemsView items={srdEquipment} /> },
    {name: "Weapons", element:  <WeaponsView items={srdWeapons} />  },
    {name: "Armor", element: <ArmorView items={srdArmors} />}
  ]));
  
  if (!searchParam.itemType) setSearchParam({itemType: elementMemo()[0].name })

  const startingIndex = createMemo(()=>{
    const param = typeof searchParam.itemType === "string" ? searchParam.itemType : searchParam.itemType?.join(" ");
    const target = elementMemo().findIndex((x)=>x.name.toLowerCase() === param?.toLowerCase());
    
    if (target === -1) return 0;
    return target;
  });

  const [itemIndex,setItemIndex] = createSignal<number>(startingIndex() ?? 0);

  createEffect(()=>{
    setSearchParam({itemType: elementMemo()[itemIndex()]?.name})
  })

  onMount(()=>{
    document.body.classList.add('items-bg');
  })

  onCleanup(()=>{
    document.body.classList.remove('items-bg');
  })

  return <Body class={`${styles.body}`}>
    <h1 class={`${styles.title}`}>Items</h1>
    <span class={`${styles.carouselOverwrite}`}>
    <Carousel 
      startingIndex={startingIndex()} 
      currentIndex={[itemIndex,setItemIndex]} 
      elements={elementMemo()} />
    </span>
  </Body>
}
export {normalizeCost,costToCopper}
export default ItemsViewTab;

