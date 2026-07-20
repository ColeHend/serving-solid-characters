import { Component, For, Index, Show, createEffect, createMemo, createSignal, onCleanup, onMount, runWithOwner } from "solid-js";
import styles from "./view.module.scss";
import StatBar from "./stat-bar/statBar";
import { useSearchParams } from "@solidjs/router";
import { effect } from "solid-js/web";
import useGetFullStats from "../../../shared/customHooks/dndInfo/useGetFullStats";
import useStyles from "../../../shared/customHooks/utility/style/styleHook";
import getUserSettings from "../../../shared/customHooks/userSettings";
import { Body, Select, Option, Input, TabBar, Button, Checkbox, Table, Column, Header, Cell, Row, Chip } from "coles-solid-library";
import {
  ActionType,
  AdvantageRollType,
  Character,
  CharacterGearEntry,
  GrantedAction,
  RollBonus,
  itemRefId,
  itemRefName,
} from "../../../models/character.model";
import { entitySelectorKey } from "../../../shared/customHooks/utility/tools/entityKey";
import { Spell } from "../../../models/generated";
import { srdItem } from "../../../models/data/generated";
import SpellModal from "../../../shared/components/modals/spellModal/spellModal.component";
import { useDnDSpells } from "../../../shared/customHooks/dndInfo/info/all/spells";
import { useDnDItems } from "../../../shared/customHooks/dndInfo/info/all/items";
import { characterManager, Clone } from "../../../shared";
import { characterMadFeatureSources, collectMadFeatures, collectMagicItemMads, useMadCharacters, choiceStatMads, statChoiceOptions, statChoiceKey, statChoiceCount, statChoicePicks, setStatPickAt, choiceProficiencyMads, proficiencyChoiceOptions, proficiencyChoiceCount, choiceExpertiseMads, expertiseChoiceCount, expertiseChoiceKey, expertiseChoiceOptions } from "../../../shared/customHooks/mads/useMadCharacters";
import useExportProficiencies from "../../../shared/customHooks/dndInfo/useExportProficiencies";
import { featureUsage, grantedActionUsage, actionUsesKey, resetFeatureUses, RechargeType, SHORT_REST, LONG_REST } from "../../../shared/customHooks/mads/commands/useUsesFeature";
import { advantageLabel, movementModeLabels, rollBonusLabel, senseLabels } from "../../../shared/customHooks/mads/rollFormat";
import { useDnDMagicItems } from "../../../shared/customHooks/dndInfo/info/all/magicItems";
import UsesTracker from "./usesTracker/usesTracker";
import { SpellTable } from "./SpellTable/SpellTable";
import { FlatCard } from "../../../shared/components/flatCard/flatCard";
import { CreateSheetButton } from "../createSheetButton";

const CharacterView: Component = () => {
  const [userSettings] = getUserSettings();
  const allSpells = useDnDSpells();
  const allItems = useDnDItems();
  const allMagicItems = useDnDMagicItems();
  const getKnownSpells = (character: Character) => {
    return allSpells().filter(spell => character?.spells.some(s => s.name === spell.name));
  }
  const getCurrentItems = (items: CharacterGearEntry[]) => {
    // Gear entries: selector keys pin exact catalog rows; names cover free-text/older saves.
    const names = new Set((items ?? []).map((entry) => itemRefName(entry).toLowerCase()));
    const ids = new Set((items ?? []).map(itemRefId).filter((id): id is string => !!id));
    return allItems().filter(
      (item) => ids.has(entitySelectorKey(item)) || names.has((item.name ?? "").toLowerCase()),
    );
  }
  const stylin = createMemo(() => useStyles(userSettings().theme));


  const [searchParam, setSearchParam] = useSearchParams();

  // Track the manager's signal directly — Dexie fills it AFTER mount on a hard load.
  const characters = createMemo(() => characterManager.characters());
  const paramId = () => (typeof searchParam.id === "string" ? searchParam.id : searchParam.id?.[0] ?? "");

  const [currentCharacter, setCurrentCharacter] = createSignal<Character>(
    characters().find((x) => x.id === paramId()) ?? characters()?.[0],
  );
  // Resolve the ?id= selection (or default to the first character) once the async load lands.
  createEffect(() => {
    if (currentCharacter()) return;
    const found = characters().find((x) => x.id === paramId()) ?? characters()[0];
    if (found) setCurrentCharacter(found);
  });

  // The character with its mad commands applied, for display only. Handlers mutate in
  // place, so they always run against a fresh Clone of the persisted character — never
  // the signal's own object (a memo re-run would double-apply) — and the result is
  // never written back to the DB.
  const displayCharacter = createMemo<Character>(() => {
    const base = currentCharacter();
    if (!base) return base;
    const clone = Clone(base);
    // Equipped/attuned magic-item mads apply AFTER feature mads so `mode:set` items win.
    return useMadCharacters(clone, [
      ...collectMadFeatures(clone),
      ...collectMagicItemMads(clone, allMagicItems()),
    ]);
  });

  const [activeMobileTab, setActiveMobileTab] = createSignal(0);
  const [activeActionTab, setActiveActionTab] = createSignal(0);
  const [currentSelectedSpell, setCurrentSelectedSpell] = createSignal<Spell>({} as Spell);
  const [showSpellModal, setShowSpellModal] = createSignal(false);
  const showSpellModalHandler = (spell: Spell) => {
    setCurrentSelectedSpell(spell);
    setShowSpellModal(true);
  }

  // Universal action-economy entries every character has; class/feature-specific
  // entries come from the character's grantedActions.
  const GENERIC_ACTIONS: Record<ActionType, { name: string; desc: string }[]> = {
    action: [
      { name: "Attack", desc: "Make a melee or ranged attack." },
      { name: "Magic", desc: "Cast a spell." },
      { name: "Dash", desc: "Double your movement speed for the turn." },
      { name: "Disengage", desc: "Move without provoking opportunity attacks." },
      { name: "Dodge", desc: "Focus on avoiding attacks, giving attackers disadvantage." },
      { name: "Help", desc: "Assist an ally, giving them advantage on their next attack." },
      { name: "Hide", desc: "Attempt to hide from enemies." },
      { name: "Ready", desc: "Prepare an action to trigger later." },
      { name: "Search", desc: "Look for hidden objects or creatures." },
      { name: "Use an Object", desc: "Interact with an object." },
    ],
    bonusAction: [],
    reaction: [
      { name: "Opportunity Attack", desc: "Make a melee attack against a creature that leaves your reach." },
    ],
  };
  const [activeEconomy, setActiveEconomy] = createSignal<ActionType>("action");
  type ActionEconomyRow = { name: string; desc: string; granted?: GrantedAction };
  const displayedActions = createMemo<ActionEconomyRow[]>(() => {
    const granted = (displayCharacter()?.grantedActions ?? [])
      .filter((a) => a.actionType === activeEconomy())
      .map((a) => ({ name: a.name, desc: a.description ?? "", granted: a }));
    return [...GENERIC_ACTIONS[activeEconomy()], ...granted];
  });
  const [currentViewedItems, setCurrentViewedItems] = createSignal<CharacterGearEntry[]>(currentCharacter()?.items.inventory);

  const fullStats = useGetFullStats(displayCharacter);

  const rollAdvantages = createMemo(() => displayCharacter()?.rollAdvantages ?? []);
  const advantagesFor = (rollType: AdvantageRollType) => rollAdvantages().filter(a => a.rollType === rollType);
  const advLabel = advantageLabel;

  const rollBonuses = createMemo(() => displayCharacter()?.rollBonuses ?? []);
  const bonusesFor = (rollType: AdvantageRollType) => rollBonuses().filter(b => b.rollType === rollType);
  const profBonus = () => Math.ceil((displayCharacter()?.level ?? 1) / 4) + 1;
  const bonusLabel = (rb: RollBonus) => rollBonusLabel(rb, profBonus(), fullStats());

  // Non-walking movement modes as "Fly 60 ft" chips; a mode without its own speed moves at the walking Speed.
  const movementChips = createMemo(() => {
    const c = displayCharacter();
    return c ? movementModeLabels(c) : [];
  });

  // Special senses as "Darkvision 60 ft" chips.
  const senseChips = createMemo(() => senseLabels(displayCharacter()?.senses ?? {}));

  // Resistances / immunities / vulnerabilities (mads applied) as chips.
  const defenseChips = createMemo(() => {
    const c = displayCharacter();
    if (!c) return [];
    return [
      ...(c.resistances ?? []).map((r) => `Resists ${r.type}`),
      ...(c.immunities ?? []).map((r) => `Immune to ${r.type}`),
      ...(c.vulnerabilities ?? []).map((r) => `Vulnerable to ${r.type}`),
    ];
  });

  // Class/background armor/weapon/tool lists with equipment-proficiency mads applied —
  // the same resolution the PDF export and creator living sheet use.
  const equipProfs = useExportProficiencies(displayCharacter);
  const equipLines = createMemo(() => {
    const profs = equipProfs();
    return [
      profs.armor.length ? `Armor: ${profs.armor.join(", ")}` : "",
      profs.weapons.length ? `Weapons: ${profs.weapons.join(", ")}` : "",
      profs.tools.length ? `Tools: ${profs.tools.join(", ")}` : "",
    ].filter(Boolean);
  });

  // Every feature source, mads applied (mads-granted picks like invocations land on the
  // top-level array; the source list itself lives in characterMadFeatureSources).
  const allFeatures = createMemo(() => {
    const c = displayCharacter();
    return c ? characterMadFeatureSources(c) : [];
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

  /** Write the ability picked in dropdown slot `index` into the feature's statChoices CSV. */
  const chooseStatAt = (featureKey: string, index: number, statKey: string, count: number) => {
    const base = currentCharacter();
    if (!base) return;
    const updated = Clone(base);
    updated.statChoices = {
      ...(updated.statChoices ?? {}),
      [featureKey]: setStatPickAt(updated.statChoices?.[featureKey], index, statKey, count),
    };
    persistCharacter(updated);
  };

  const proficiencyPicks = (featureKey: string): string[] =>
    (currentCharacter()?.proficiencyChoices?.[featureKey] ?? "").split(",").map(s => s.trim()).filter(Boolean);

  const toggleProficiencyPick = (featureKey: string, skill: string, count: number) => {
    const picks = proficiencyPicks(featureKey);
    const next = picks.includes(skill)
      ? picks.filter(p => p !== skill)
      : picks.length < count ? [...picks, skill] : picks;
    if (next.join(",") === picks.join(",")) return;
    const base = currentCharacter();
    if (!base) return;
    const updated = Clone(base);
    updated.proficiencyChoices = { ...(updated.proficiencyChoices ?? {}), [featureKey]: next.join(",") };
    persistCharacter(updated);
  };

  const STAT_LABELS: Record<string, string> = {
    str: "Strength", dex: "Dexterity", con: "Constitution",
    int: "Intelligence", wis: "Wisdom", cha: "Charisma",
  };

  const takeRest = (rest: RechargeType) => {
    const base = currentCharacter();
    if (!base) return;
    const level = displayCharacter()?.level;
    const limited = allFeatures().flatMap(f => {
      const usage = featureUsage(f, level);
      return usage ? [{ name: f.name, recharge: usage.recharge }] : [];
    });
    // Granted-action pools too — inline-uses actions have no backing feature to list.
    const actionLimited = (displayCharacter()?.grantedActions ?? []).flatMap(a => {
      const usage = grantedActionUsage(a, allFeatures(), level);
      return usage ? [{ name: actionUsesKey(a), recharge: usage.recharge }] : [];
    });
    persistCharacter(resetFeatureUses(Clone(base), rest, [...limited, ...actionLimited]));
  };

  const [isMobile, setIsMobile] = createSignal(false);
  onMount(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const apply = (e: MediaQueryList | MediaQueryListEvent) => setIsMobile(e.matches);
    apply(mq);
    const listener = (e: MediaQueryListEvent) => apply(e);
    mq.addEventListener("change", listener);
    onCleanup(() => mq.removeEventListener("change", listener));
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
    const id = currentCharacter()?.id;
    // Keep the URL on the shown character's id (and clear any legacy ?name= leftover).
    if (id) setSearchParam({ id, name: undefined });
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
                  <Show when={advantagesFor("Initiative").length || bonusesFor("Initiative").length}>
                    <div class={`${styles.advChips}`}>
                      <For each={advantagesFor("Initiative")}>{(adv) => <Chip value={advLabel(adv)} />}</For>
                      <For each={bonusesFor("Initiative")}>{(rb) => <Chip value={bonusLabel(rb)} />}</For>
                    </div>
                  </Show>
                </div>
                <div class={`${styles.infoBoxMini}`}>
                  <Input transparent value={displayCharacter()?.Speed ? `${displayCharacter()?.Speed}` : ""} />
                  <hr />
                  <span>Speed</span>
                  <Show when={movementChips().length}>
                    <div class={`${styles.advChips}`}>
                      <For each={movementChips()}>{(label) => <Chip value={label} />}</For>
                    </div>
                  </Show>
                </div>
              </div>
              <Show when={senseChips().length}>
                <div class={`${styles.advChips}`}>
                  <For each={senseChips()}>{(label) => <Chip value={label} />}</For>
                </div>
              </Show>
              <Show when={defenseChips().length}>
                <div class={`${styles.advChips}`}>
                  <For each={defenseChips()}>{(label) => <Chip value={label} />}</For>
                </div>
              </Show>
              <div class={`${styles.baseCharInfoBox}  ${styles.infoBoxRow}`}>
                <div class={`${styles.hpMaxTemp}`}>
                  <div>
                    {/* current HP is the stored value; the max shows HitPoints commands applied */}
                    <span>{currentCharacter()?.health?.current} / {displayCharacter()?.health?.max}</span>
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
              <StatBar fullStats={fullStats} currentCharacter={displayCharacter} rollAdvantages={rollAdvantages} rollBonuses={rollBonuses} />
              <Show when={equipLines().length}>
                <div class={`${styles.equipProfLines}`}>
                  <span class={`${styles.equipProfTitle}`}>Trained Equipment</span>
                  <For each={equipLines()}>{(line) => <div>{line}</div>}</For>
                </div>
              </Show>
            </span>
          </Show>

          <Show when={showActions()}>
            <div class={`${styles.actionsBox}`}>
              <h2>Main</h2>
              <div class={`${styles.attackMeta}`}>
                <span>Attacks per Action: {displayCharacter()?.attacksPerAction ?? 1}</span>
                <For each={advantagesFor("WeaponAttack")}>{(adv) => <Chip value={`${advLabel(adv)} · weapon attacks`} />}</For>
                <For each={advantagesFor("SpellAttack")}>{(adv) => <Chip value={`${advLabel(adv)} · spell attacks`} />}</For>
                <For each={bonusesFor("WeaponAttack")}>{(rb) => <Chip value={`${bonusLabel(rb)} · weapon attacks`} />}</For>
                <For each={bonusesFor("SpellAttack")}>{(rb) => <Chip value={`${bonusLabel(rb)} · spell attacks`} />}</For>
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
                <Show when={activeActionTab() === 2}>
                  <div>
                    <div class={`${styles.actionButtonList}`}>
                      <Button onClick={()=>{setActiveEconomy("action")}}>Actions</Button>
                      <Button onClick={()=>{setActiveEconomy("bonusAction")}}>Bonus Actions</Button>
                      <Button onClick={()=>{setActiveEconomy("reaction")}}>Reactions</Button>
                    </div>
                    {/* Index, not For: a pip click clones the character, so row objects are rebuilt
                        every persist — For would remount (and collapse) the FlatCard mid-interaction. */}
                    <Index each={displayedActions()}>{(actionItem)=>{
                      const usage = createMemo(() => {
                        const granted = actionItem().granted;
                        return granted ? grantedActionUsage(granted, allFeatures(), displayCharacter()?.level) : null;
                      });
                      const poolKey = () => {
                        const granted = actionItem().granted;
                        return granted ? actionUsesKey(granted) : "";
                      };
                      return (<FlatCard headerName={<span>{actionItem().name}</span>}  class={`${styles.actionList}`} transparent>
                        <div class={`${styles.actionList}`}>{actionItem().desc}</div>
                        <Show when={usage()}>
                          <UsesTracker
                            featureName={actionItem().name}
                            max={usage()?.max ?? 0}
                            recharge={usage()?.recharge ?? LONG_REST}
                            spent={currentCharacter()?.featureUses?.[poolKey()] ?? 0}
                            onChange={(spent) => spendUses(poolKey(), spent)}
                          />
                        </Show>
                      </FlatCard>)
                    }}</Index>
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
                        spells={fifthLevelSpells}
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
                <Show when={activeActionTab() === 1}>
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
                  const usage = featureUsage(feature, displayCharacter()?.level);
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
                      <For each={choiceStatMads(feature)}>
                        {(mad) => {
                          const count = statChoiceCount(mad);
                          const picks = () => statChoicePicks(currentCharacter()?.statChoices?.[statChoiceKey(feature)], count);
                          const label = count > 1
                            ? `+${mad.value?.["statValue"] ?? ""} to ${count} different abilities of your choice:`
                            : `${mad.value?.["mode"] === "set" ? "Set" : "+"}${mad.value?.["statValue"] ?? ""} to an ability of your choice:`;
                          return (
                            <div class={`${styles.featureTitle}`}>
                              <span>{label}</span>
                              {/* One dropdown per pick slot; a slot's options hide the OTHER slots' picks. */}
                              <Index each={picks()}>
                                {(pick, i) => (
                                  <Select
                                    value={pick()}
                                    onChange={(val: string) => runWithOwner(null, () => {
                                      if (val && val !== pick()) chooseStatAt(statChoiceKey(feature), i, val, count);
                                    })}
                                  >
                                    <For each={statChoiceOptions(mad).filter((key) => key === pick() || !picks().includes(key))}>
                                      {(key) => <Option value={key}>{STAT_LABELS[key] ?? key}</Option>}
                                    </For>
                                  </Select>
                                )}
                              </Index>
                            </div>
                          );
                        }}
                      </For>
                      <For each={choiceProficiencyMads(feature)}>
                        {(mad) => {
                          const count = proficiencyChoiceCount(mad);
                          return (
                            <div>
                              <span>{`Skill proficiency — choose ${count} (${proficiencyPicks(statChoiceKey(feature)).length}/${count} picked):`}</span>
                              <div class={`${styles.advChips}`}>
                                <For each={proficiencyChoiceOptions(mad)}>
                                  {(skill) => (
                                    <Checkbox
                                      label={skill}
                                      checked={proficiencyPicks(statChoiceKey(feature)).includes(skill)}
                                      onChange={() => runWithOwner(null, () => toggleProficiencyPick(statChoiceKey(feature), skill, count))}
                                    />
                                  )}
                                </For>
                              </div>
                            </div>
                          );
                        }}
                      </For>
                      <For each={choiceExpertiseMads(feature)}>
                        {(mad) => {
                          const count = expertiseChoiceCount(mad);
                          const key = () => expertiseChoiceKey(feature);
                          // Expertise requires proficiency — offer only the allowed skills the
                          // character is trained in (an already-made pick stays visible).
                          const options = () => {
                            const skills = displayCharacter()?.proficiencies?.skills ?? {};
                            const allowed = expertiseChoiceOptions(mad).filter((skill) => skills[skill]?.proficient);
                            return [...new Set([...allowed, ...proficiencyPicks(key())])];
                          };
                          return (
                            <div>
                              <span>{`Expertise — choose ${count} skill${count > 1 ? "s" : ""} you're proficient in (${proficiencyPicks(key()).length}/${count} picked):`}</span>
                              <div class={`${styles.advChips}`}>
                                <For each={options()}>
                                  {(skill) => (
                                    <Checkbox
                                      label={skill}
                                      checked={proficiencyPicks(key()).includes(skill)}
                                      onChange={() => runWithOwner(null, () => toggleProficiencyPick(key(), skill, count))}
                                    />
                                  )}
                                </For>
                                <Show when={options().length === 0}>
                                  <span>No eligible proficient skills yet</span>
                                </Show>
                              </div>
                            </div>
                          );
                        }}
                      </For>
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