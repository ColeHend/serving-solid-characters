import { Component, For } from "solid-js";
import styles from "./Exporting.module.scss";
import { Button, ExpansionPanel, homebrewManager, Input } from "../../../shared";
import { BehaviorSubject } from "rxjs";

const Exporting:Component = () => {

    const ActiveOptions = new BehaviorSubject<[]>([]);

    const addOptionToList = () => {

        



    }

    return <div class={`${styles?.wrapper}`}>
        
        <div class={`${styles.leftList}`}>
            <h2>Avalable Options</h2>
            
            <div class={`${styles.innerRow}`}>
                <ul class={`${styles.list}`}>
                    {/* Gamesystems 
                        **  An Expanstion panel goes here  **
                        
                    */}
                    {/* spells */}
                    <ExpansionPanel>
                        <div class={`${styles.optionHeader}`}>
                           <Input name="allSpells" type="checkbox" /> <label for="allSpells">Spells</label>
                        </div>
                        <div class={`${styles.innerList}`}>
                            <For each={homebrewManager.spells()}>
                                { (spell,i) => <li>
                                    <Input name={spell.name} type="checkbox" /> <label for={spell.name}>{spell.name}</label>    
                                </li>}
                            </For>
                        </div>
                    </ExpansionPanel>
                    {/* feats */}
                    <ExpansionPanel>
                        <div class={`${styles.optionHeader}`}>
                            <Input name="allFeats" type="checkbox" /> <label for="allFeats">Feats</label>
                        </div>
                        <div class={`${styles.innerList}`}>
                            <For each={homebrewManager.feats()}>
                                { (feat,i) => <li>
                                    <Input name={feat.name} type="checkbox" /> <label for={feat.name}>{feat.name}</label>    
                                </li>}
                            </For>
                        </div>
                    </ExpansionPanel>
                    {/* classes */}
                    <ExpansionPanel>
                        <div class={`${styles.optionHeader}`}>
                            <Input name="allClasses" type="checkbox" /> <label for="allClasses">Classes</label>
                        </div>
                        <div class={`${styles.innerList}`}>
                            <For each={homebrewManager.classes()}>
                                { (dndClass, i) => <li>
                                    <Input name={dndClass.name} type="checkbox" /> <label for={dndClass.name}>{dndClass.name}</label>
                                </li>}
                            </For>
                        </div>
                    </ExpansionPanel>
                    {/* backgrounds */}
                    <ExpansionPanel>
                        <div class={`${styles.optionHeader}`}>
                            <Input name="allBackgrounds" type="checkbox" /> <label for="allBackgrounds">Backgrounds</label>
                        </div>
                        <div class={`${styles.innerList}`}>
                            <For each={homebrewManager.backgrounds()}>
                                { (background, i) => <li>
                                    <Input name={background.name} type="checkbox" /> <label for={background.name}>{background.name}</label>    
                                </li>}
                            </For>
                        </div>
                    </ExpansionPanel>
                    {/* items */}
                    <ExpansionPanel>
                        <div class={`${styles.optionHeader}`}>
                            <Input name="allItems" type="checkbox" /> <label for="allItems">Items</label>
                        </div>
                        <div class={`${styles.innerList}`}>
                            <For each={homebrewManager.items()}>
                                { (item,i) => <li>
                                    <Input name={item.item} type="checkbox" /> <label for={item.item}>{item.item}</label>
                                </li>}
                            </For>
                        </div>
                    </ExpansionPanel>
                    {/* races */}
                    <ExpansionPanel>
                        <div class={`${styles.optionHeader}`}>
                            <Input name="allRaces" type="checkbox" /> <label for="allRaces">Races</label>
                        </div>
                        <div class={`${styles.innerList}`}>
                            <For each={homebrewManager.races()}>
                                { (race,i) => <li>
                                    <Input name={race.name}  type="checkbox" /> <label for={race.name}>{race.name}</label>
                                </li>}
                            </For>
                        </div>
                    </ExpansionPanel>
                    {/* characters
                        **  An Expanstion panel goes here  **
                    
                    */}
                </ul> 

                <div class={`${styles.switchBtns}`}>
                    <Button>→</Button>
                    <Button>←</Button>
                </div>
            </div>

            
        </div>

        <div class={`${styles.divider}`}>

        </div>

        <div class={`${styles.rightList}`}>
            <h2>Active Options</h2>
            
            <div class={`${styles.innerRow}`}>
                
                <ul class={`${styles.list}`}>

                </ul> 


            </div> 
            
            <Button class={`${styles.ExportBtn}`}>Export!</Button>
        </div>

    </div>
}

export default Exporting