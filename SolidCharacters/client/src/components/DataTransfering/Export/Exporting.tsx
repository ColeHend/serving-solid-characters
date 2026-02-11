import { Component, createMemo, createSignal, For, Show } from "solid-js";
import styles from "./Exporting.module.scss";
import { characterManager, homebrewManager, isNullish, spellComponents } from "../../../shared";
import {Button,Input,ExpansionPanel,Modal, Checkbox} from "coles-solid-library";
import { Trade } from "../../../models/trade.model";
import { createStore } from "solid-js/store";
import { downloadObjectAsJson } from "../../../shared/customHooks/utility/tools/downloadObjectAsJson";
import { Spell } from "../../../models";
import { Background, Class5E, Feat, Item, Race } from "../../../models/data";
import { Character } from "../../../models/character.model";

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
    switch (key) { 
      case "feats":
        return !!exportObject[key].find((d)=>{
          const Data = d as any as Feat;
          const incomingData = data as any as Feat;
          // if (Object.keys(d).includes("spells")) return d.name === data.name
          return Data.details.name === incomingData.details.name
        });
      
      default: 
        return !!exportObject[key].find((d)=>{
          const Data = d as any;
          const incomingData = data as any;

          return Data.name === incomingData.name
        });
    }

  
  }

  const isInRemoveObj = <T extends keyof Trade,>(key: T, data: Trade[T][number])=>{
    switch (key){
      case "feats":
        return !!toRemove[key].find((d)=>{
          const data = d as any as Feat;
          const incomingData = data as any as Feat;
          
          return data.details.name === incomingData.details.name
        })
      
      default:
        return !!toRemove[key].find((d)=>{
          const data = d as any;
          const incomingData = data as any;

          return data.name === incomingData.name;
        })
    }
    
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
  const AvalableChars = createMemo(()=>characterManager.characters().filter(char=>!isInExport("characters",char)));

  const [showConfirm,setShowConfirm] = createSignal<boolean>(false);
  const arrowSize = {width:'32px',height:'32px'};
  return <div class={`${styles.body}`}>
        
    <div class={`${styles.leftList}`}>
      <h2>Avalable Options</h2>
            
      <div class={`${styles.innerRow}`}>
        <ul class={`${styles.list}`}>
          {/*---------- ▼  Gamesystems ▼ ----------
            **  An Expanstion panel goes here  **
                        
           ▲ ----------    ---------- ▲ */ }

          {/*---------- ▼ spells ▼ ----------*/}
          <Show when={AvalableSpells().length > 0}>
            <ExpansionPanel arrowSize={arrowSize}>

              <div class={`${styles.optionHeader}`}>
                <Checkbox 
                  label="Spells"
                  onChange={(e)=>{
                    if (e) {
                      setToAddLists({spells:[...homebrewManager.spells()]})
                    } else {
                      setToAddLists({spells:[]})
                    }
                  }} 
                  checked={homebrewManager.spells().length === toAddLists.spells.length}
                />
              </div>

              <div class={`${styles.innerList}`}>
                <For each={AvalableSpells()}>
                  { (spell) =><Show when={!exportObject.spells.includes(spell)}><li>
                    <Checkbox 
                      label={`${spell.name}`}
                      checked={!!toAddLists.spells.find(s=>s.name === spell.name)}
                      onChange={(e)=>{
                        if (e) {
                          setToAddLists(old=>({spells:[...old.spells,spell]}))
                        } else {    
                          setToAddLists(old=>({spells:[...old.spells.filter(s=>s.name !== spell.name)]}))
                        }
                      }}
                    />
                  </li></Show>}
                </For>
              </div>

            </ExpansionPanel>
          </Show>
                    
          {/*---------- ▼ feats ▼ ----------*/}
          <Show when={AvalableFeats().length > 0}>
            <ExpansionPanel arrowSize={arrowSize}>

              <div class={`${styles.optionHeader}`}>
                <Checkbox 
                  label="Feats"
                  onChange={(e)=>{
                    if (e) {
                      setToAddLists({feats:[...homebrewManager.feats()]})
                    } else {
                      setToAddLists({feats: []})
                    }
                  }}
                  checked={homebrewManager.feats().length === toAddLists.feats.length}
                />
              </div>

              <div class={`${styles.innerList}`}>
                <For each={AvalableFeats()}>
                  { (feat) => <Show when={!exportObject.feats.includes(feat)}><li>
                    <Checkbox
                      label={`${feat.name}`} 
                      onChange={(e)=>{
                        if (e) {
                          setToAddLists(old=>({feats:[...old.feats,feat]}))
                        } else {
                          setToAddLists(old=>({feats:[...old.feats.filter(s=>s.details.name !== feat.details.name)]}))
                        }
                      }}
                      checked={!!toAddLists.feats.find(s=>s.details.name === feat.details.name)}
                    />    
                  </li></Show>}
                </For>
              </div>

            </ExpansionPanel>
          </Show>

          {/*---------- ▼ classes ▼ ----------*/}
          <Show when={AvalableClasses().length > 0}>
            <ExpansionPanel arrowSize={arrowSize}>
              <div class={`${styles.optionHeader}`}>
                <Checkbox 
                  label="Classes"
                  onChange={(e)=>{
                    if (e) {
                      setToAddLists({srdclasses: [...homebrewManager.classes()]})
                    } else {
                      setToAddLists({srdclasses:[]})
                    }
                  }}
                  checked={homebrewManager.classes().length === toAddLists.srdclasses.length}
                />
              </div>
              <div class={`${styles.innerList}`}>
                <For each={AvalableClasses()}>
                  { (dndClass) => <Show when={!exportObject.srdclasses.includes(dndClass)}><li>
                    <Checkbox 
                      label={`${dndClass.name}`}
                      onChange={(e)=>{
                        if (e) {
                          setToAddLists(old=>({srdclasses:[...old.srdclasses,dndClass]}))
                        } else {
                          setToAddLists(old=>({srdclasses:[...old.srdclasses.filter(s=>s.name !== dndClass.name)]}))
                        }
                      }}
                      checked={!!toAddLists.srdclasses.find(s=>s.name === dndClass.name)}
                    />
                  </li></Show>}
                </For>
              </div>
            </ExpansionPanel>
          </Show>

          {/*---------- ▼ backgrounds ▼ ----------*/}
          <Show when={AvalableBackground().length > 0}>
            <ExpansionPanel arrowSize={arrowSize}>
              <div class={`${styles.optionHeader}`}>
                <Checkbox
                  label="Backgrounds"
                  onChange={(e)=>{
                      if (e) {
                        setToAddLists({backgrounds:[...homebrewManager.backgrounds()]})
                      } else {
                        setToAddLists({srdclasses:[]})
                      }
                    }}
                  checked={homebrewManager.backgrounds().length === toAddLists.backgrounds.length}
                />
              </div>
              <div class={`${styles.innerList}`}>
                <For each={AvalableBackground()}>
                  { (background) => <Show when={!exportObject.backgrounds.includes(background)}><li>
                    <Checkbox 
                      label={`${background.name}`}
                      onChange={(e)=>{
                        if (e) {
                          setToAddLists(old=>({backgrounds:[...old.backgrounds,background]}))
                        } else {
                          setToAddLists(old=>({backgrounds:[...old.backgrounds.filter(s=>s.name === background.name)]}))
                        }
                      }}
                      checked={!!toAddLists.backgrounds.find(s=>s.name === background.name)}
                    />  
                  </li></Show>}
                </For>
              </div>
            </ExpansionPanel>

          </Show>

          {/*---------- ▼ items ▼ ----------*/}
          <Show when={AvalableItems().length > 0}>
            <ExpansionPanel arrowSize={arrowSize}>
              <div class={`${styles.optionHeader}`}>
                <Checkbox
                  label="Items"
                  onChange={(e)=>{
                    if (e) {
                      setToAddLists({items:[...homebrewManager.items()]})
                    } else {
                      setToAddLists({items: []})
                    }
                  }}
                  checked={homebrewManager.items().length === toAddLists.items.length}
                />
              </div>
              <div class={`${styles.innerList}`}>
                <For each={AvalableItems()}>
                  { (item) => <Show when={!exportObject.items.includes(item)}><li>
                    <Checkbox 
                      label={`${item.name}`}
                      onChange={(e)=>{
                        if (e) {
                          setToAddLists(old=>({items:[...old.items,item]}))
                        } else {
                          setToAddLists(old=>({items:[...old.items.filter(s=>s.name !== item.name)]}))
                        }
                      }}
                      checked={!!toAddLists.items.find(s=>s.name === item.name)}
                    />
                  </li></Show>}
                </For>
              </div>
            </ExpansionPanel>

          </Show>

          {/*---------- ▼ races ▼ ----------*/}
          <Show when={AvalableRaces().length > 0}>
            <ExpansionPanel arrowSize={arrowSize}>
              <div class={`${styles.optionHeader}`}>
                <Checkbox 
                  label="Races"
                  onChange={(e)=>{
                    if (e) {
                      setToAddLists({races:[...homebrewManager.races()]})
                    } else {
                      setToAddLists({races: []})
                    }
                  }}
                  checked={homebrewManager.races().length === toAddLists.feats.length}
                />
              </div>
              <div class={`${styles.innerList}`}>
                <For each={AvalableRaces()}>
                  { (race) => <Show when={!exportObject.races.includes(race)}><li>
                    <Checkbox 
                      label={`${race.name}`}
                      onChange={(e)=>{
                        if (e) {
                          setToAddLists(old=>({races:[...old.races,race]}))
                        } else {
                          setToAddLists(old=>({races:[...old.races.filter(s=>s.name !== race.name)]}))
                        }
                      }}
                      checked={!!toAddLists.races.find(s => s.name === race.name)}
                    />
                  </li></Show>}
                </For>
              </div>
            </ExpansionPanel>
          </Show>

          {/*---------- ▼ characters ▼ ----------*/}
          <Show when={AvalableChars().length > 0}>
            <ExpansionPanel arrowSize={arrowSize}>
              <div class={`${styles.optionHeader}`}>
                <Checkbox 
                  label="Characters"
                  onChange={(e)=>{
                    if (e) {
                      setToAddLists({characters:[...characterManager.characters()]})
                    } else {
                      setToAddLists({characters: []})
                    }
                    
                  }}
                  checked={characterManager.characters().length === toAddLists.characters.length}
                />
              </div>
              <div class={`${styles.innerList}`}>
                  <For each={AvalableChars()}>
                    { (character) => <li><Show when={!exportObject.characters.includes(character)}>
                      <Checkbox 
                        label={`${character.name}`}
                        onChange={(e)=>{
                          if (e) {
                            setToAddLists(old => ({characters: [...old.characters,character]}))
                          } else {
                            setToAddLists(old => ({characters: [...old.characters.filter(c => c.name !== character.name)]}))
                          }
                        }}
                        checked={!!toAddLists.characters.find(c => c.name === character.name)}
                      />  
                    </Show></li>}
                  </For>
              </div>
            </ExpansionPanel>
          </Show>
        </ul> 

        <div class={`${styles.switchBtns}`}>
          <Button onClick={addOptionObject} title="Add To List">→</Button>
          <Button onClick={removeOptionObject} title="Remove From List">←</Button>
        </div>
      </div>

    </div>

    <div class={`${styles.divider}`} />

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
                <Checkbox 
                  label="Spells"
                  onChange={(e)=>{
                    if (e) {
                      setToRemove({spells:[...exportObject.spells]})
                    } else {
                      setToRemove({spells:[]})
                    }
                  }} 
                  checked={toRemove.spells.length === exportObject.spells.length}
                />
              </div>

              <div class={`${styles.innerList}`}>
                <For each={exportObject.spells}>
                  { (spell) => <li>
                    <Checkbox 
                      label={`${spell.name}`}
                      onChange={(e)=>{
                        if (e) {
                          setToRemove(old=>({spells:[...old.spells,spell]}))
                        } else {
                          setToRemove(old=>({spells:[...old.spells.filter(s=>s.name !== spell.name)]}))
                        }
                      }}
                      checked={!!toRemove.spells.find(s=>s.name === spell.name)}
                    />
                  </li>}
                </For>
              </div>
            </ExpansionPanel>
          </Show>

          <Show when={exportObject.feats.length > 0}>
            <ExpansionPanel>
              <div class={`${styles.optionHeader}`}>
                <Checkbox 
                  label="Feats"
                  onChange={(e)=>{
                    if (e) {
                      setToRemove({feats:[...exportObject.feats]})
                    } else {
                      setToRemove({feats:[]})
                    }
                  }}
                  checked={toRemove.feats.length === exportObject.feats.length}
                />
              </div>

              <div class={`${styles.innerList}`}>
                <For each={exportObject.feats}>
                  { (feat) => <li>
                    <Checkbox 
                      label={`${feat.details.name}`}
                      onChange={(e)=>{
                        if (e) {
                          setToRemove(old=>({feats:[...old.feats,feat]}));
                        } else {
                          setToRemove(old=>({feats:[...old.feats.filter(f=>f.details.name !== feat.details.name)]}));
                        }
                      }}
                      checked={!!toRemove.feats.find(f=>f.details.name === feat.details.name)}
                    />
                  </li>}
                </For>
              </div>
            </ExpansionPanel>
          </Show>

          <Show when={exportObject.srdclasses.length > 0}>
            <ExpansionPanel>
              <div class={`${styles.optionHeader}`}>
                <Checkbox 
                  label="Classes"
                  onChange={(e)=>{
                    if (e) {
                      setToRemove({srdclasses:[...exportObject.srdclasses]})
                    } else {
                      setToRemove({srdclasses:[]})
                    }
                  }}
                  checked={toRemove.srdclasses.length === exportObject.srdclasses.length}

                />
              </div>
              <div class={`${styles.innerList}`}>
                <For each={exportObject.srdclasses}>
                  { (dndclass) => <li>
                    <Checkbox 
                      label={`${dndclass.name}`}
                      onChange={(e)=>{
                        if (e) {
                          setToRemove(old=>({srdclasses:[...old.srdclasses,dndclass]}))
                        } else {
                          setToRemove(old=>({srdclasses:[...old.srdclasses.filter(c=>c.name !== dndclass.name)]}))
                        }
                      }}
                      checked={!!toRemove.srdclasses.find(c=>c.name === dndclass.name)}
                    />
                  </li>}
                </For>
              </div>
            </ExpansionPanel>
          </Show>

          <Show when={exportObject.backgrounds.length > 0}>
            <ExpansionPanel>
              <div class={`${styles.optionHeader}`}>
                <Checkbox 
                  label="Backgrounds"
                  onChange={(e)=>{
                    if (e) {
                      setToRemove({backgrounds:[...exportObject.backgrounds]})
                    } else {
                      setToRemove({backgrounds:[]})
                    }
                  }}
                  checked={toRemove.backgrounds.length === exportObject.backgrounds.length}
                />
              </div>

              <div class={`${styles.innerList}`}>
                <For each={exportObject.backgrounds}>
                  { (background) => <li>
                    <Checkbox 
                      label={`${background.name}`}
                      onChange={(e)=>{
                        if (e) {
                          setToRemove(old=>({backgrounds:[...old.backgrounds,background]}))
                        } else {
                          setToRemove(old=>({backgrounds:[...old.backgrounds.filter(b=>b.name !== background.name)]}))
                        }
                      }}
                      checked={!!toRemove.backgrounds.find(b=>b.name === background.name)}
                    />
                  </li>}
                </For>
              </div>
            </ExpansionPanel>
          </Show>

          <Show when={exportObject.items.length > 0}>
            <ExpansionPanel>
              <div class={`${styles.optionHeader}`}>
                <Checkbox 
                  label="Items"
                  onChange={(e)=>{
                    if (e) {
                      setToRemove({items:[...exportObject.items]})
                    } else {
                      setToRemove({items:[]})
                    }
                  }}
                  checked={toRemove.items.length === exportObject.items.length}
                />
              </div>

              <div class={`${styles.innerList}`}>
                <For each={exportObject.items}>
                  { (item) => <li>
                    <Checkbox 
                      label={`${item.name}`}
                       onChange={(e)=>{
                        if (e) {
                          setToRemove(old=>({items:[...old.items,item]}))
                        } else {
                          setToRemove(old=>({items:[...old.items.filter(i=>i.name !== item.name)]}))
                        }
                      }}
                      checked={!!toRemove.items.find(i=>i.name === item.name)}
                    />
                  </li>}
                </For>
              </div>
            </ExpansionPanel>
          </Show>

          <Show when={exportObject.races.length > 0}>
            <ExpansionPanel>
              <div class={`${styles.optionHeader}`}>
                <Checkbox 
                  label="Races"
                  onChange={(e)=>{
                    if (e) {
                      setToRemove({races:[...exportObject.races]})
                    } else {
                      setToRemove({races:[]})
                    }
                  }}
                  checked={toRemove.races.length === exportObject.races.length}
                />
              </div>

              <div class={`${styles.innerList}`}>
                <For each={exportObject.races}>
                  { (race) => <li>
                    <Checkbox 
                      label={`${race.name}`}
                      onChange={(e)=>{
                        if (e) {
                          setToRemove(old=>({races:[...old.races,race]}))
                        } else {
                          setToRemove(old=>({races:[...old.races.filter(r=>r.name !== race.name)]}))
                        }
                      }}
                      checked={!!toRemove.races.find(r=>r.name === race.name)}
                    />
                  </li>}
                </For>
              </div>
            </ExpansionPanel>
          </Show>

          <Show when={exportObject.characters.length > 0}>
            <ExpansionPanel>
              <div class={`${styles.optionHeader}`}>
                <Checkbox 
                  label="Characters"
                  onChange={(e)=>{
                    if (e) {
                      setToRemove({characters: [...exportObject.characters]})
                    } else {
                      setToRemove({characters: []})
                    }
                  }}
                  checked={toRemove.characters.length === exportObject.characters.length}
                />
              </div>
              <div class={`${styles.innerList}`}>
                <For each={exportObject.characters}>
                  { (character) => <li>
                    <Checkbox 
                      label={`${character.name}`}
                      onChange={(e)=>{
                        if (e) {
                          setToRemove(old => ({characters: [...old.characters, character]}))
                        } else {
                          setToRemove(old => ({characters: [...old.characters.filter(c => c.name !== character.name)]}))
                        }
                      }}
                      checked={!!toRemove.characters.find(c => c.name === character.name)}
                    />
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