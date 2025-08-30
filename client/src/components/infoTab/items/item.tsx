import { 
  Component, 
  createEffect, 
  createMemo, 
  createSignal, 
  lazy
} from "solid-js";
import { useSearchParams } from "@solidjs/router";
import { Body, Carousel, CarouselElement } from "coles-solid-library";
import { Item, ItemType } from "../../../models/data";
import { useDnDItems } from "../../../shared/customHooks/dndInfo/info/all/items";
import { ItemsView } from "./parts/items/itemsView";
import { WeaponsView } from "./parts/weapon/weaponView";

// const ItemsView = lazy(() => import("./parts/items/itemsView").then(mod => ({ default: mod.ItemsView })));
// const WeaponsView = lazy(() => import("./parts/weapon/weaponView").then(mod => ({ default: mod.WeaponsView })));

const ItemsViewTab:Component = () => {
  // all off the items
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
    {name: "Weapons", element:  <WeaponsView items={srdWeapons} />  }
  ]));  

  if (!searchParam.itemType) setSearchParam({itemType: elementMemo()[0].name })
    
  const startingIndex = createMemo(()=>elementMemo().findIndex((x)=>x.name.toLowerCase() === searchParam.itemType?.toLowerCase()) ?? 0);

  const [itemIndex,setItemIndex] = createSignal<number>(startingIndex());

  function cantFind(number:number) {
    if (startingIndex() === -1) {

      return 0
    }

    return number
  }

  createEffect(()=>{
    setSearchParam({itemType: elementMemo()[itemIndex()]?.name ?? "Equipment"})
  })

  return <Body>
    <h1>Items</h1>
    
    <Carousel 
      startingIndex={cantFind(startingIndex())} 
      currentIndex={[itemIndex,setItemIndex]} 
      elements={elementMemo()} />
  </Body>
}
export default ItemsViewTab;

