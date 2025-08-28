import { 
  Component, 
  createEffect, 
  createMemo, 
  createSignal 
} from "solid-js";
import { useSearchParams } from "@solidjs/router";
import { Body, Carousel, CarouselElement } from "coles-solid-library";
import { ItemsView } from "./parts/items/itemsView";
import { Item, ItemType } from "../../../models/data";
import { useDnDItems } from "../../../shared/customHooks/dndInfo/info/all/items";


const ItemsViewTab:Component = () => {
  // all off the items
  const SrdItems = useDnDItems();
  const [searchParam,setSearchParam] = useSearchParams();
  
  // items sorted by equipment Category
  const srdItems = createMemo<Item[]>(() => SrdItems().filter(item => item.type === ItemType.Item));
  const srdArmors = createMemo<Item[]>(() => SrdItems().filter(item => item.type === ItemType.Armor));
  const srdWeapons = createMemo<Item[]>(() => SrdItems().filter(item => item.type === ItemType.Weapon));
  const srdTools = createMemo<Item[]>(() => SrdItems().filter(item => item.type === ItemType.Tool));

  const elementMemo = createMemo<CarouselElement[]>(()=>([
    // {name: "Weapons", element:  <WeaponsView weapons={SrdWeapons} />  },
    // {name: "Armors", element: <ArmorsView SrdArmors={SrdArmors} /> },
    {name: "Equipment", element: <ItemsView items={[...srdItems(),...srdTools()]} /> }
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
    setSearchParam({itemType: elementMemo()[itemIndex()]?.name ?? "Weapons"})
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

