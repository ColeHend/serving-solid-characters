import { Component, createEffect, createSignal, onCleanup, onMount } from "solid-js";
import { addSnackbar } from "coles-solid-library";
import { useSearchParams } from "@solidjs/router";
import { AbilityGenMethod, Character } from "../../../models/character.model";
import { characterManager } from "../../../shared";
import { createCharacterSheet } from "../../../shared/sheetMapping/pdf/createCharacterSheet";
import useExportProficiencies from "../../../shared/customHooks/dndInfo/useExportProficiencies";
import styles from "./create.module.scss";
import { CodexSection } from "./shell/codexSection";
import { LivingSheet } from "./shell/livingSheet";
import { TopBar } from "./shell/topBar";
import { AbilitiesSection } from "./sections/abilitiesSection/abilitiesSection";
import { BackgroundSection } from "./sections/backgroundSection/backgroundSection";
import { ClassSection } from "./sections/classSection/classSection";
import { DetailsSection } from "./sections/detailsSection/detailsSection";
import { FeatsSection } from "./sections/featsSection/featsSection";
import { HpSection } from "./sections/hpSection/hpSection";
import { ItemsSection } from "./sections/itemsSection/itemsSection";
import { ReviewSection } from "./sections/reviewSection/reviewSection";
import { SkillsSection } from "./sections/skillsSection/skillsSection";
import { SpeciesSection } from "./sections/speciesSection/speciesSection";
import { SpellsSection } from "./sections/spellsSection/spellsSection";
import { CreateProvider, defaultEdition, useCreate } from "./state/createContext";
import { characterToDraft, draftToCharacter } from "./state/draftMapper";
import { applyCreatorMads } from "./rules/applyMads";
import { ABILITY_LABELS } from "./rules/constants";

const CreatePage: Component = () => {
  const { draft, actions, derived, data, lookups, editId, setEditId } = useCreate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sheetHidden, setSheetHidden] = createSignal(false);

  // Armor/weapon/tool proficiencies for the live (unsaved) character; the built character is
  // stashed in a signal so the resolver memo can read it in owner context.
  const [sheetChar, setSheetChar] = createSignal<Character | undefined>(undefined);
  const sheetProfs = useExportProficiencies(sheetChar);

  const saveDisabled = () => draft.name.trim().length < 3 || draft.classes.length === 0;

  const handleSave = () => {
    if (saveDisabled()) return;
    const character = draftToCharacter(draft, lookups());
    const editing = editId();
    if (editing) {
      // updateCharacter put()s by id (upsert), so this never duplicates even if the
      // in-memory list hasn't caught up with a just-created character.
      character.id = editing;
      characterManager.updateCharacter(character);
      setSearchParams({ id: editing });
    } else {
      // First save mints the id; capture it so re-saves update instead of duplicating.
      const newId = characterManager.createCharacter(character);
      actions.setCharacterId(newId);
      setEditId(newId);
      setSearchParams({ id: newId });
    }
  };

  const handleDelete = () => {
    const editing = editId();
    if (!editing) return;
    const name = characterManager.getCharacter(editing)?.name ?? "this character";
    if (!window.confirm(`Delete ${name}?`)) return;
    characterManager.deleteCharacter(editing);
    actions.reset();
    setEditId(null);
    setSearchParams({ id: undefined });
  };

  /**
   * Generate a sheet from the live draft without persisting it. MADS feature effects are
   * applied to the exported copy only — Save keeps the raw character (the view page
   * re-applies MADS at display time, so persisting the applied result would double-apply).
   */
  const handleCreateSheet = () => {
    if (draft.classes.length === 0) {
      addSnackbar({ message: "Add a class before creating a sheet", severity: "warning" });
      return;
    }
    const applied = applyCreatorMads(draftToCharacter(draft, lookups()), data.magicItems());
    setSheetChar(applied);
    void createCharacterSheet(applied, applied.stats ?? derived.finalScores(), sheetProfs());
  };

  // Edit mode: the ?id= character may arrive after mount (Dexie loads async) — watch until found.
  let editLoaded = false;
  createEffect(() => {
    if (editLoaded) return;
    const param = typeof searchParams.id === "string" ? searchParams.id : searchParams.id?.[0] ?? "";
    if (!param) return;
    const character = characterManager.getCharacter(param);
    if (!character) return;
    editLoaded = true;
    actions.load(characterToDraft(character, lookups(), defaultEdition()));
    setEditId(character.id);
  });

  onMount(() => document.body.classList.add("character-create-bg"));
  onCleanup(() => document.body.classList.remove("character-create-bg"));

  const methodLabels: Record<AbilityGenMethod, string> = {
    standard: "Standard Array",
    extended: "Extended Array",
    pointbuy: "Point Buy",
    roll: "Roll 4d6",
    manual: "Manual",
  };
  const abilitiesSummary = () =>
    `${methodLabels[draft.abilityMethod]} · ${Object.entries(derived.finalScores())
      .map(([key, score]) => `${ABILITY_LABELS[key as keyof typeof ABILITY_LABELS]} ${score}`)
      .join(" ")}`;

  return (
    <div class={styles.codexPage}>
      <TopBar
        onSave={handleSave}
        onCreateSheet={handleCreateSheet}
        onDelete={handleDelete}
        saveDisabled={saveDisabled()}
      />
      <div class={styles.layout} classList={{ [styles.layoutHidden]: sheetHidden() }}>
        <div class={styles.sidebar}>
          <LivingSheet hidden={sheetHidden()} onToggle={setSheetHidden} />
        </div>
        <div class={styles.sections}>
          <CodexSection
            index="I"
            title="Class"
            id="codex-class"
            summary={derived.classSummary() || "Choose a class"}
            subtitle="Pick a class to begin — click another to multiclass. Levels are set on each card."
          >
            <ClassSection />
          </CodexSection>

          <CodexSection
            index="II"
            title="Species"
            id="codex-species"
            summary={draft.species || "Choose a species"}
            subtitle={
              draft.edition === "2024"
                ? "In the 2024 rules, species grant traits — ability increases come from your background."
                : draft.edition === "both"
                  ? "Mixing editions — a legacy species grants its own ability scores and pairs with legacy backgrounds; a 2024 species leaves the increases to its background."
                  : "Your species grants ability scores, traits, and sometimes a lineage."
            }
          >
            <SpeciesSection />
          </CodexSection>

          <CodexSection
            index="III"
            title="Background"
            id="codex-background"
            summary={draft.background || "Choose a background"}
            subtitle={
              draft.edition === "2024"
                ? "Your background grants ability scores, an Origin feat, skills, and a tool."
                : draft.edition === "both"
                  ? "Backgrounds follow your species' edition — 2024 ones grant ability scores and an Origin feat, legacy ones grant skills and languages."
                  : "Your background grants skills, languages, and equipment."
            }
          >
            <BackgroundSection />
          </CodexSection>

          <CodexSection index="IV" title="Abilities" id="codex-abilities" summary={abilitiesSummary()}>
            <AbilitiesSection />
          </CodexSection>

          <CodexSection
            index="V"
            title="Hit Points"
            id="codex-hp"
            summary={`${derived.maxHp()} max`}
            subtitle="Auto-computed from your hit dice and Constitution — type a value to override, clear it to return to auto."
          >
            <HpSection />
          </CodexSection>

          <CodexSection
            index="VI"
            title="Skills"
            id="codex-skills"
            summary={`${derived.skillRows().filter((r) => r.state !== "none").length} proficient`}
            subtitle="Class and background picks are pre-applied. Click a pill to override — none, proficient, or expertise."
          >
            <SkillsSection />
          </CodexSection>

          <CodexSection index="VII" title="Feats" id="codex-feats" summary={`${derived.allFeatNames().length} taken`}>
            <FeatsSection />
          </CodexSection>

          <CodexSection
            index="VIII"
            title="Spells"
            id="codex-spells"
            summary={draft.spells.length > 0 ? `${draft.spells.length} inscribed` : "None yet"}
          >
            <SpellsSection />
          </CodexSection>

          <CodexSection
            index="IX"
            title="Details & Story"
            id="codex-details"
            summary="Gender, age, height, faith, story…"
          >
            <DetailsSection />
          </CodexSection>

          <CodexSection index="X" title="Items" id="codex-items" summary={`${draft.items.inventory.length} carried`}>
            <ItemsSection />
          </CodexSection>

          <CodexSection
            index="XI"
            title="Review"
            id="codex-review"
            summary={saveDisabled() ? "Steps remain" : "Ready to save"}
            subtitle="A final look before the ink dries — jump to any unfinished section, then save or export."
          >
            <ReviewSection
              onSave={handleSave}
              onCreateSheet={handleCreateSheet}
              saveDisabled={saveDisabled()}
              editing={!!editId()}
            />
          </CodexSection>
        </div>
      </div>
    </div>
  );
};

const CharacterCreate: Component = () => (
  <CreateProvider>
    <CreatePage />
  </CreateProvider>
);

export default CharacterCreate;
