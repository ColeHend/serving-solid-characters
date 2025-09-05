import { createMemo, createSignal, onCleanup } from "solid-js";
import { createStore } from "solid-js/store";
import { useSearchParams } from "@solidjs/router";
import { homebrewManager, SIZE_TOKENS } from "../../../../../shared";
import {
  SubraceDraft,
  blankDraft,
  draftToModel,
  ABILITIES,
  validateDraft,
} from "./helpers";

export interface StoreState {
  draft?: SubraceDraft;
  selection: { race: string; subrace: string };
  editingExisting: boolean;
  status: "idle" | "ready";
  errors: string[];
  snackbar?: { msg: string; type: "success" | "error"; at: number };
}

const validateLocal = (d?: SubraceDraft) =>
  validateDraft(d, homebrewManager.races() as any);

export function useSubraceEditor() {
  const [params, setParams] = useSearchParams();
  const parentNames = createMemo(() =>
    (homebrewManager.races() || [])
      .map((r: any) => r.name)
      .filter(Boolean)
      .sort()
  );
  const [state, setState] = createStore<StoreState>({
    selection: { race: params.race || "", subrace: params.subrace || "" },
    editingExisting: false,
    status: "idle",
    errors: [],
  });
  const [editingTrait, setEditingTrait] = createSignal<string | null>(null);
  const [collapsed, setCollapsed] = createStore<Record<string, boolean>>({});
  const toggle = (k: string) => setCollapsed(k, (v) => !v);
  let snackbarTimer: number | undefined;
  function pushSnack(msg: string, type: "success" | "error" = "success") {
    setState("snackbar", { msg, type, at: Date.now() });
    if (snackbarTimer) clearTimeout(snackbarTimer);
    snackbarTimer = window.setTimeout(
      () => setState("snackbar", undefined),
      3500
    );
  }
  onCleanup(() => {
    if (snackbarTimer) clearTimeout(snackbarTimer);
  });

  function ensureDraft(parent: string) {
    if (!state.draft || state.draft.parentRace !== parent)
      setState("draft", blankDraft(parent));
  }
  function loadExisting(parent: string, name: string) {
    const race = homebrewManager
      .races()
      .find((r: any) => r.name === parent) as any;
    if (!race) return;
    const existing = race.subRaces?.find((sr: any) => sr.name === name);
    if (!existing) return;
    const sizes = (existing.size || "")
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean);
    const abilityBonuses = (existing.abilityBonuses || []).map((a: any) => ({
      name: String(a.stat ?? a.name),
      value: a.value,
    }));
    const traits = (existing.traits || []).map((t: any) => ({
      name: t.details?.name || t.name,
      value: (t.details?.description || t.value || "").split("\n"),
    }));
    const draft: SubraceDraft = {
      id: existing.id || crypto.randomUUID(),
      name: existing.name || "",
      parentRace: parent,
      sizes,
      speed: (existing as any).speed || 30,
      abilityBonuses,
      languages: {
        fixed: [...(existing.languages || [])],
        amount: (existing.languageChoice as any)?.amount || 0,
        options: (existing.languageChoice as any)?.options || [],
        desc: (existing as any).languageDesc || "",
      },
      traits,
      text: {
        age: (existing as any).age || "",
        alignment: (existing as any).alignment || "",
        sizeDesc: (existing as any).sizeDescription || "",
        desc: (existing as any).desc || "",
      },
    };
    setState({ draft, editingExisting: true });
  }
  function selectParent(p: string) {
    setState({ selection: { race: p, subrace: "" }, editingExisting: false });
    ensureDraft(p);
    setParams({ race: p, subrace: "" });
  }
  function selectSubrace(name: string) {
    if (!state.selection.race) return;
    loadExisting(state.selection.race, name);
    setState("selection", { race: state.selection.race, subrace: name });
    setParams({ race: state.selection.race, subrace: name });
  }
  function updateDraft<K extends keyof SubraceDraft>(
    key: K,
    value: SubraceDraft[K]
  ) {
    if (!state.draft) return;
    setState("draft", { ...state.draft, [key]: value });
  }

  function addSize(sz: string) {
    if (!sz.trim() || !state.draft) return;
    if (!state.draft.sizes.includes(sz))
      updateDraft("sizes", [...state.draft.sizes, sz]);
  }
  function removeSize(sz: string) {
    if (!state.draft) return;
    updateDraft(
      "sizes",
      state.draft.sizes.filter((s) => s !== sz)
    );
  }
  function addAbility(name: string, value: number) {
    if (
      !state.draft ||
      !name ||
      state.draft.abilityBonuses.some((a) => a.name === name)
    )
      return;
    updateDraft("abilityBonuses", [
      ...state.draft.abilityBonuses,
      { name, value },
    ]);
  }
  function removeAbility(name: string) {
    if (!state.draft) return;
    updateDraft(
      "abilityBonuses",
      state.draft.abilityBonuses.filter((a) => a.name !== name)
    );
  }
  function setAbilityValue(name: string, value: number) {
    if (!state.draft) return;
    updateDraft(
      "abilityBonuses",
      state.draft.abilityBonuses.map((a) =>
        a.name === name ? { ...a, value } : a
      )
    );
  }
  function addLanguageFixed(l: string) {
    if (!state.draft || !l.trim() || state.draft.languages.fixed.includes(l))
      return;
    updateDraft("languages", {
      ...state.draft.languages,
      fixed: [...state.draft.languages.fixed, l],
    });
  }
  function removeLanguageFixed(l: string) {
    if (!state.draft) return;
    updateDraft("languages", {
      ...state.draft.languages,
      fixed: state.draft.languages.fixed.filter((x) => x !== l),
    });
  }
  function setLanguageChoice(amount: number, options: string[]) {
    if (!state.draft) return;
    updateDraft("languages", { ...state.draft.languages, amount, options });
  }
  function removeLanguageOption(opt: string) {
    if (!state.draft) return;
    setLanguageChoice(
      state.draft.languages.amount,
      state.draft.languages.options.filter((o) => o !== opt)
    );
  }
  function setLangDesc(desc: string) {
    if (!state.draft) return;
    updateDraft("languages", { ...state.draft.languages, desc });
  }
  function addTrait(name: string, text: string) {
    if (
      !state.draft ||
      !name.trim() ||
      state.draft.traits.some(
        (t) => t.name.toLowerCase() === name.toLowerCase()
      )
    )
      return;
    updateDraft("traits", [
      ...state.draft.traits,
      { name: name.trim(), value: text.trim() ? text.split(/\n+/) : [] },
    ]);
  }
  function removeTrait(name: string) {
    if (!state.draft) return;
    updateDraft(
      "traits",
      state.draft.traits.filter((t) => t.name !== name)
    );
    if (editingTrait() === name) setEditingTrait(null);
  }
  function updateTraitText(name: string, text: string) {
    if (!state.draft) return;
    updateDraft(
      "traits",
      state.draft.traits.map((t) =>
        t.name === name ? { ...t, value: text.split(/\n+/) } : t
      )
    );
  }

  function save() {
    if (!state.draft) return;
    const errs = validateLocal(state.draft);
    setState("errors", errs);
    if (errs.length) return;
    const races = homebrewManager.races() as any[];
    const parent = races.find((r) => r.name === state.draft!.parentRace);
    if (!parent) return;
    const existingIdx =
      parent.subRaces?.findIndex(
        (s: any) => s.id === state.draft!.id || s.name === state.draft!.name
      ) ?? -1;
    const model = draftToModel(state.draft);
    const updatedParent = {
      ...parent,
      subRaces: [...(parent.subRaces || [])],
    } as any;
    if (existingIdx > -1) updatedParent.subRaces[existingIdx] = model;
    else updatedParent.subRaces.push(model);
    homebrewManager.updateRace(updatedParent);
    setState({ editingExisting: true });
    pushSnack(
      existingIdx > -1 ? "Subrace updated" : "Subrace created",
      "success"
    );
  }
  function deleteCurrent() {
    if (!state.draft) return;
    const confirmed = window.confirm(
      `Delete subrace "${state.draft.name}"? This cannot be undone.`
    );
    if (!confirmed) return;
    const races = homebrewManager.races() as any[];
    const parent = races.find((r) => r.name === state.draft!.parentRace);
    if (!parent) return;
    const filtered = (parent.subRaces || []).filter(
      (s: any) => s.id !== state.draft!.id
    );
    homebrewManager.updateRace({ ...parent, subRaces: filtered });
    pushSnack("Subrace deleted", "success");
    setState({
      draft: undefined,
      selection: { race: state.selection.race, subrace: "" },
      editingExisting: false,
    });
    ensureDraft(state.selection.race!);
    setParams({ race: state.selection.race || "" });
  }

  const parent = () => state.selection.race;
  const subraceName = () => state.selection.subrace;
  const draft = () => state.draft;
  if (state.status === "idle") {
    if (parent()) ensureDraft(parent()!);
    setState("status", "ready");
  }
  const validationErrors = createMemo(() => validateLocal(draft()));

  return {
    state,
    draft,
    parent,
    subraceName,
    parentNames,
    collapsed,
    validationErrors,
    editingTrait,
    setEditingTrait,
    selectParent,
    selectSubrace,
    updateDraft,
    addSize,
    removeSize,
    addAbility,
    removeAbility,
    setAbilityValue,
    addLanguageFixed,
    removeLanguageFixed,
    setLanguageChoice,
    removeLanguageOption,
    setLangDesc,
    addTrait,
    removeTrait,
    updateTraitText,
    save,
    deleteCurrent,
    toggle,
    pushSnack,
    SIZE_TOKENS,
    ABILITIES,
  };
}

export type SubraceEditorApi = ReturnType<typeof useSubraceEditor>;
