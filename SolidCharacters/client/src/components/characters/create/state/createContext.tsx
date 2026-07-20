import { Accessor, JSX, createContext, createEffect, createMemo, createSignal, useContext } from "solid-js";
import { CharacterEdition, RulesetSelection } from "../../../../models/character.model";
import { useDnDBackgrounds } from "../../../../shared/customHooks/dndInfo/info/all/backgrounds";
import { useDnDClasses } from "../../../../shared/customHooks/dndInfo/info/all/classes";
import { useDnDFeats } from "../../../../shared/customHooks/dndInfo/info/all/feats";
import { useDnDItems } from "../../../../shared/customHooks/dndInfo/info/all/items";
import { useDnDMagicItems } from "../../../../shared/customHooks/dndInfo/info/all/magicItems";
import { useDnDRaces } from "../../../../shared/customHooks/dndInfo/info/all/races";
import { useDnDSpells } from "../../../../shared/customHooks/dndInfo/info/all/spells";
import { useDnDSubclasses } from "../../../../shared/customHooks/dndInfo/info/all/subclasses";
import { useDnDSubraces } from "../../../../shared/customHooks/dndInfo/info/all/subraces";
import getUserSettings from "../../../../shared/customHooks/userSettings";
import { loadSrdBackgrounds } from "../../../../shared/customHooks/dndInfo/info/srd/backgrounds";
import { loadSrdClasses } from "../../../../shared/customHooks/dndInfo/info/srd/classes";
import { loadSrdFeats } from "../../../../shared/customHooks/dndInfo/info/srd/feats";
import { loadSrdRaces } from "../../../../shared/customHooks/dndInfo/info/srd/races";
import { loadSrdSpells } from "../../../../shared/customHooks/dndInfo/info/srd/spells";
import { loadSrdSubclasses } from "../../../../shared/customHooks/dndInfo/info/srd/subclasses";
import { loadSrdSubraces } from "../../../../shared/customHooks/dndInfo/info/srd/subraces";
import { useGetHombrewBackgrounds } from "../../../../shared/customHooks/dndInfo/info/homebrew/background";
import { useGetHombrewClasses } from "../../../../shared/customHooks/dndInfo/info/homebrew/classes";
import { useGetHombrewFeats } from "../../../../shared/customHooks/dndInfo/info/homebrew/feat";
import { useGetHombrewRaces } from "../../../../shared/customHooks/dndInfo/info/homebrew/races";
import { useGetHombrewSpells } from "../../../../shared/customHooks/dndInfo/info/homebrew/spells";
import { useGetHombrewSubclasses } from "../../../../shared/customHooks/dndInfo/info/homebrew/subclasses";
import { useGetHombrewSubraces } from "../../../../shared/customHooks/dndInfo/info/homebrew/subraces";
import { CreateData, Derived, useDerived } from "../rules/useDerived";
import { defaultSlots } from "../rules/engine";
import { withVariantFirst } from "./bothMode";
import { DraftActions, createDraftStore } from "./draftStore";
import { SrdLookups } from "./draftMapper";
import { EditionData } from "./reconcileEdition";
import { CharacterDraft } from "./types";

export interface CreateContextValue {
  draft: CharacterDraft;
  actions: DraftActions;
  derived: Derived;
  data: CreateData;
  /** Plain-object snapshot of the data lists for the pure mapper/reconciler. */
  lookups: () => SrdLookups;
  /**
   * The full dataset of a specific ruleset (SRD awaited + homebrew, 'both' = merged editions),
   * for reconciling a switch BEFORE committing it to the store.
   */
  loadEditionData: (edition: RulesetSelection) => Promise<EditionData>;
  /** Id of the character being edited, null when creating a new one. */
  editId: Accessor<string | null>;
  setEditId: (id: string | null) => void;
}

const CreateContext = createContext<CreateContextValue>();

export function defaultEdition(): RulesetSelection {
  const [userSettings] = getUserSettings();
  const system = userSettings().dndSystem;
  return system === "2014" || system === "2024" || system === "both" ? system : "2024";
}

export function CreateProvider(props: { children: JSX.Element }) {
  const { draft, actions } = createDraftStore({ edition: defaultEdition() });
  const [editId, setEditId] = createSignal<string | null>(null);

  // Property access happens inside each hook's createMemo, so the store's edition is tracked
  // and every list swaps datasets when the toggle changes.
  const editionOpt = {
    get overrideVersion() {
      return draft.edition;
    },
  };

  // Both-mode keeps the merged 2014+2024 lists intact — every edition's row renders side
  // by side (legacy badged). Name-keyed picks resolve through the pairing-aware helpers.
  const raw = {
    classes: useDnDClasses(editionOpt),
    subclasses: useDnDSubclasses(editionOpt),
    races: useDnDRaces(editionOpt),
    subraces: useDnDSubraces(editionOpt),
    backgrounds: useDnDBackgrounds(editionOpt),
    feats: useDnDFeats(editionOpt),
    spells: useDnDSpells(editionOpt),
    items: useDnDItems(editionOpt),
  };

  // The magic-item hook takes a single year, so both-mode merges the two catalogs with the
  // current rows FIRST — collectMagicItemMads keeps the first row per name, so a same-name
  // item resolves to its 2024 printing and never applies twice.
  const magicItems2014 = useDnDMagicItems({ overrideVersion: "2014" });
  const magicItems2024 = useDnDMagicItems({ overrideVersion: "2024" });
  const magicItems = createMemo(() => {
    if (draft.edition === "2014") return magicItems2014();
    if (draft.edition === "2024") return magicItems2024();
    return [...magicItems2024(), ...magicItems2014()];
  });

  const data: CreateData = {
    classes: raw.classes,
    subclasses: raw.subclasses,
    races: raw.races,
    racesRaw: raw.races,
    subraces: raw.subraces,
    backgrounds: raw.backgrounds,
    backgroundsRaw: raw.backgrounds,
    feats: raw.feats,
    spells: raw.spells,
    items: raw.items,
    magicItems,
  };

  const derived = useDerived(draft, data);

  // Seed each bonus source's slots with its pool's book defaults whenever the pool shape
  // changes (species/lineage/background/style/edition changes clear the slots to []) —
  // zero-click parity: a fixed-bonus race applies its book stats with no player input.
  // Steady state (lengths match) writes nothing, so restored assignments survive edit loads.
  createEffect(() => {
    const pool = derived.speciesBonusPool();
    if (draft.abilityBonuses.species.length !== pool.tokens.length) {
      actions.resetAbilityBonusSlots("species", defaultSlots(pool));
    }
  });
  createEffect(() => {
    const pool = derived.backgroundBonusPool();
    if (draft.abilityBonuses.background.length !== pool.tokens.length) {
      actions.resetAbilityBonusSlots("background", defaultSlots(pool));
    }
  });

  // Plain-object snapshot for the pure mapper/reconciler. Races/backgrounds surface the
  // pairing-resolved variant first so name lookups hit the edition-correct row in both-mode.
  const lookups = (): SrdLookups => ({
    classes: data.classes(),
    subclasses: data.subclasses(),
    races: withVariantFirst(data.races(), derived.selectedRace()),
    subraces: data.subraces(),
    backgrounds: withVariantFirst(data.backgrounds(), derived.selectedBackground()),
    feats: data.feats(),
    spells: data.spells(),
  });

  // Homebrew isn't edition-tagged — it belongs to every edition's dataset.
  const homebrew = {
    classes: useGetHombrewClasses(),
    subclasses: useGetHombrewSubclasses(),
    races: useGetHombrewRaces(),
    subraces: useGetHombrewSubraces(),
    backgrounds: useGetHombrewBackgrounds(),
    feats: useGetHombrewFeats(),
    spells: useGetHombrewSpells(),
  };

  const loadSrdRows = async (edition: CharacterEdition) => {
    const [classes, subclasses, races, subraces, backgrounds, feats, spells] = await Promise.all([
      loadSrdClasses(edition),
      loadSrdSubclasses(edition),
      loadSrdRaces(edition),
      loadSrdSubraces(edition),
      loadSrdBackgrounds(edition),
      loadSrdFeats(edition),
      loadSrdSpells(edition),
    ]);
    return {
      classes: classes.rows,
      subclasses: subclasses.rows,
      races: races.rows,
      subraces: subraces.rows,
      backgrounds: backgrounds.rows,
      feats: feats.rows,
      spells: spells.rows,
    };
  };

  const loadEditionData = async (edition: RulesetSelection): Promise<EditionData> => {
    const srd =
      edition === "both"
        ? await Promise.all([loadSrdRows("2014"), loadSrdRows("2024")]).then(([legacy, current]) => ({
          classes: [...legacy.classes, ...current.classes],
          subclasses: [...legacy.subclasses, ...current.subclasses],
          races: [...legacy.races, ...current.races],
          subraces: [...legacy.subraces, ...current.subraces],
          backgrounds: [...legacy.backgrounds, ...current.backgrounds],
          feats: [...legacy.feats, ...current.feats],
          spells: [...legacy.spells, ...current.spells],
        }))
        : await loadSrdRows(edition);
    return {
      classes: [...srd.classes, ...homebrew.classes()],
      subclasses: [...srd.subclasses, ...homebrew.subclasses()],
      races: [...srd.races, ...homebrew.races()],
      subraces: [...srd.subraces, ...homebrew.subraces()],
      backgrounds: [...srd.backgrounds, ...homebrew.backgrounds()],
      feats: [...srd.feats, ...homebrew.feats()],
      spells: [...srd.spells, ...homebrew.spells()],
    };
  };

  return (
    <CreateContext.Provider
      value={{ draft, actions, derived, data, lookups, loadEditionData, editId, setEditId }}
    >
      {props.children}
    </CreateContext.Provider>
  );
}

export function useCreate(): CreateContextValue {
  const context = useContext(CreateContext);
  if (!context) throw new Error("useCreate must be used inside <CreateProvider>");
  return context;
}
