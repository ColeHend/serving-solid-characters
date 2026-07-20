import { Component, Show, createEffect, createMemo, createSignal, onCleanup, onMount } from "solid-js";
import { useSearchParams } from "@solidjs/router";
import { Body, TabBar } from "coles-solid-library";
import styles from "./sheet/sheet.module.scss";
import useGetFullStats from "../../../shared/customHooks/dndInfo/useGetFullStats";
import { Character } from "../../../models/character.model";
import { Spell } from "../../../models/generated";
import { useDnDSpells } from "../../../shared/customHooks/dndInfo/info/all/spells";
import { useDnDItems } from "../../../shared/customHooks/dndInfo/info/all/items";
import { useDnDMagicItems } from "../../../shared/customHooks/dndInfo/info/all/magicItems";
import { characterManager, Clone } from "../../../shared";
import {
  characterMadFeatureSources,
  collectMadFeatures,
  collectMagicItemMads,
  useMadCharacters,
  setStatPickAt,
} from "../../../shared/customHooks/mads/useMadCharacters";
import useExportProficiencies from "../../../shared/customHooks/dndInfo/useExportProficiencies";
import {
  featureUsage,
  grantedActionUsage,
  actionUsesKey,
  resetFeatureUses,
  RechargeType,
  LONG_REST,
} from "../../../shared/customHooks/mads/commands/useUsesFeature";
import { movementModeLabels, senseLabels } from "../../../shared/customHooks/mads/rollFormat";
import { hitDieSides } from "../create/rules/engine";
import CharacterHeader from "./sheet/CharacterHeader";
import CoreTab from "./sheet/CoreTab";
import SpellcastingTab from "./sheet/SpellcastingTab";
import DetailsTab from "./sheet/DetailsTab";
import useSheetDerived from "./sheet/useSheetDerived";

const CharacterView: Component = () => {
  const allSpells = useDnDSpells();
  const allItems = useDnDItems();
  const allMagicItems = useDnDMagicItems();

  const [mainActiveTab, setMainActiveTab] = createSignal(0);
  const [searchParam, setSearchParam] = useSearchParams();

  // Track the manager's signal directly — Dexie fills it AFTER mount on a hard load.
  const characters = createMemo(() => characterManager.characters());
  const paramId = () => (typeof searchParam.id === "string" ? searchParam.id : searchParam.id?.[0] ?? "");

  const [currentCharacter, setCurrentCharacter] = createSignal<Character | undefined>(
    characters().find((x) => x.id === paramId()) ?? characters()?.[0],
  );
  createEffect(() => {
    if (currentCharacter()) return;
    const found = characters().find((x) => x.id === paramId()) ?? characters()[0];
    if (found) setCurrentCharacter(found);
  });

  // The character with its mad commands applied, for display only. Handlers always clone the
  // persisted character and never mutate the signal's own object.
  const displayCharacter = createMemo<Character | undefined>(() => {
    const base = currentCharacter();
    if (!base) return base;
    const clone = Clone(base);
    return useMadCharacters(clone, [
      ...collectMadFeatures(clone),
      ...collectMagicItemMads(clone, allMagicItems()),
    ]);
  });

  const fullStats = useGetFullStats(displayCharacter as () => Character);
  const derived = useSheetDerived(displayCharacter, currentCharacter, fullStats);

  // ── mad-derived display chips ────────────────────────────────────
  const movementChips = createMemo(() => {
    const c = displayCharacter();
    return c ? movementModeLabels(c) : [];
  });
  const senseChips = createMemo(() => senseLabels(displayCharacter()?.senses ?? {}));
  const defenseChips = createMemo(() => {
    const c = displayCharacter();
    if (!c) return [];
    return [
      ...(c.resistances ?? []).map((r) => `Resists ${r.type}`),
      ...(c.immunities ?? []).map((r) => `Immune to ${r.type}`),
      ...(c.vulnerabilities ?? []).map((r) => `Vulnerable to ${r.type}`),
    ];
  });

  const equipProfs = useExportProficiencies(displayCharacter);
  const equipLines = createMemo(() => {
    const profs = equipProfs();
    return [
      profs.armor.length ? `Armor: ${profs.armor.join(", ")}` : "",
      profs.weapons.length ? `Weapons: ${profs.weapons.join(", ")}` : "",
      profs.tools.length ? `Tools: ${profs.tools.join(", ")}` : "",
    ].filter(Boolean);
  });

  const allFeatures = createMemo(() => {
    const c = displayCharacter();
    return c ? characterMadFeatureSources(c) : [];
  });

  // ── spells ───────────────────────────────────────────────────────
  const getKnownSpells = (character: Character | undefined): Spell[] =>
    allSpells().filter((spell) => character?.spells?.some((s) => s.name === spell.name));
  const cantrips = createMemo(() => getKnownSpells(currentCharacter()).filter((s) => +s.level === 0));
  const spellGroups = createMemo(() => {
    const known = getKnownSpells(currentCharacter());
    const groups: { level: number; spells: Spell[] }[] = [];
    for (let lvl = 0; lvl <= 9; lvl++) {
      const spells = known.filter((s) => +s.level === lvl);
      if (spells.length) groups.push({ level: lvl, spells });
    }
    return groups;
  });
  const [selectedSpell, setSelectedSpell] = createSignal<Spell>({} as Spell);
  const [showSpellModal, setShowSpellModal] = createSignal(false);
  const showSpell = (spell: Spell) => {
    setSelectedSpell(spell);
    setShowSpellModal(true);
  };

  // ── persistence + handlers ───────────────────────────────────────
  const persistCharacter = (updated: Character) => {
    characterManager.updateCharacter(updated, true);
    setCurrentCharacter(updated);
  };
  const mutate = (fn: (c: Character) => void) => {
    const base = currentCharacter();
    if (!base) return;
    const updated = Clone(base);
    fn(updated);
    persistCharacter(updated);
  };

  const applyDamage = (n: number) =>
    mutate((c) => {
      if (n <= 0) return;
      const h = c.health ?? { max: 0, current: 0, temp: 0 };
      let dmg = n;
      const absorbed = Math.min(h.temp ?? 0, dmg);
      h.temp = (h.temp ?? 0) - absorbed;
      dmg -= absorbed;
      h.current = Math.max(0, (h.current ?? 0) - dmg);
      c.health = h;
    });
  const applyHeal = (n: number) =>
    mutate((c) => {
      if (n <= 0) return;
      const max = displayCharacter()?.health?.max ?? c.health?.max ?? 0;
      c.health = { ...(c.health ?? { max: 0, current: 0, temp: 0 }), current: Math.min(max, (c.health?.current ?? 0) + n) };
      c.deathSaves = { successes: 0, failures: 0 };
    });
  const setTempHp = (n: number) =>
    mutate((c) => {
      c.health = { ...(c.health ?? { max: 0, current: 0, temp: 0 }), temp: Math.max(0, n) };
    });
  const setDeathSaves = (kind: "successes" | "failures", value: number) =>
    mutate((c) => {
      const ds = { successes: c.deathSaves?.successes ?? 0, failures: c.deathSaves?.failures ?? 0 };
      ds[kind] = Math.max(0, Math.min(3, value));
      c.deathSaves = ds;
    });
  const setHitDiceUsed = (sides: number, used: number) =>
    mutate((c) => {
      c.hitDiceUsed = { ...(c.hitDiceUsed ?? {}), [sides]: Math.max(0, used) };
    });
  const toggleInspiration = () =>
    mutate((c) => {
      c.inspiration = !(c.inspiration ?? false);
    });
  const setSlotUsed = (level: number, used: number) =>
    mutate((c) => {
      c.spellSlotsUsed = { ...(c.spellSlotsUsed ?? {}), [level]: Math.max(0, used) };
    });
  const setPortrait = (dataUrl: string) =>
    mutate((c) => {
      c.details = { ...(c.details ?? {}), portrait: dataUrl };
    });

  const spendUses = (featureName: string, spent: number) =>
    mutate((c) => {
      c.featureUses = { ...(c.featureUses ?? {}), [featureName]: spent };
    });

  const chooseStatAt = (featureKey: string, index: number, statKey: string, count: number) =>
    mutate((c) => {
      c.statChoices = {
        ...(c.statChoices ?? {}),
        [featureKey]: setStatPickAt(c.statChoices?.[featureKey], index, statKey, count),
      };
    });

  const proficiencyPicks = (featureKey: string): string[] =>
    (currentCharacter()?.proficiencyChoices?.[featureKey] ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const toggleProficiencyPick = (featureKey: string, skill: string, count: number) => {
    const picks = proficiencyPicks(featureKey);
    const next = picks.includes(skill)
      ? picks.filter((p) => p !== skill)
      : picks.length < count
        ? [...picks, skill]
        : picks;
    if (next.join(",") === picks.join(",")) return;
    mutate((c) => {
      c.proficiencyChoices = { ...(c.proficiencyChoices ?? {}), [featureKey]: next.join(",") };
    });
  };

  const takeRest = (rest: RechargeType) => {
    const base = currentCharacter();
    if (!base) return;
    const level = displayCharacter()?.levels?.length;
    const limited = allFeatures().flatMap((f) => {
      const usage = featureUsage(f, level);
      return usage ? [{ name: f.name, recharge: usage.recharge }] : [];
    });
    const actionLimited = (displayCharacter()?.grantedActions ?? []).flatMap((a) => {
      const usage = grantedActionUsage(a, allFeatures(), level);
      return usage ? [{ name: actionUsesKey(a), recharge: usage.recharge }] : [];
    });
    const updated = resetFeatureUses(Clone(base), rest, [...limited, ...actionLimited]);
    if (rest === LONG_REST) {
      const max = displayCharacter()?.health?.max ?? updated.health?.max ?? 0;
      updated.health = { ...(updated.health ?? { max: 0, current: 0, temp: 0 }), current: max, temp: 0 };
      updated.spellSlotsUsed = {};
      updated.deathSaves = { successes: 0, failures: 0 };
      // Regain half of each hit-die pool (min 1), per the long-rest rules.
      const levels = displayCharacter()?.levels ?? [];
      const used = { ...(updated.hitDiceUsed ?? {}) };
      for (const key of Object.keys(used)) {
        const sides = +key;
        const total = levels.filter((l) => hitDieSides(l.hitDie) === sides).length;
        const regain = Math.max(1, Math.floor(total / 2));
        used[sides] = Math.max(0, (used[sides] ?? 0) - regain);
      }
      updated.hitDiceUsed = used;
    }
    persistCharacter(updated);
  };

  // Keep the URL on the shown character's id (and clear any legacy ?name= leftover).
  createEffect(() => {
    const id = currentCharacter()?.id;
    if (id) setSearchParam({ id, name: undefined });
  });

  onMount(() => {
    document.body.classList.add("character-view-bg");
  })

  onCleanup(() => {
    document.body.classList.remove("character-view-bg");
  })

  return (
    <div class={styles.sheet}>
      <CharacterHeader
        currentCharacter={currentCharacter}
        characters={characters}
        setCurrentCharacter={setCurrentCharacter}
        derived={derived}
        onToggleInspiration={toggleInspiration}
        onRest={takeRest}
      />

      <div class={styles.tabPanel}>
        <TabBar
          tabs={["Core", "Spellcasting", "Details"]}
          activeTab={mainActiveTab()}
          onTabChange={(_, index) => setMainActiveTab(index)}
        />
      </div>

      <Show when={mainActiveTab() === 0}>
        <CoreTab
          currentCharacter={currentCharacter}
          displayCharacter={displayCharacter}
          derived={derived}
          allFeatures={allFeatures}
          allItems={allItems}
          cantrips={cantrips}
          senseChips={senseChips}
          defenseChips={defenseChips}
          movementChips={movementChips}
          onDamage={applyDamage}
          onHeal={applyHeal}
          onSetTempHp={setTempHp}
          onSetDeathSaves={setDeathSaves}
          onSpendHitDie={setHitDiceUsed}
          spendUses={spendUses}
          chooseStatAt={chooseStatAt}
          toggleProficiencyPick={toggleProficiencyPick}
          proficiencyPicks={proficiencyPicks}
        />
      </Show>

      <Show when={mainActiveTab() === 1}>
        <SpellcastingTab
          currentCharacter={currentCharacter}
          derived={derived}
          spellGroups={spellGroups}
          showSpell={showSpell}
          selectedSpell={selectedSpell}
          showSpellModal={[showSpellModal, setShowSpellModal]}
          onSetSlotUsed={setSlotUsed}
        />
      </Show>

      <Show when={mainActiveTab() === 2}>
        <DetailsTab
          currentCharacter={currentCharacter}
          equipLines={equipLines}
          onSetPortrait={setPortrait}
        />
      </Show>
    </div>
  );
};

export default CharacterView;
