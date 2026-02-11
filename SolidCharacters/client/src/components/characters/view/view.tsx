import { Component, For, Show, createMemo, createSignal, onCleanup, onMount } from "solid-js";
import styles from "./view.module.scss";
import StatBar from "./stat-bar/statBar";
import { useSearchParams } from "@solidjs/router";
import { effect } from "solid-js/web";
import useGetFullStats from "../../../shared/customHooks/dndInfo/useGetFullStats";
import useStyles from "../../../shared/customHooks/utility/style/styleHook";
import getUserSettings from "../../../shared/customHooks/userSettings";
import { Body, Select, Option, Input, FormField, TabBar, Button, Checkbox, Table, Column, Header, Cell, Row, ExpansionPanel, Icon } from "coles-solid-library";
import { Character, CharacterGear, CharacterSpell } from "../../../models/character.model";
import { Item, Spell } from "../../../models";
// import { useGetItems } from "../../../shared";
import SpellModal from "../../../shared/components/modals/spellModal/spellModal.component";
import { useDnDSpells } from "../../../shared/customHooks/dndInfo/info/all/spells";
import { useDnDItems } from "../../../shared/customHooks/dndInfo/info/all/items";
import { characterManager, Clone } from "../../../shared";
import { SpellTable } from "./SpellTable/SpellTable";

const CharacterView: Component = () => {
  // eslint-disable-next-line
  const [userSettings, setUserSettings] = getUserSettings();
  const allSpells = useDnDSpells();
  const allItems = useDnDItems();
  const getKnownSpells = (character: Character) => {
    return allSpells().filter(spell => character?.spells.some(s => s.name === spell.name));
  }
  const getCurrentItems = (items: string[]) => {
    return allItems().filter(item => items?.includes(item.name));
  }
  const stylin = createMemo(() => useStyles(userSettings().theme));


  const [searchParam, setSearchParam] = useSearchParams();
   
  const [characters, setCharacters] = createSignal(characterManager.characters());
  if (!searchParam.name) setSearchParam({ name: (characters()?.[0]?.name ?? '') });
  const selectedCharacter = characters().filter(x => x.name.toLowerCase() === (typeof searchParam.name === "string" ? searchParam.name : searchParam.name?.join(" ") || (characters()?.[0].name ?? '')).toLowerCase())?.[0];

  const [currentCharacter, setCurrentCharacter] = createSignal<Character>(selectedCharacter);
  const [activeMobileTab, setActiveMobileTab] = createSignal(0);
  const [activeActionTab, setActiveActionTab] = createSignal(0);
  const [currentSelectedSpell, setCurrentSelectedSpell] = createSignal<Spell>({} as Spell);
  const [showSpellModal, setShowSpellModal] = createSignal(false);
  const showSpellModalHandler = (spell: Spell) => {
    setCurrentSelectedSpell(spell);
    setShowSpellModal(true);
  }

  const [actionList, setActionList] = createSignal<{name:string, desc:string;}[]>([
    { name: "Attack", desc: "Make a melee or ranged attack." },
    { name: "Magic", desc: "Cast a spell." },
    { name: "Dash", desc: "Double your movement speed for the turn." },
    { name: "Disengage", desc: "Move without provoking opportunity attacks." },
    { name: "Dodge", desc: "Focus on avoiding attacks, giving attackers disadvantage." },
    { name: "Help", desc: "Assist an ally, giving them advantage on their next attack." },
    { name: "Hide", desc: "Attempt to hide from enemies." },
    { name: "Ready", desc: "Prepare an action to trigger later." },
    { name: "Search", desc: "Look for hidden objects or creatures." },
    { name: "Use an Object", desc: "Interact with an object." }
  ]);
  const [bonusActionList, setBonusActionList] = createSignal<{name:string, desc:string;}[]>([
    { name: "Second Wind", desc: "Regain hit points." },
    { name: "Rage", desc: "Enter a state of heightened combat prowess." },
    { name: "Healing Word", desc: "Heal an ally with a quick spell." }
  ]);
  const [reactionList, setReactionList] = createSignal<{name:string, desc:string;}[]>([
    { name: "Opportunity Attack", desc: "Make a melee attack against a creature that leaves your reach." },
    { name: "Shield", desc: "Cast the Shield spell in response to an attack." },
    { name: "Counterspell", desc: "Attempt to interrupt a spell being cast." },
    { name: "Hellish Rebuke", desc: "Deal fire damage to a creature that damaged you." }
  ]);
  const [currentActionList, setCurrentActionList] = createSignal(actionList());
  const [currentViewedItems, setCurrentViewedItems] = createSignal<string[]>(currentCharacter()?.items.inventory);

  const fullStats = useGetFullStats(currentCharacter);

  const [isMobile, setIsMobile] = createSignal(false);
  onMount(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const apply = (e: MediaQueryList | MediaQueryListEvent) => setIsMobile(e.matches);
    apply(mq);
    const listener = (e: MediaQueryListEvent) => apply(e);
    mq.addEventListener("change", listener);
    onCleanup(() => mq.removeEventListener("change", listener));
    setCharacters(characterManager.characters());
  });

  type ActionRow = { name: string; range: string; damage: string };
  const [actionTableData, setActionTableData] = createSignal<ActionRow[]>([
    { name: "Longsword", range: "Melee", damage: "1d8 slashing" },
    { name: "Shortbow", range: "Range 80/320", damage: "1d6 piercing" }
  ]);
  const showActions = () => !isMobile() || activeMobileTab() === 0;
  const showStats = () => !isMobile() || activeMobileTab() === 1;
  const showFeatures = () => !isMobile() || activeMobileTab() === 2;

  const sortSpellsByLevel = (knSpells: Spell[], level: number) => {
    
    const toReturn = Clone(knSpells).filter(spell => +spell.level === level);

    return toReturn;
  }

  const cantrips = createMemo(() => sortSpellsByLevel(getKnownSpells(currentCharacter()), 0));
  const firstLevelSpells = createMemo(() => sortSpellsByLevel(getKnownSpells(currentCharacter()), 1));
  const secondLevelSpells = createMemo(() => sortSpellsByLevel(getKnownSpells(currentCharacter()), 2));
  const thirdLevelSpells = createMemo(() => sortSpellsByLevel(getKnownSpells(currentCharacter()), 3));
  const fourthLevelSpells = createMemo(() => sortSpellsByLevel(getKnownSpells(currentCharacter()), 4));
  const fifthLevelSpells = createMemo(() => sortSpellsByLevel(getKnownSpells(currentCharacter()), 5));
  const sixthLevelSpells = createMemo(() => sortSpellsByLevel(getKnownSpells(currentCharacter()), 6));
  const seventhLevelSpells = createMemo(() => sortSpellsByLevel(getKnownSpells(currentCharacter()), 7));
  const eighthLevelSpells = createMemo(() => sortSpellsByLevel(getKnownSpells(currentCharacter()), 8));
  const ninthLevelSpells = createMemo(() => sortSpellsByLevel(getKnownSpells(currentCharacter()), 9));

  effect(() => {
    setSearchParam({ name: currentCharacter()?.name })
  })

  onMount(() => {
    document.body.classList.add("character-view-bg");
  })

  onCleanup(() => {
    document.body.classList.remove("character-view-bg");
  })
  
  return (
    <Body class={`${stylin().accent} ${styles.body}`}>
      <h1>Characters View</h1>
      <div>
        <div class={`${styles.viewSheet}`}>
          <div class={`${stylin().box} ${styles.baseCharInfoBox}`}>
            <Select value={currentCharacter()} onChange={(e) => setCurrentCharacter(e)}>
              <For each={characters()}>{(character) => (
                <Option value={character}>{character.name}</Option>
              )}</For>
            </Select>

            <div class={`${styles.innerBoxInfoRow}`}>
              <div class={`${styles.infoBox}`}>
                <Input transparent />
                <hr />
                <span>Background</span>
              </div>

              <div class={`${styles.infoBox}`}>
                <Input transparent />
                <hr />
                <span>Class</span>
              </div>

              <div class={`${styles.levelBox}`}>
                <div class={`${styles.centerdInputBox}`}>
                  <Input transparent type="number" class={`${styles.levelInput}`} />
                  <hr class={`${styles.bigHR}`} />
                  <span>Level</span>
                </div>
              </div>
            </div>

            <div class={`${styles.innerBoxInfoRow}`}>
              <div class={`${styles.infoBox}`}>
                <Input transparent />
                <hr />
                <span>Species</span>
              </div>

              <div class={`${styles.infoBox}`}>
                <Input transparent />
                <hr />
                <span>Subclass</span>
              </div>
              <div class={`${styles.centerdInputBox}`}>
                <Input transparent type="number" class={`${styles.expInput}`} />
                <hr class={`${styles.smallHR}`} />
                <span>Exp</span>
              </div>
            </div>
          </div>

          <div class={`${styles.lifeBox}`}>
            <div class={`${styles.statHPColumn}`}>
              <div class={`${styles.infoBoxRow}`}>
                <div class={`${styles.infoBoxMini}`}>
                  <Input transparent />
                  <hr />
                  <span>AC</span>
                </div>
                <div class={`${styles.infoBoxMini}`}>
                  <Input transparent />
                  <hr />
                  <span>Initiative</span>
                </div>
                <div class={`${styles.infoBoxMini}`}>
                  <Input transparent />
                  <hr />
                  <span>Speed</span>
                </div>
              </div>
              <div class={`${styles.baseCharInfoBox}  ${styles.infoBoxRow}`}>
                <div class={`${styles.hpMaxTemp}`}>
                  <div>
                    <span>{currentCharacter()?.health?.current} / {currentCharacter()?.health?.max}</span>
                    <hr />
                    <span>HP / MaxHP</span>
                  </div>
                  <div class={`${styles.infoBoxMini}`}>
                    <Input transparent />
                    <hr />
                    <span>Temp HP</span>
                  </div>
                </div>
                <div class={`${styles.healDamageColumn}`}>
                  <Input transparent placeholder="Damage Amnt" />
                  <Button>Heal</Button>
                  <Button>Dmg</Button>
                </div>
              </div>
            </div>
            <div class={`${styles.deathSaveBox}`}>
              <div class={`${styles.deathSaveBoxName}`}>Death Saves</div>
              <div class={`${styles.deathSaveBoxBody}`}>
                <div class={`${styles.deathSaveBoxBodyColumn} ${styles.rightBorder}`}>
                  <span>Pass</span>
                  <Checkbox />
                  <Checkbox />
                  <Checkbox />
                </div>
                <div class={`${styles.deathSaveBoxBodyColumn}`}>
                  <span>Fail</span>
                  <Checkbox />
                  <Checkbox />
                  <Checkbox />
                </div>
              </div>
            </div>
          </div>


        </div>
        <div class={`${styles.viewSheet}`}>
          <Show when={isMobile()}>
            <TabBar
              class={`${styles.notMobileHide} ${styles.tabBar}`}
              tabs={["Actions","Stats/ Skills", "Features", "Other"]}
              onTabChange={(label, index) => {
                setActiveMobileTab(index);
              }}
              activeTab={activeMobileTab()} />
          </Show>


          <Show when={showStats()}>
            <span >
              <StatBar fullStats={fullStats} currentCharacter={currentCharacter} />
            </span>
          </Show>

          <Show when={showActions()}>
            <div class={`${styles.actionsBox}`}>
              <h2>Main</h2>
              <div class={`${styles.actionTable}`}>
                <Table data={actionTableData} columns={["name", "damage", "range"]}>
                  <Column name="name">
                    <Header>Action</Header>
                    <Cell>{(action)=>action.name}</Cell>
                  </Column>
                  <Column name="damage">
                    <Header>Damage</Header>
                    <Cell>{(action) => action.damage || "-"}</Cell>
                  </Column>
                  <Column name="range">
                    <Header>Range</Header>
                    <Cell>{(action) => action.range || "-"}</Cell>
                  </Column>

                  <Row />
                </Table>
              </div>
              <div class={`${styles.actionListContainer}`}>
                <TabBar 
                  activeTab={activeActionTab()} 
                  onTabChange={(label, index) => {
                    setActiveActionTab(index);
                  }}
                  tabs={["Spells", "Items", "Actions"]} />
                <Show when={activeActionTab() === 1}>
                  <div>
                    <div class={`${styles.actionButtonList}`}>
                      <Button onClick={()=>{setCurrentActionList(actionList())}}>Actions</Button>
                      <Button onClick={()=>{setCurrentActionList(bonusActionList())}}>Bonus Actions</Button>
                      <Button onClick={()=>{setCurrentActionList(reactionList())}}>Reactions</Button>
                    </div>
                    <For each={currentActionList()}>{(actionItem)=>{
                      return (<ExpansionPanel arrowSize={{width: '32px', height: '32px'}} class={`${styles.actionList}`}>
                        <span>{actionItem.name}</span>
                        <div class={`${styles.actionList}`}>{actionItem.desc}</div>
                      </ExpansionPanel>)
                    }}</For>
                  </div>
                </Show>
                <Show when={activeActionTab() === 0}>
                  <div class={`${styles.spellTables}`}>
                    <Show when={cantrips().length >= 1}>
                      <SpellTable 
                        spells={cantrips}
                        show={showSpellModalHandler}
                        currentCharacter={currentCharacter} 
                        />
                    </Show>
                
                    <Show when={firstLevelSpells().length > 0}>
                      <SpellTable 
                        spells={firstLevelSpells}
                        show={showSpellModalHandler} 
                        currentCharacter={currentCharacter}
                        />
                    </Show>

                    <Show when={secondLevelSpells().length > 0}>
                      <SpellTable 
                        spells={secondLevelSpells}
                        show={showSpellModalHandler} 
                        currentCharacter={currentCharacter}
                        />
                    </Show>

                    <Show when={thirdLevelSpells().length > 0}>
                      <SpellTable 
                        spells={thirdLevelSpells}
                        show={showSpellModalHandler} 
                        currentCharacter={currentCharacter}
                        />
                    </Show>

                    <Show when={fourthLevelSpells().length > 0}>
                      <SpellTable 
                        spells={fourthLevelSpells}
                        show={showSpellModalHandler} 
                        currentCharacter={currentCharacter}
                      />
                    
                    </Show>

                    <Show when={fifthLevelSpells().length > 0}>
                      <SpellTable 
                        spells={firstLevelSpells}
                        show={showSpellModalHandler} 
                        currentCharacter={currentCharacter}
                      />  
                    </Show>

                    <Show when={sixthLevelSpells().length >  0}>
                      <SpellTable 
                        spells={sixthLevelSpells}
                        show={showSpellModalHandler} 
                        currentCharacter={currentCharacter}
                      />
                    </Show>

                    <Show when={seventhLevelSpells().length > 0}>
                      <SpellTable 
                        spells={seventhLevelSpells}
                        show={showSpellModalHandler} 
                        currentCharacter={currentCharacter}
                      />
                    </Show>

                    <Show when={eighthLevelSpells().length > 0}>
                      <SpellTable 
                        spells={eighthLevelSpells}
                        show={showSpellModalHandler} 
                        currentCharacter={currentCharacter}
                      />
                    </Show>

                    <Show when={ninthLevelSpells().length > 0}>
                      <SpellTable 
                        spells={ninthLevelSpells}
                        show={showSpellModalHandler} 
                        currentCharacter={currentCharacter}
                      />
                    </Show>
                    

                    <SpellModal spell={currentSelectedSpell} backgroundClick={[showSpellModal, setShowSpellModal]} />
                  </div>
                </Show>
                <Show when={activeActionTab() === 2}>
                  <div class={`${styles.actionButtonList}`}>
                    <Button onClick={()=>{setCurrentViewedItems(currentCharacter()?.items.inventory)}}>Inventory</Button>
                    <Button onClick={()=>{setCurrentViewedItems(currentCharacter()?.items.equipped)}}>Equipped</Button>
                    <Button onClick={()=>{setCurrentViewedItems(currentCharacter()?.items.attuned)}}>Attuned</Button>
                  </div>
                  <div class={`${styles.itemTable}`}>
                    <Table data={()=>getCurrentItems(currentViewedItems())} columns={["name","desc", "cost"]}>
                      <Column name="name">
                        <Header>Item</Header>
                        <Cell<Item>>{(item) => item.name}</Cell>
                      </Column>
                      <Column name="desc">
                        <Header>Tags</Header>
                        <Cell<Item>>{(item) => item.tags?.join(', ') || "-"}</Cell>
                      </Column>
                      <Column name="cost">
                        <Header>Cost</Header>
                        <Cell<Item>>{(item) => item.cost ? `${item.cost.quantity} ${item.cost.unit}` : "-"}</Cell>
                      </Column>
                    </Table>  
                  </div>
                </Show>
              </div>
            </div>
          </Show>

          <Show when={showFeatures()}>
            <div class={`${stylin().box} ${styles.featuresBox}`}>
              <h2>Features</h2>
              <For each={currentCharacter()?.levels.flatMap(x => x.features)}>
                {(feature) => (
                  <div class={`${stylin().box} ${styles.featureItem}`}>
                    <h3>{feature.name}</h3>
                    <p>{feature.description}</p>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </div>
      </div>
    </Body>
  )
};

export default CharacterView;