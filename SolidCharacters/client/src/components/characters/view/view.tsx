import { Component, For, Show, createMemo, createSignal, onCleanup, onMount } from "solid-js";
import styles from "./view.module.scss";
import StatBar from "./stat-bar/statBar";
import { useSearchParams } from "@solidjs/router";
import { effect } from "solid-js/web";
import useGetFullStats from "../../../shared/customHooks/dndInfo/useGetFullStats";
import useStyles from "../../../shared/customHooks/utility/style/styleHook";
import getUserSettings from "../../../shared/customHooks/userSettings";
import { Body, Select, Option, Input, TabBar, Button, Checkbox, Table, Column, Header, Cell, Row, Chip } from "coles-solid-library";
import { AdvantageRollType, Character, RollAdvantage } from "../../../models/character.model";
import { Spell } from "../../../models/generated";
import { srdItem } from "../../../models/data/generated";
import SpellModal from "../../../shared/components/modals/spellModal/spellModal.component";
import { useDnDSpells } from "../../../shared/customHooks/dndInfo/info/all/spells";
import { useDnDItems } from "../../../shared/customHooks/dndInfo/info/all/items";
import { characterManager, Clone } from "../../../shared";
import { collectMadFeatures, useMadCharacters } from "../../../shared/customHooks/mads/useMadCharacters";
import { featureUsage, resetFeatureUses, RechargeType, SHORT_REST, LONG_REST } from "../../../shared/customHooks/mads/commands/useUsesFeature";
import UsesTracker from "./usesTracker/usesTracker";
import { SpellTable } from "./SpellTable/SpellTable";
import { FlatCard } from "../../../shared/components/flatCard/flatCard";
import { CreateSheetButton } from "../createSheetButton";

const CharacterView: Component = () => {
  const [userSettings] = getUserSettings();
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

  // The character with its mad commands applied, for display only. Handlers mutate in
  // place, so they always run against a fresh Clone of the persisted character — never
  // the signal's own object (a memo re-run would double-apply) — and the result is
  // never written back to the DB.
  const displayCharacter = createMemo<Character>(() => {
    const base = currentCharacter();
    if (!base) return base;
    const clone = Clone(base);
    return useMadCharacters(clone, collectMadFeatures(clone));
  });

  const [activeMobileTab, setActiveMobileTab] = createSignal(0);
  const [activeActionTab, setActiveActionTab] = createSignal(0);
  const [currentSelectedSpell, setCurrentSelectedSpell] = createSignal<Spell>({} as Spell);
  const [showSpellModal, setShowSpellModal] = createSignal(false);
  const showSpellModalHandler = (spell: Spell) => {
    setCurrentSelectedSpell(spell);
    setShowSpellModal(true);
  }

  const [actionList] = createSignal<{name:string, desc:string;}[]>([
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
  const [bonusActionList] = createSignal<{name:string, desc:string;}[]>([
    { name: "Second Wind", desc: "Regain hit points." },
    { name: "Rage", desc: "Enter a state of heightened combat prowess." },
    { name: "Healing Word", desc: "Heal an ally with a quick spell." }
  ]);
  const [reactionList] = createSignal<{name:string, desc:string;}[]>([
    { name: "Opportunity Attack", desc: "Make a melee attack against a creature that leaves your reach." },
    { name: "Shield", desc: "Cast the Shield spell in response to an attack." },
    { name: "Counterspell", desc: "Attempt to interrupt a spell being cast." },
    { name: "Hellish Rebuke", desc: "Deal fire damage to a creature that damaged you." }
  ]);
  const [currentActionList, setCurrentActionList] = createSignal(actionList());
  const [currentViewedItems, setCurrentViewedItems] = createSignal<string[]>(currentCharacter()?.items.inventory);

  const fullStats = useGetFullStats(displayCharacter);

  const rollAdvantages = createMemo(() => displayCharacter()?.rollAdvantages ?? []);
  const advantagesFor = (rollType: AdvantageRollType) => rollAdvantages().filter(a => a.rollType === rollType);
  const advLabel = (adv: RollAdvantage) =>
    `${adv.mode === "advantage" ? "ADV" : "DIS"}${adv.stat ? ` · ${adv.stat.toUpperCase()}` : ""}${adv.condition ? ` · ${adv.condition}` : ""}`;

  // Every feature source, mads applied: class levels, race, and top-level features
  // (mads-granted picks like invocations land on the top-level array).
  const allFeatures = createMemo(() => {
    const c = displayCharacter();
    if (!c) return [];
    return [
      ...(c.levels ?? []).flatMap(l => l.features ?? []),
      ...(c.race?.features ?? []),
      ...(c.features ?? []),
    ];
  });

  const persistCharacter = (updated: Character) => {
    characterManager.updateCharacter(updated, true);
    setCurrentCharacter(updated);
  };

  const spendUses = (featureName: string, spent: number) => {
    const base = currentCharacter();
    if (!base) return;
    const updated = Clone(base);
    updated.featureUses = { ...(updated.featureUses ?? {}), [featureName]: spent };
    persistCharacter(updated);
  };

  const takeRest = (rest: RechargeType) => {
    const base = currentCharacter();
    if (!base) return;
    const limited = allFeatures().flatMap(f => {
      const usage = featureUsage(f);
      return usage ? [{ name: f.name, recharge: usage.recharge }] : [];
    });
    persistCharacter(resetFeatureUses(Clone(base), rest, limited));
  };

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
  const [actionTableData] = createSignal<ActionRow[]>([
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
            <CreateSheetButton character={currentCharacter()} />

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
                  <Show when={advantagesFor("Initiative").length}>
                    <div class={`${styles.advChips}`}>
                      <For each={advantagesFor("Initiative")}>{(adv) => <Chip value={advLabel(adv)} />}</For>
                    </div>
                  </Show>
                </div>
                <div class={`${styles.infoBoxMini}`}>
                  <Input transparent value={displayCharacter()?.Speed ? `${displayCharacter()?.Speed}` : ""} />
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
              <StatBar fullStats={fullStats} currentCharacter={displayCharacter} rollAdvantages={rollAdvantages} />
            </span>
          </Show>

          <Show when={showActions()}>
            <div class={`${styles.actionsBox}`}>
              <h2>Main</h2>
              <div class={`${styles.attackMeta}`}>
                <span>Attacks per Action: {displayCharacter()?.attacksPerAction ?? 1}</span>
                <For each={advantagesFor("WeaponAttack")}>{(adv) => <Chip value={`${advLabel(adv)} · weapon attacks`} />}</For>
                <For each={advantagesFor("SpellAttack")}>{(adv) => <Chip value={`${advLabel(adv)} · spell attacks`} />}</For>
              </div>
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
                      return (<FlatCard headerName={<span>{actionItem.name}</span>}  class={`${styles.actionList}`} transparent>
                        <div class={`${styles.actionList}`}>{actionItem.desc}</div>
                      </FlatCard>)
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
                        <Cell<srdItem>>{(item) => item.name}</Cell>
                      </Column>
                      <Column name="desc">
                        <Header>Tags</Header>
                        <Cell<srdItem>>{(item) => item.properties?.[0]}</Cell>
                      </Column>
                      <Column name="cost">
                        <Header>Cost</Header>
                        <Cell<srdItem>>{(item) => item.cost}</Cell>
                      </Column>
                    </Table>  
                  </div>
                </Show>
              </div>
            </div>
          </Show>

          <Show when={showFeatures()}>
            <div class={`${stylin().box} ${styles.featuresBox}`}>
              <div class={`${styles.featuresHeader}`}>
                <h2>Features</h2>
                <div class={`${styles.restButtons}`}>
                  <Button onClick={() => takeRest(SHORT_REST)}>Short Rest</Button>
                  <Button onClick={() => takeRest(LONG_REST)}>Long Rest</Button>
                </div>
              </div>
              <For each={allFeatures()}>
                {(feature) => {
                  const usage = featureUsage(feature);
                  return (
                    <div class={`${stylin().box} ${styles.featureItem}`}>
                      <div class={`${styles.featureTitle}`}>
                        <h3>{feature.name}</h3>
                        <Show when={feature.metadata?.category}>
                          <Chip value={feature.metadata?.category ?? ""} />
                        </Show>
                      </div>
                      <p>{feature.description}</p>
                      <Show when={usage}>
                        <UsesTracker
                          featureName={feature.name}
                          max={usage?.max ?? 0}
                          recharge={usage?.recharge ?? LONG_REST}
                          spent={currentCharacter()?.featureUses?.[feature.name] ?? 0}
                          onChange={(spent) => spendUses(feature.name, spent)}
                        />
                      </Show>
                    </div>
                  );
                }}
              </For>
            </div>
          </Show>
        </div>
      </div>
    </Body>
  )
};

export default CharacterView;