import { Accessor, Component, For, Index, Show, createMemo, createSignal, runWithOwner } from "solid-js";
import { Button, Chip, Icon, Option, Select, Checkbox, NumberInput } from "coles-solid-library";
import { FitnessCenter, Shield, Psychology, Favorite, Casino, Swords, Backpack, Paid, Bolt, DirectionsRun, Badge } from "coles-solid-library/icons";
import { Character, ActionType, itemRefName } from "../../../../models/character.model";
import { FeatureDetail, ItemType, Spell } from "../../../../models/generated";
import { srdItem } from "../../../../models/data/generated";
import { signed } from "../../../../shared/customHooks/utility/tools/dndMath";
import { SheetDerived } from "./useSheetDerived";
import { SectionCard, StatPill, PipRow, MiniStat } from "./SheetCard";
import { FlatCard } from "../../../../shared/components/flatCard/flatCard";
import UsesTracker from "../usesTracker/usesTracker";
import { featureUsage, grantedActionUsage, actionUsesKey, LONG_REST } from "../../../../shared/customHooks/mads/commands/useUsesFeature";
import { choiceStatMads, statChoiceCount, statChoiceKey, statChoiceOptions, statChoicePicks, choiceProficiencyMads, proficiencyChoiceCount, proficiencyChoiceOptions, choiceExpertiseMads, expertiseChoiceCount, expertiseChoiceKey, expertiseChoiceOptions } from "../../../../shared/customHooks/mads/useMadCharacters";
import styles from "./sheet.module.scss";

const STAT_LABELS: Record<string, string> = {
  str: "Strength", dex: "Dexterity", con: "Constitution",
  int: "Intelligence", wis: "Wisdom", cha: "Charisma",
};

const GENERIC_ACTIONS: Record<ActionType, { name: string; desc: string }[]> = {
  action: [
    { name: "Attack", desc: "Make a melee or ranged attack." },
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
  reaction: [{ name: "Opportunity Attack", desc: "Attack a creature that leaves your reach." }],
};

export type CoreTabProps = {
  currentCharacter: Accessor<Character | undefined>;
  displayCharacter: Accessor<Character | undefined>;
  derived: Accessor<SheetDerived>;
  allFeatures: Accessor<FeatureDetail[]>;
  allItems: Accessor<srdItem[]>;
  cantrips: Accessor<Spell[]>;
  senseChips: Accessor<string[]>;
  defenseChips: Accessor<string[]>;
  movementChips: Accessor<string[]>;
  onDamage: (n: number) => void;
  onHeal: (n: number) => void;
  onSetTempHp: (n: number) => void;
  onSetDeathSaves: (kind: "successes" | "failures", value: number) => void;
  onSpendHitDie: (sides: number, used: number) => void;
  spendUses: (name: string, spent: number) => void;
  chooseStatAt: (featureKey: string, index: number, statKey: string, count: number) => void;
  toggleProficiencyPick: (featureKey: string, skill: string, count: number) => void;
  proficiencyPicks: (featureKey: string) => string[];
};

const propsText = (p: Record<string, unknown> | undefined): string =>
  p ? Object.entries(p).map(([k, v]) => `${k} ${Array.isArray(v) ? v.join(" ") : v}`).join(" ") : "";

const CoreTab: Component<CoreTabProps> = (props) => {
  const d = () => props.derived();

  // ── Ability column ──────────────────────────────────────────────
  const AbilityColumn = () => (
    <>
      <div class={styles.abilityGrid}>
        <For each={["str", "dex", "con", "int", "wis", "cha"] as const}>
          {(key) => (
            <div class={styles.abilityCard}>
              <span class={styles.abilityName}>{STAT_LABELS[key]}</span>
              <span class={styles.abilityMod}>{signed(d().abilityMods[key])}</span>
              <span class={styles.abilityScore}>{props.displayCharacter()?.stats?.[key] ?? 0}</span>
            </div>
          )}
        </For>
      </div>
      <div class={styles.abilityMetaRow}>
        <div class={styles.abilityMetaTile}>
          <span class={styles.metaBadge}>{signed(d().profBonus)}</span>
          <span class={styles.metaLabel}>Proficiency</span>
        </div>
        <div class={styles.abilityMetaTile}>
          <span class={styles.metaBadge}>{d().passivePerception}</span>
          <span class={styles.metaLabel}>Passive Perception</span>
        </div>
      </div>
    </>
  );

  // ── Combat mini-stats row ───────────────────────────────────────
  const CombatRow = () => (
    <div class={styles.miniRow}>
      <MiniStat value={d().ac} label="Armor Class" sub={d().armorLabel || undefined} icon={Shield} />
      <MiniStat value={signed(d().initiative)} label="Initiative" icon={Bolt} />
      <MiniStat value={`${d().speed} ft.`} label="Speed" icon={DirectionsRun} />
      <MiniStat value={signed(d().profBonus)} label="Proficiency" icon={Badge} />
    </div>
  );

  // ── Hit points ──────────────────────────────────────────────────
  const [dmgAmount, setDmgAmount] = createSignal(1);
  const [editingTemp, setEditingTemp] = createSignal(false);
  const HitPointsCard = () => {
    const cur = () => props.currentCharacter()?.health?.current ?? 0;
    const max = () => props.displayCharacter()?.health?.max ?? 0;
    const temp = () => props.currentCharacter()?.health?.temp ?? 0;
    const pct = () => (max() > 0 ? Math.max(0, Math.min(100, (cur() / max()) * 100)) : 0);
    const commitTemp = (n: number) => {
      props.onSetTempHp(Math.max(0, Number.isFinite(n) ? n : 0));
      setEditingTemp(false);
    };
    return (
      <SectionCard icon={Favorite} title="Hit Points">
        <div class={styles.hpTop}>
          <span class={styles.hpNumbers}>
            {cur()} <span class={styles.hpMax}>/ {max()}</span>
          </span>
          <Show
            when={editingTemp()}
            fallback={
              <div
                class={styles.tempBox}
                title="Click: set value · +: add 1 · Right-click: reset"
                onClick={() => setEditingTemp(true)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  props.onSetTempHp(0);
                }}
              >
                <Button
                  class={styles.tempAdd}
                  title="Add 1"
                  onClick={(e) => {
                    e.stopPropagation();
                    props.onSetTempHp(temp() + 1);
                  }}
                  transparent
                >
                  +
                </Button>
                <span class={styles.tempValue}>{temp()}</span>
                <span class={styles.tempLabel}>Temp</span>
              </div>
            }
          >
            <div class={styles.tempBox}>
              <NumberInput
                hideSteppers
                min={0}
                class={styles.tempInput}
                value={temp()}
                ref={(el) => queueMicrotask(() => { el.focus(); el.select(); })}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitTemp(+e.currentTarget.value);
                  if (e.key === "Escape") setEditingTemp(false);
                }}
                onBlur={(e) => commitTemp(+e.currentTarget.value)}
              />
              <span class={styles.tempLabel}>Temp</span>
            </div>
          </Show>
        </div>
        <div class={styles.hpBar}>
          <div class={styles.hpBarFill} style={{ width: `${pct()}%` }} />
        </div>
        <div class={styles.hpControls}>
          <Button theme="error" onClick={() => props.onDamage(dmgAmount())}>Damage</Button>
          <div class={styles.stepper}>
            <button class={styles.stepBtn} onClick={() => setDmgAmount((n) => Math.max(1, n - 1))}>−</button>
            <input
              class={styles.stepperInput}
              type="number"
              value={dmgAmount()}
              onInput={(e) => setDmgAmount(Math.max(1, +e.currentTarget.value || 1))}
            />
            <button class={styles.stepBtn} onClick={() => setDmgAmount((n) => n + 1)}>+</button>
          </div>
          <Button theme="primary" onClick={() => props.onHeal(dmgAmount())}>Heal</Button>
        </div>
      </SectionCard>
    );
  };

  // ── Hit dice ────────────────────────────────────────────────────
  const HitDiceCard = () => {
    const label = () => d().hitDicePools.map((p) => `${p.total}d${p.sides}`).join(", ");
    return (
      <SectionCard icon={Casino} title={`Hit Dice${label() ? ` — ${label()}` : ""}`}>
        <For each={d().hitDicePools}>
          {(pool) => {
            const used = () => props.currentCharacter()?.hitDiceUsed?.[pool.sides] ?? 0;
            const remaining = () => pool.total - used();
            return (
              <div class={styles.diceRow}>
                <For each={Array.from({ length: pool.total }, (_, i) => i)}>
                  {(i) => (
                    <button
                      class={styles.die}
                      classList={{ [styles.dieSpent]: i >= remaining() }}
                      onClick={() =>
                        props.onSpendHitDie(pool.sides, i >= remaining() ? i : i + 1)
                      }
                    >
                      d{pool.sides}
                    </button>
                  )}
                </For>
              </div>
            );
          }}
        </For>
        <div class={styles.hint}>Click a die to spend or restore it.</div>
      </SectionCard>
    );
  };

  // ── Death saves ─────────────────────────────────────────────────
  const DeathSavesCard = () => {
    const ds = () => props.currentCharacter()?.deathSaves ?? { successes: 0, failures: 0 };
    return (
      <SectionCard icon={Favorite} title="Death Saves">
        <div class={styles.deathRow}>
          <span class={styles.deathRowLabel}>Successes</span>
          <PipRow total={3} filled={ds().successes} shape="circle" tone="success" onToggle={(v) => props.onSetDeathSaves("successes", v)} />
        </div>
        <div class={styles.deathRow}>
          <span class={styles.deathRowLabel}>Failures</span>
          <PipRow total={3} filled={ds().failures} shape="circle" tone="fail" onToggle={(v) => props.onSetDeathSaves("failures", v)} />
        </div>
      </SectionCard>
    );
  };

  // ── Resources (limited-use class features) ──────────────────────
  const limitedFeatures = createMemo(() =>
    props.allFeatures().flatMap((f) => {
      const usage = featureUsage(f, d().level);
      return usage ? [{ feature: f, usage }] : [];
    }),
  );
  const ResourcesCard = () => (
    <Show when={limitedFeatures().length}>
      <SectionCard icon={Bolt} title="Resources">
        <For each={limitedFeatures()}>
          {({ feature, usage }) => (
            <div class={styles.deathRow}>
              <span class={styles.featureName}>{feature.name}</span>
              <UsesTracker
                featureName={feature.name}
                max={usage.max}
                recharge={usage.recharge}
                spent={props.currentCharacter()?.featureUses?.[feature.name] ?? 0}
                onChange={(spent) => props.spendUses(feature.name, spent)}
              />
            </div>
          )}
        </For>
      </SectionCard>
    </Show>
  );

  // ── Attacks & cantrips ──────────────────────────────────────────
  const attackRows = createMemo(() => {
    const itemsByName = new Map(props.allItems().map((it) => [(it.name ?? "").toLowerCase(), it]));
    const mods = d().abilityMods;
    const pb = d().profBonus;
    const rows: { name: string; hit: string; damage: string; notes: string }[] = [];
    for (const entry of props.displayCharacter()?.items?.equipped ?? []) {
      const it = itemsByName.get(itemRefName(entry).toLowerCase());
      if (!it || it.type !== ItemType.Weapon) continue;
      const text = propsText(it.properties);
      const finesse = /finesse/i.test(text);
      const ranged = /ammunition/i.test(text) || /bow|crossbow|sling|dart|javelin/i.test(it.name);
      const abilityMod = finesse ? Math.max(mods.str, mods.dex) : ranged ? mods.dex : mods.str;
      const dmgRaw = String((it.properties as Record<string, unknown>)?.["Damage"] ?? "");
      const dice = dmgRaw.match(/(\d+d\d+)/i)?.[1] ?? "";
      const damage = dice ? `${dice}${abilityMod ? signed(abilityMod) : ""}` : abilityMod ? signed(abilityMod) : "—";
      const notes = String((it.properties as Record<string, unknown>)?.["Properties"] ?? "").replace(/[[\]"]/g, "");
      rows.push({ name: it.name, hit: signed(abilityMod + pb), damage, notes });
    }
    const sc = d().spellcasting;
    for (const spell of props.cantrips()) {
      if (!spell.damageType) continue;
      const save = spell.description?.match(/(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma) saving throw/i);
      const hit = save ? `${save[1].slice(0, 3).toUpperCase()} ${sc?.saveDc ?? ""}` : sc ? signed(sc.attack) : "—";
      rows.push({ name: spell.name, hit, damage: spell.damageType, notes: "Cantrip" });
    }
    return rows;
  });
  const AttacksCard = () => (
    <Show when={attackRows().length}>
      <SectionCard icon={Swords} title="Attacks & Cantrips">
        <table class={styles.dataTable}>
          <thead>
            <tr><th>Name</th><th>Hit / DC</th><th>Damage</th><th>Notes</th></tr>
          </thead>
          <tbody>
            <For each={attackRows()}>
              {(row) => (
                <tr>
                  <td>{row.name}</td>
                  <td><span class={styles.tag}>{row.hit}</span></td>
                  <td><span class={styles.tag}>{row.damage}</span></td>
                  <td class={styles.notesCell}>{row.notes}</td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </SectionCard>
    </Show>
  );

  // ── Action economy (folded-in existing functionality) ───────────
  const [activeEconomy, setActiveEconomy] = createSignal<ActionType>("action");
  const economyRows = createMemo(() => {
    const granted = (props.displayCharacter()?.grantedActions ?? [])
      .filter((a) => a.actionType === activeEconomy())
      .map((a) => ({ name: a.name, desc: a.description ?? "", granted: a }));
    return [...GENERIC_ACTIONS[activeEconomy()].map((a) => ({ ...a, granted: undefined })), ...granted];
  });
  const ActionsCard = () => (
    <FlatCard icon={DirectionsRun} headerName={<span class={styles.cardTitle}>Actions</span>}>
      <div class={styles.segmented}>
        <Button transparent borderTheme={activeEconomy() === "action" ? "primary" : "none"} onClick={() => setActiveEconomy("action")}>Actions</Button>
        <Button transparent borderTheme={activeEconomy() === "bonusAction" ? "primary" : "none"} onClick={() => setActiveEconomy("bonusAction")}>Bonus</Button>
        <Button transparent borderTheme={activeEconomy() === "reaction" ? "primary" : "none"} onClick={() => setActiveEconomy("reaction")}>Reactions</Button>
      </div>
      <Index each={economyRows()}>
        {(row) => {
          const usage = createMemo(() => {
            const g = row().granted;
            return g ? grantedActionUsage(g, props.allFeatures(), d().level) : null;
          });
          const poolKey = () => (row().granted ? actionUsesKey(row().granted!) : "");
          return (
            <div class={styles.featureBody}>
              <div class={styles.featureHeaderRow}><span class={styles.featureName}>{row().name}</span></div>
              <p>{row().desc}</p>
              <Show when={usage()}>
                <UsesTracker
                  featureName={row().name}
                  max={usage()?.max ?? 0}
                  recharge={usage()?.recharge ?? LONG_REST}
                  spent={props.currentCharacter()?.featureUses?.[poolKey()] ?? 0}
                  onChange={(spent) => props.spendUses(poolKey(), spent)}
                />
              </Show>
            </div>
          );
        }}
      </Index>
    </FlatCard>
  );

  // ── Features & traits (with folded-in choice editors) ───────────
  const FeatureChoices = (featureProps: { feature: FeatureDetail }) => (
    <>
      <For each={choiceStatMads(featureProps.feature)}>
        {(mad) => {
          const count = statChoiceCount(mad);
          const picks = () => statChoicePicks(props.currentCharacter()?.statChoices?.[statChoiceKey(featureProps.feature)], count);
          const label = count > 1
            ? `+${mad.value?.["statValue"] ?? ""} to ${count} abilities of your choice:`
            : `${mad.value?.["mode"] === "set" ? "Set" : "+"}${mad.value?.["statValue"] ?? ""} to an ability of your choice:`;
          return (
            <div class={styles.choiceBlock}>
              <span>{label}</span>
              <Index each={picks()}>
                {(pick, i) => (
                  <Select
                    value={pick()}
                    onChange={(val: string) => runWithOwner(null, () => {
                      if (val && val !== pick()) props.chooseStatAt(statChoiceKey(featureProps.feature), i, val, count);
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
      <For each={choiceProficiencyMads(featureProps.feature)}>
        {(mad) => {
          const count = proficiencyChoiceCount(mad);
          const key = () => statChoiceKey(featureProps.feature);
          return (
            <div class={styles.choiceBlock}>
              <span>{`Skill proficiency — choose ${count} (${props.proficiencyPicks(key()).length}/${count}):`}</span>
              <div class={styles.choiceChips}>
                <For each={proficiencyChoiceOptions(mad)}>
                  {(skill) => (
                    <Checkbox
                      label={skill}
                      checked={props.proficiencyPicks(key()).includes(skill)}
                      onChange={() => runWithOwner(null, () => props.toggleProficiencyPick(key(), skill, count))}
                    />
                  )}
                </For>
              </div>
            </div>
          );
        }}
      </For>
      <For each={choiceExpertiseMads(featureProps.feature)}>
        {(mad) => {
          const count = expertiseChoiceCount(mad);
          const key = () => expertiseChoiceKey(featureProps.feature);
          const options = () => {
            const skills = props.displayCharacter()?.proficiencies?.skills ?? {};
            const allowed = expertiseChoiceOptions(mad).filter((skill) => skills[skill]?.proficient);
            return [...new Set([...allowed, ...props.proficiencyPicks(key())])];
          };
          return (
            <div class={styles.choiceBlock}>
              <span>{`Expertise — choose ${count} (${props.proficiencyPicks(key()).length}/${count}):`}</span>
              <div class={styles.choiceChips}>
                <For each={options()}>
                  {(skill) => (
                    <Checkbox
                      label={skill}
                      checked={props.proficiencyPicks(key()).includes(skill)}
                      onChange={() => runWithOwner(null, () => props.toggleProficiencyPick(key(), skill, count))}
                    />
                  )}
                </For>
                <Show when={options().length === 0}><span>No eligible proficient skills yet</span></Show>
              </div>
            </div>
          );
        }}
      </For>
    </>
  );

  const FeaturesCard = () => (
    <SectionCard icon={Badge} title="Features & Traits">
      <div class={styles.featureList}>
        <For each={props.allFeatures()}>
          {(feature) => {
            const usage = featureUsage(feature, d().level);
            return (
              <FlatCard
                transparent
                headerName={
                  <div class={styles.featureHeaderRow}>
                    <span class={styles.featureName}>{feature.name}</span>
                    <Show when={feature.metadata?.category || usage}>
                      <span class={styles.featureCat}>
                        {feature.metadata?.category ?? ""}
                        {usage ? `${feature.metadata?.category ? " · " : ""}${usage.max} / ${usage.recharge}` : ""}
                      </span>
                    </Show>
                  </div>
                }
              >
                <div class={styles.featureBody}>
                  <p>{feature.description}</p>
                  <FeatureChoices feature={feature} />
                </div>
              </FlatCard>
            );
          }}
        </For>
      </div>
    </SectionCard>
  );

  // ── Equipment (with inventory/equipped/attuned toggle) ──────────
  const [itemView, setItemView] = createSignal<"inventory" | "equipped" | "attuned">("inventory");
  const equipmentEntries = createMemo(() => {
    const gear = props.currentCharacter()?.items;
    if (!gear) return [];
    return (itemView() === "equipped" ? gear.equipped : itemView() === "attuned" ? gear.attuned : gear.inventory) ?? [];
  });
  const currency = () => props.currentCharacter()?.items?.currency;
  const currencyLine = () => {
    const c = currency();
    if (!c) return "";
    return [
      c.platinumPieces ? `${c.platinumPieces} pp` : "",
      c.goldPieces ? `${c.goldPieces} gp` : "",
      c.electrumPieces ? `${c.electrumPieces} ep` : "",
      c.sliverPieces ? `${c.sliverPieces} sp` : "",
      c.copperPieces ? `${c.copperPieces} cp` : "",
    ].filter(Boolean).join(" · ");
  };
  const EquipmentCard = () => (
    <SectionCard icon={Backpack} title="Equipment">
      <div class={styles.segmented}>
        <Button transparent borderTheme={itemView() === "inventory" ? "primary" : "none"} onClick={() => setItemView("inventory")}>Inventory</Button>
        <Button transparent borderTheme={itemView() === "equipped" ? "primary" : "none"} onClick={() => setItemView("equipped")}>Equipped</Button>
        <Button transparent borderTheme={itemView() === "attuned" ? "primary" : "none"} onClick={() => setItemView("attuned")}>Attuned</Button>
      </div>
      <div class={styles.equipList}>
        <For each={equipmentEntries()} fallback={<div class={styles.hint}>Nothing here.</div>}>
          {(entry) => (
            <div class={styles.equipRow}><span>{itemRefName(entry)}</span></div>
          )}
        </For>
      </div>
      <Show when={currencyLine()}>
        <div class={styles.currencyLine}>
          <Icon icon={Paid} size="small" color="var(--primary-color)" />
          {currencyLine()}
        </div>
      </Show>
    </SectionCard>
  );

  return (
    <div class={styles.coreGrid}>
      <div class={styles.coreLeft}>
        <SectionCard icon={FitnessCenter} title="Ability Scores"><AbilityColumn /></SectionCard>
        <SectionCard icon={Shield} title="Saving Throws">
          <div class={styles.pillList}>
            <For each={d().saves}>
              {(save) => <StatPill state={save.proficient ? "proficient" : "none"} label={save.label} value={signed(save.mod)} />}
            </For>
          </div>
        </SectionCard>
        <SectionCard icon={Psychology} title="Skills">
          <div class={styles.pillList}>
            <For each={d().skills}>
              {(skill) => <StatPill state={skill.state} label={skill.name} sub={skill.abilityLabel} value={signed(skill.mod)} />}
            </For>
          </div>
        </SectionCard>
      </div>

      <div class={styles.coreRight}>
        <CombatRow />
        <Show when={props.senseChips().length || props.defenseChips().length || props.movementChips().length}>
          <div class={styles.choiceChips}>
            <For each={props.movementChips()}>{(l) => <Chip value={l} />}</For>
            <For each={props.senseChips()}>{(l) => <Chip value={l} />}</For>
            <For each={props.defenseChips()}>{(l) => <Chip value={l} />}</For>
          </div>
        </Show>
        <HitPointsCard />
        <div class={styles.cardRow}>
          <Show when={d().hitDicePools.length}><HitDiceCard /></Show>
          <DeathSavesCard />
        </div>
        <ResourcesCard />
        <AttacksCard />
        <ActionsCard />
        <FeaturesCard />
        <EquipmentCard />
      </div>
    </div>
  );
};

export default CoreTab;
