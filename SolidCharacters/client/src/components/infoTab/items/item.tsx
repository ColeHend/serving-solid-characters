import { 
  Component, 
  createEffect, 
  createMemo, 
  createSignal, 
  lazy,
  onCleanup,
  onMount
} from "solid-js";
import { useSearchParams } from "@solidjs/router";
import { Body, Carousel, CarouselElement } from "coles-solid-library";
import { Item, ItemType } from "../../../models/data";
import { useDnDItems } from "../../../shared/customHooks/dndInfo/info/all/items";
import { ItemsView } from "./parts/items/itemsView";
import { WeaponsView } from "./parts/weapon/weaponView";
import { ArmorView } from "./parts/armor/armorView";
import styles from "./item.module.scss";

// const ItemsView = lazy(() => import("./parts/items/itemsView").then(mod => ({ default: mod.ItemsView })));
// const WeaponsView = lazy(() => import("./parts/weapon/weaponView").then(mod => ({ default: mod.WeaponsView })));

// Normalize cost string: keep only the first number + coin type (CP|SP|GP), ignore trailing text
const normalizeCost = (cost: string): string => {
  const match = cost.match(/^(\d+)\s*(CP|SP|GP)/i);
  return match ? `${match[1]} ${match[2].toUpperCase()}` : cost;
}

const costToCopper = (cost: string): number => {
  const normalized = normalizeCost(cost);
  const match = normalized.match(/^(\d+)\s*(CP|SP|GP)$/i);
  if (!match) return 0;
  const value = parseInt(match[1], 10);
  const unit = match[2].toUpperCase();
  switch (unit) {
    case "GP":
      return value * 100;
    case "SP":
      return value * 10;
    case "CP":
      return value;
    default:
      return 0;
  }
}

const ItemsViewTab:Component = () => {
  
  const SrdItems = useDnDItems();
  const [searchParam,setSearchParam] = useSearchParams();
  
  // items sorted by equipment Category
  const srdItems = createMemo<Item[]>(() => SrdItems().filter(item => item.type === ItemType.Item));
  const srdArmors = createMemo<Item[]>(() => SrdItems().filter(item => item.type === ItemType.Armor));
  const srdWeapons = createMemo<Item[]>(() => SrdItems().filter(item => item.type === ItemType.Weapon));
  const srdTools = createMemo<Item[]>(() => SrdItems().filter(item => item.type === ItemType.Tool));
  const srdEquipment = createMemo<Item[]>(() => [...srdItems(),...srdTools()]);

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

  // function cantFind(number:number) {
  //   if (startingIndex() === -1) {
  //     return 0 
  //   }

  //   return number
  // }

  createEffect(()=>{
    setSearchParam({itemType: elementMemo()[itemIndex()].name})
  })

  onMount(()=>{
    document.body.classList.add('items-bg');
  })

  onCleanup(()=>{
    document.body.classList.remove('items-bg');
  })

  return <Body class={`${styles.body}`}>
    <h1>Items</h1>
    
    <Carousel 
      startingIndex={startingIndex()} 
      currentIndex={[itemIndex,setItemIndex]} 
      elements={elementMemo()} />
  </Body>
}
export {normalizeCost,costToCopper}
export default ItemsViewTab;

