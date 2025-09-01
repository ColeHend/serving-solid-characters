import { Component, createMemo, createSignal, For, Show } from "solid-js";
import styles from "./Exporting.module.scss";
import { homebrewManager, isNullish } from "../../../shared";
import {Button,Input,ExpansionPanel,Modal} from "coles-solid-library";
import { Trade } from "../../../models/trade.model";
import { createStore } from "solid-js/store";
import { downloadObjectAsJson } from "../../../shared/customHooks/utility/tools/downloadObjectAsJson";

const Exporting:Component = () => {

  const [exportObject,setExportObject] = createStore<Trade>({
    spells: [],
    feats: [],
    srdclasses: [],
    backgrounds: [],
    items: [],
    races: [],
    characters: [],
  });
  const [toAddLists,setToAddLists] = createStore<Trade>({
    spells: [],
    feats: [],
    srdclasses: [],
    backgrounds: [],
    items: [],
    races: [],
    characters: [],
  });
  const [toRemove,setToRemove] = createStore<Trade>({
    spells: [],
    feats: [],
    srdclasses: [],
    backgrounds: [],
    items: [],
    races: [],
    characters: [],
  })

  const addOptionObject = ():void => {

    setExportObject(old=>({
      spells: [...old.spells,...toAddLists.spells],
      feats: [...old.feats,...toAddLists.feats],
      srdclasses: [...old.srdclasses,...toAddLists.srdclasses],
      backgrounds: [...old.backgrounds,...toAddLists.backgrounds],
      items: [...old.items,...toAddLists.items],
      races: [...old.races,...toAddLists.races],
      characters: [...old.characters,...toAddLists.characters]
    }));
    setToAddLists({
      spells: [],
      feats: [],
      srdclasses: [],
      backgrounds: [],
      items: [],
      races: [],
      characters: [],
    });
    console.log("Current ExportObj: ",exportObject);
    console.log("cleared to add list");
  }

  const removeOptionObject = ():void => {
    setExportObject(old=>({
      spells: [...old.spells.filter(spell=>!isInRemoveObj("spells",spell))],
      feats: [...old.feats.filter(feat=>!isInRemoveObj("feats",feat))],
      srdclasses: [...old.srdclasses.filter(dndClass=>!isInRemoveObj("srdclasses",dndClass))],
      backgrounds: [...old.backgrounds.filter(background=>!isInRemoveObj("backgrounds",background))],
      items: [...old.items.filter(item=>!isInRemoveObj("items",item))],
      races: [...old.races.filter(race=>!isInRemoveObj("races",race))],
      characters: [...old.characters.filter(char=>!isInRemoveObj("characters",char))]
    }));
    setToRemove({
      spells: [],
      feats: [],
      srdclasses: [],
      backgrounds: [],
      items: [],
      races: [],
      characters: [],
    })
  }

  const isInExport = <T extends keyof Trade,>(key: T, data: Trade[T][number])=>{
    return !!exportObject[key].find((d)=>d.name === data.name)
  }

  const isInRemoveObj = <T extends keyof Trade,>(key: T, data: Trade[T][number])=>{
    return !!toRemove[key].find((d)=>d.name === data.name)
  }

  const exportToObject = ()=> {
    const userInput = document.getElementById("confirm-name") as HTMLInputElement;

    if (!isNullish(userInput)) {
      downloadObjectAsJson(exportObject,userInput.value)
    }
  }

  const AvalableSpells = createMemo(()=>homebrewManager.spells().filter(s=>!isInExport("spells",s)));
  const AvalableFeats = createMemo(()=>homebrewManager.feats().filter(f=>!isInExport("feats",f)));
  const AvalableClasses = createMemo(()=>homebrewManager.classes().filter(c=>!isInExport("srdclasses",c)));
  const AvalableBackground = createMemo(()=>homebrewManager.backgrounds().filter(b=>!isInExport("backgrounds",b)));
  const AvalableItems = createMemo(()=>homebrewManager.items().filter(i=>!isInExport("items",i)));
  const AvalableRaces = createMemo(()=>homebrewManager.races().filter(r=>!isInExport("races",r)));

  const [showConfirm,setShowConfirm] = createSignal<boolean>(false);

  return <div class={`${styles?.wrapper}`}>
        
    <div class={`${styles.leftList}`}>
      <h2>Avalable Options</h2>
            
      <div class={`${styles.innerRow}`}>
        <ul class={`${styles.list}`}>
          {/*---------- ▼  Gamesystems ▼ ----------
                        **  An Expanstion panel goes here  **
                        
                        ▲ ----------    ---------- ▲ */ }

          {/*---------- ▼ spells ▼ ----------*/}
          <Show when={AvalableSpells().length > 0}>
            <ExpansionPanel>

              <div class={`${styles.optionHeader}`}>
                <Input 
                  name="allSpells" 
                  type="checkbox" 
                  onChange={(e)=>{
                    if (e.currentTarget.checked) {
                      setToAddLists({spells:[...homebrewManager.spells()]})
                    } else {
                      setToAddLists({spells:[]})
                    }
                  }} 
                  checked={homebrewManager.spells().length === toAddLists.spells.length}  /> <label for="allSpells">Spells</label>
              </div>

              <div class={`${styles.innerList}`}>
                <For each={AvalableSpells()}>
                  { (spell) =><Show when={!exportObject.spells.includes(spell)}><li>
                    <Input 
                      type="checkbox" 
                      name={spell.name}
                      checked={!!toAddLists.spells.find(s=>s.name === spell.name)}
                      onChange={(e)=>{
                        if (e.currentTarget.checked) {
                          setToAddLists(old=>({spells:[...old.spells,spell]}))
                        } else {    
                          setToAddLists(old=>({spells:[...old.spells.filter(s=>s.name !== spell.name)]}))
                        }
                      }}/> 
                    <label for={spell.name}>{spell.name}</label>    
                  </li></Show>}
                </For>
              </div>

            </ExpansionPanel>
          </Show>
                    
          {/*---------- ▼ feats ▼ ----------*/}
          <Show when={AvalableFeats().length > 0}>
            <ExpansionPanel>

              <div class={`${styles.optionHeader}`}>
                <Input 
                  name="allFeats" 
                  type="checkbox" 
                  onChange={(e)=>{
                    if (e.currentTarget.checked) {
                      setToAddLists({feats:[...homebrewManager.feats()]})
                    } else {
                      setToAddLists({feats: []})
                    }
                  }}
                  checked={homebrewManager.feats().length === toAddLists.feats.length}
                /> <label for="allFeats">Feats</label>
              </div>

              <div class={`${styles.innerList}`}>
                <For each={AvalableFeats()}>
                  { (feat) => <Show when={!exportObject.feats.includes(feat)}><li>
                    <Input 
                      name={feat.name} 
                      type="checkbox" 
                      onChange={(e)=>{
                        if (e.currentTarget.checked) {
                          setToAddLists(old=>({feats:[...old.feats,feat]}))
                        } else {
                          setToAddLists(old=>({feats:[...old.feats.filter(s=>s.name !== feat.name)]}))
                        }
                      }}
                      checked={!!toAddLists.feats.find(s=>s.name === feat.name)}
                    /> <label for={feat.name}>{feat.name}</label>    
                  </li></Show>}
                </For>
              </div>

            </ExpansionPanel>
          </Show>

          {/*---------- ▼ classes ▼ ----------*/}
          <Show when={AvalableClasses().length > 0}>
            <ExpansionPanel>
              <div class={`${styles.optionHeader}`}>
                <Input 
                  name="allClasses" 
                  type="checkbox" 
                  onChange={(e)=>{
                    if (e.currentTarget.checked) {
                      setToAddLists({srdclasses: [...homebrewManager.classes()]})
                    } else {
                      setToAddLists({srdclasses:[]})
                    }
                  }}
                  checked={homebrewManager.classes().length === toAddLists.srdclasses.length}
                /> <label for="allClasses">Classes</label>
              </div>
              <div class={`${styles.innerList}`}>
                <For each={AvalableClasses()}>
                  { (dndClass) => <Show when={!exportObject.srdclasses.includes(dndClass)}><li>
                    <Input 
                      name={dndClass.name} 
                      type="checkbox"
                      onChange={(e)=>{
                        if (e.currentTarget.checked) {
                          setToAddLists(old=>({srdclasses:[...old.srdclasses,dndClass]}))
                        } else {
                          setToAddLists(old=>({srdclasses:[...old.srdclasses.filter(s=>s.name !== dndClass.name)]}))
                        }
                      }}
                      checked={!!toAddLists.srdclasses.find(s=>s.name === dndClass.name)}
                    /> 
                    <label for={dndClass.name}>{dndClass.name}</label>
                  </li></Show>}
                </For>
              </div>
            </ExpansionPanel>
          </Show>

          {/*---------- ▼ backgrounds ▼ ----------*/}
          <Show when={AvalableBackground().length > 0}>
            <ExpansionPanel>
              <div class={`${styles.optionHeader}`}>
                <Input 
                  name="allBackgrounds" 
                  type="checkbox"
                  onChange={(e)=>{
                    if (e.currentTarget.checked) {
                      setToAddLists({backgrounds:[...homebrewManager.backgrounds()]})
                    } else {
                      setToAddLists({srdclasses:[]})
                    }
                  }}
                  checked={homebrewManager.backgrounds().length === toAddLists.backgrounds.length}
                /> <label for="allBackgrounds">Backgrounds</label>
              </div>
              <div class={`${styles.innerList}`}>
                <For each={AvalableBackground()}>
                  { (background) => <Show when={!exportObject.backgrounds.includes(background)}><li>
                    <Input 
                      name={background.name} 
                      type="checkbox" 
                      onChange={(e)=>{
                        if (e.currentTarget.checked) {
                          setToAddLists(old=>({backgrounds:[...old.backgrounds,background]}))
                        } else {
                          setToAddLists(old=>({backgrounds:[...old.backgrounds.filter(s=>s.name === background.name)]}))
                        }
                      }}
                      checked={!!toAddLists.backgrounds.find(s=>s.name === background.name)}
                    /> <label for={background.name}>{background.name}</label>    
                  </li></Show>}
                </For>
              </div>
            </ExpansionPanel>

          </Show>

          {/*---------- ▼ items ▼ ----------*/}
          <Show when={AvalableItems().length > 0}>
            <ExpansionPanel>
              <div class={`${styles.optionHeader}`}>
                <Input 
                  name="allItems" 
                  type="checkbox" 
                  onChange={(e)=>{
                    if (e.currentTarget.checked) {
                      setToAddLists({items:[...homebrewManager.items()]})
                    } else {
                      setToAddLists({items: []})
                    }
                  }}
                  checked={homebrewManager.items().length === toAddLists.items.length}
                /> <label for="allItems">Items</label>
              </div>
              <div class={`${styles.innerList}`}>
                <For each={AvalableItems()}>
                  { (item) => <Show when={!exportObject.items.includes(item)}><li>
                    <Input 
                      name={item.item} 
                      type="checkbox" 
                      onChange={(e)=>{
                        if (e.currentTarget.checked) {
                          setToAddLists(old=>({items:[...old.items,item]}))
                        } else {
                          setToAddLists(old=>({items:[...old.items.filter(s=>s.item !== item.item)]}))
                        }
                      }}
                      checked={!!toAddLists.items.find(s=>s.item === item.item)}
                    /> <label for={item.item}>{item.item}</label>
                  </li></Show>}
                </For>
              </div>
            </ExpansionPanel>

          </Show>

          {/*---------- ▼ races ▼ ----------*/}
          <Show when={AvalableRaces().length > 0}>
            <ExpansionPanel>
              <div class={`${styles.optionHeader}`}>
                <Input 
                  name="allRaces" 
                  type="checkbox" 
                  onChange={(e)=>{
                    if (e.currentTarget.value) {
                      setToAddLists({races:[...homebrewManager.races()]})
                    } else {
                      setToAddLists({races: []})
                    }
                  }}
                  checked={homebrewManager.races().length === toAddLists.feats.length}
                /> <label for="allRaces">Races</label>
              </div>
              <div class={`${styles.innerList}`}>
                <For each={AvalableRaces()}>
                  { (race) => <Show when={!exportObject.races.includes(race)}><li>
                    <Input 
                      name={race.name}  
                      type="checkbox" 
                      onChange={(e)=>{
                        if (e.currentTarget.checked) {
                          setToAddLists(old=>({races:[...old.races,race]}))
                        } else {
                          setToAddLists(old=>({races:[...old.races.filter(s=>s.name === race.name)]}))
                        }
                      }}
                    /> <label for={race.name}>{race.name}</label>
                  </li></Show>}
                </For>
              </div>
            </ExpansionPanel>
          </Show>

          {/*---------- ▼ characters ▼ ----------
                        **  An Expanstion panel goes here  **
                    
                        ▲ ----------    ---------- ▲ */}
        </ul> 

        <div class={`${styles.switchBtns}`}>
          <Button onClick={addOptionObject} title="Add To List">→</Button>
          <Button onClick={removeOptionObject} title="Remove From List">←</Button>
        </div>
      </div>

            
    </div>

    <div class={`${styles.divider}`}>

    </div>

    <div class={`${styles.rightList}`}>
      <h2>Active Options</h2>
            
      <div class={`${styles.innerRow}`}>
                
        <ul class={`${styles.list}`}>
          {/*---------- ▼  Gamesystems ▼ ----------
                        **  An Expanstion panel goes here  **
                        
                        ▲ ----------    ---------- ▲ */ }
                    

          <Show when={exportObject.spells.length > 0}>
            <ExpansionPanel>
              <div class={`${styles.optionHeader}`}>
                <Input 
                  name="allAddedSpells"
                  type="checkbox"
                  onChange={(e)=>{
                    if (e.currentTarget.checked) {
                      setToRemove({spells:[...exportObject.spells]})
                    } else {
                      setToRemove({spells:[]})
                    }
                  }} 
                  checked={toRemove.spells.length === exportObject.spells.length}
                /> <label>Spells</label>
              </div>

              <div class={`${styles.innerList}`}>
                <For each={exportObject.spells}>
                  { (spell) => <li>
                    <Input
                      name={spell.name} 
                      type="checkbox"
                      onChange={(e)=>{
                        if (e.currentTarget.checked) {
                          setToRemove(old=>({spells:[...old.spells,spell]}))
                        } else {
                          setToRemove(old=>({spells:[...old.spells.filter(s=>s.name !== spell.name)]}))
                        }
                      }}
                      checked={!!toRemove.spells.find(s=>s.name === spell.name)}
                    /> <label>{spell.name}</label>
                  </li>}
                </For>
              </div>
            </ExpansionPanel>
          </Show>

          <Show when={exportObject.feats.length > 0}>
            <ExpansionPanel>
              <div class={`${styles.optionHeader}`}>
                <Input
                  name="allAddedFeats"
                  type="checkbox" 
                  onChange={(e)=>{
                    if (e.currentTarget.checked) {
                      setToRemove({feats:[...exportObject.feats]})
                    } else {
                      setToRemove({feats:[]})
                    }
                  }}
                  checked={toRemove.feats.length === exportObject.feats.length}
                /> <label>Feats</label>
              </div>

              <div class={`${styles.innerList}`}>
                <For each={exportObject.feats}>
                  { (feat) => <li>
                    <Input 
                      name={feat.name}
                      type="checkbox"
                      onChange={(e)=>{
                        if (e.currentTarget.checked) {
                          setToRemove(old=>({feats:[...old.feats,feat]}));
                        } else {
                          setToRemove(old=>({feats:[...old.feats.filter(f=>f.name !== feat.name)]}));
                        }
                      }}
                      checked={!!toRemove.feats.find(f=>f.name === feat.name)}
                    /> <label>{feat.name}</label>
                  </li>}
                </For>
              </div>
            </ExpansionPanel>
          </Show>

          <Show when={exportObject.srdclasses.length > 0}>
            <ExpansionPanel>
              <div class={`${styles.optionHeader}`}>
                <Input 
                  name="allAddedClasses"
                  type="checkbox"
                  onChange={(e)=>{
                    if (e.currentTarget.checked) {
                      setToRemove({srdclasses:[...exportObject.srdclasses]})
                    } else {
                      setToRemove({srdclasses:[]})
                    }
                  }}
                /> <label>Classes</label>
              </div>
              <div class={`${styles.innerList}`}>
                <For each={exportObject.srdclasses}>
                  { (dndclass) => <li>
                    <Input 
                      name={dndclass.name}
                      type="checkbox"
                      onChange={(e)=>{
                        if (e.currentTarget.checked) {
                          setToRemove(old=>({srdclasses:[...old.srdclasses,dndclass]}))
                        } else {
                          setToRemove(old=>({srdclasses:[...old.srdclasses.filter(c=>c.name !== dndclass.name)]}))
                        }
                      }}
                      checked={!!toRemove.srdclasses.find(c=>c.name === dndclass.name)}
                    /> <label>{dndclass.name}</label>
                  </li>}
                </For>
              </div>
            </ExpansionPanel>
          </Show>

          <Show when={exportObject.backgrounds.length > 0}>
            <ExpansionPanel>
              <div class={`${styles.optionHeader}`}>
                <Input 
                  name="allAddedClasses"
                  type="checkbox"
                  onChange={(e)=>{
                    if (e.currentTarget.checked) {
                      setToRemove({backgrounds:[...exportObject.backgrounds]})
                    } else {
                      setToRemove({backgrounds:[]})
                    }
                  }}
                  checked={toRemove.backgrounds.length === exportObject.backgrounds.length}
                /> <label>Classes</label>
              </div>

              <div class={`${styles.innerList}`}>
                <For each={exportObject.backgrounds}>
                  { (background) => <li>
                    <Input 
                      name={background.name}
                      type="checkbox"
                      onChange={(e)=>{
                        if (e.currentTarget.checked) {
                          setToRemove(old=>({backgrounds:[...old.backgrounds,background]}))
                        } else {
                          setToRemove(old=>({backgrounds:[...old.backgrounds.filter(b=>b.name !== background.name)]}))
                        }
                      }}
                      checked={!!toRemove.backgrounds.find(b=>b.name === background.name)}
                    /> <label>{background.name}</label>
                  </li>}
                </For>
              </div>
            </ExpansionPanel>
          </Show>

          <Show when={exportObject.items.length > 0}>
            <ExpansionPanel>
              <div class={`${styles.optionHeader}`}>
                <Input 
                  name="allAddedItems"
                  type="checkbox"
                  onChange={(e)=>{
                    if (e.currentTarget.checked) {
                      setToRemove({items:[...exportObject.items]})
                    } else {
                      setToRemove({items:[]})
                    }
                  }}
                  checked={toRemove.items.length === exportObject.items.length}
                /> <label>Items</label>
              </div>

              <div class={`${styles.innerList}`}>
                <For each={exportObject.items}>
                  { (item) => <li>
                    <Input 
                      name={item.item}
                      type="checkbox"
                      onChange={(e)=>{
                        if (e.currentTarget.checked) {
                          setToRemove(old=>({items:[...old.items,item]}))
                        } else {
                          setToRemove(old=>({items:[...old.items.filter(i=>i.item !== item.item)]}))
                        }
                      }}
                      checked={!!toRemove.items.find(i=>i.item === item.item)}
                    /> <label>{item.item}</label>
                  </li>}
                </For>
              </div>
            </ExpansionPanel>
          </Show>

          <Show when={exportObject.races.length > 0}>
            <ExpansionPanel>
              <div class={`${styles.optionHeader}`}>
                <Input  
                  name="allAddedRaces"
                  type="checkbox"
                  onChange={(e)=>{
                    if (e.currentTarget.checked) {
                      setToRemove({races:[...exportObject.races]})
                    } else {
                      setToRemove({races:[]})
                    }
                  }}
                  checked={toRemove.races.length === exportObject.races.length}
                /> <label>Races</label>
              </div>

              <div class={`${styles.innerList}`}>
                <For each={exportObject.races}>
                  { (race) => <li>
                    <Input 
                      name={race.name}
                      type="checkbox"
                      onChange={(e)=>{
                        if (e.currentTarget.checked) {
                          setToRemove(old=>({races:[...old.races,race]}))
                        } else {
                          setToRemove(old=>({races:[...old.races.filter(r=>r.name !== race.name)]}))
                        }
                      }}
                      checked={!!toRemove.races.find(r=>r.name === race.name)}
                    /> <label>{race.name}</label>
                  </li>}
                </For>
              </div>
            </ExpansionPanel>
          </Show>


          {/*---------- ▼ characters ▼ ----------
                        **  An Expanstion panel goes here  **
                    
                        ▲ ----------    ---------- ▲ */}
        </ul> 


      </div> 
            
      <Button onClick={()=>setShowConfirm(!showConfirm())} class={`${styles.ExportBtn}`}>Export!</Button>
    </div>

    <Show when={showConfirm()}>
      <Modal title="Confirm & Name" show={[showConfirm,setShowConfirm]} height="15%" width="25%">
        <div class={`${styles.confirmContent}`}>
          <Input id="confirm-name" type="text" /> <Button onClick={exportToObject} type="submit">Confirm</Button>   
        </div>
      </Modal>
    </Show>

  </div>
}

export default Exporting