import { Accessor, Component, For, Show, createMemo, createSignal } from "solid-js";
import { Chip } from "coles-solid-library";
import { FitnessCenter, Shield, Psychology } from "coles-solid-library/icons";
import { Character, ActionType, itemRefName } from "../../../../models/character.model";
import { FeatureDetail, ItemType, Spell } from "../../../../models/generated";
import { srdItem } from "../../../../models/data/generated";
import { signed } from "../../../../shared/customHooks/utility/tools/dndMath";
import { SheetDerived } from "./useSheetDerived";
import { featureUsage } from "../../../../shared/customHooks/mads/commands/useUsesFeature";
import { AbilityColumn } from "./CoreTabParts/AbilityColumn/AbilityColumn";
import { CombatRow } from "./CoreTabParts/CombatRow/CombatRow";
import { HitPointsCard } from "./CoreTabParts/HitPointsCard/HitPointsCard";
import { HitDiceCard } from "./CoreTabParts/HitDiceCard/HitDiceCard";
import { DeathSavesCard } from "./CoreTabParts/DeathSavesCard/DeathSavesCard";
import { SectionCard } from "./CoreTabParts/SectionCard/SectionCard";
import { StatPill } from "./CoreTabParts/StatPill/StatPill";
import { ResourcesCard } from "./CoreTabParts/ResourcesCard/ResourcesCard";
import { AttacksCard } from "./CoreTabParts/AttacksCard/AttacksCard";
import { ActionsCard } from "./CoreTabParts/ActionsCard/ActionsCard";
import { FeaturesCard } from "./CoreTabParts/FeatureChoices/FeatureChocies";
import styles from "./sheet.module.scss";
import { EquipmentCard } from "./CoreTabParts/EquipmentCard/EquipmentCard";


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

  const [dmgAmount, setDmgAmount] = createSignal(1);
  const [editingTemp, setEditingTemp] = createSignal(false);
  const [activeEconomy, setActiveEconomy] = createSignal<ActionType>("action");
  const [itemView, setItemView] = createSignal<"inventory" | "equipped" | "attuned">("inventory");

  const limitedFeatures = createMemo(() =>
    props.allFeatures().flatMap((f) => {
      const usage = featureUsage(f, d().level);
      return usage ? [{ feature: f, usage }] : [];
    }),
  );
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
  
  return (
    <div class={styles.coreGrid}>
      <div class={styles.coreLeft}>
        <SectionCard icon={FitnessCenter} title="Ability Scores">
          <AbilityColumn 
            displayCharacter={props.displayCharacter}  
            statLabels={STAT_LABELS}
            derived={d} />
        </SectionCard>
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
        <CombatRow derived={d} />
        <Show when={props.senseChips().length || props.defenseChips().length || props.movementChips().length}>
          <div class={styles.choiceChips}>
            <For each={props.movementChips()}>{(l) => <Chip value={l} />}</For>
            <For each={props.senseChips()}>{(l) => <Chip value={l} />}</For>
            <For each={props.defenseChips()}>{(l) => <Chip value={l} />}</For>
          </div>
        </Show>
        <HitPointsCard
          onSetTempHp={props.onSetTempHp}
          currentCharacter={props.currentCharacter}
          displayCharacter={props.displayCharacter}
          onDamage={props.onDamage}
          onHeal={props.onHeal}
          dmgAmount={[dmgAmount, setDmgAmount]}
          editingTemp={[editingTemp, setEditingTemp]}
        />
        <div class={styles.cardRow}>
          <Show when={d().hitDicePools.length}>
            <HitDiceCard 
              derived={d}
              currentCharacter={props.currentCharacter}
              onSpendHitDie={props.onSpendHitDie}
            />
          </Show>
          <DeathSavesCard 
            currentCharacter={props.currentCharacter}
            onSetDeathSaves={props.onSetDeathSaves}
          />
        </div>
        <ResourcesCard 
          currentCharacter={props.currentCharacter}
          limitedFeatures={limitedFeatures}
        />
        <AttacksCard attackRows={attackRows} />
        <ActionsCard
          derived={d}
          activeEconomy={[activeEconomy, setActiveEconomy]}
          allFeatures={props.allFeatures}
          currentCharacter={props.currentCharacter}
          displayCharacter={props.displayCharacter}
          spendUses={props.spendUses}
          generricActions={GENERIC_ACTIONS}
        />
        <FeaturesCard 
          derived={d}
          currentCharacter={props.currentCharacter}
          displayCharacter={props.displayCharacter}
          allFeatures={props.allFeatures}
          chooseStatAt={props.chooseStatAt}
          toggleProficiencyPick={props.toggleProficiencyPick}
          proficiencyPicks={props.proficiencyPicks}
          statLabels={STAT_LABELS}
        />
        <EquipmentCard 
          currentCharacter={props.currentCharacter}
          itemView={[itemView, setItemView]}
        />
      </div>
    </div>
  );
};

export default CoreTab;