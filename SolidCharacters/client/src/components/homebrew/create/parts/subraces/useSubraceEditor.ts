import { createEffect, createMemo, createSignal, runWithOwner } from "solid-js";
import { createStore } from "solid-js/store";
import { useSearchParams } from "@solidjs/router";
import { addSnackbar } from "coles-solid-library";
import { homebrewManager, SIZE_TOKENS, Subrace } from "../../../../../shared";
import {
  SubraceDraft,
  blankDraft,
  draftToModel,
  ABILITIES,
  validateDraft,
} from "./helpers";
import { createRaceLikeForm, decodeStat } from "../shared/raceLikeForm.shared";

export interface StoreState {
  selection: { race: string; subrace: string };
  editingExisting: boolean;
  status: "idle" | "ready";
  hasDraft: boolean;
  errors: string[];
}

export function useSubraceEditor() {
  const [params, setParams] = useSearchParams();
  const parentNames = createMemo(() =>
    (homebrewManager.races() || [])
      .map((r: any) => r.name)
      .filter(Boolean)
      .sort()
  );
  const asString = (v: string | string[] | undefined) =>
    typeof v === "string" ? v : v?.join(" ") ?? "";
  const [state, setState] = createStore<StoreState>({
    selection: { race: asString(params.race), subrace: asString(params.subrace) },
    editingExisting: false,
    status: "idle",
    hasDraft: false,
    errors: [],
  });
  const [editingTrait, setEditingTrait] = createSignal<string | null>(null);

  // Editor state lives in the FormGroup + standalone FormArrays; id/parent
  // are not form keys (see raceLikeForm.shared.ts).
  const { form, abilityBonuses, traits, fill, formToDraft } =
    createRaceLikeForm({ kind: "subrace" });
  const [draftId, setDraftId] = createSignal<string>(crypto.randomUUID());
  const parentRaceId = createMemo(() => {
    const parent = state.selection.race;
    if (!parent) return "";
    const race = homebrewManager.races().find((r: Subrace) => r.name === parent);
    return race?.id ?? "";
  });
  // The flat `subraces` table (each row keyed to its parent by parentRace ===
  // race id) is the single source of truth — the same list the race popup and
  // character creation read. No more nested race.subRaces copy.
  const existingSubraces = createMemo(() => {
    const id = parentRaceId();
    return id ? homebrewManager.subraces().filter((s) => s.parentRace === id) : [];
  });
  const existingSubraceNames = createMemo(() => existingSubraces().map((s) => s.name));

  function currentDraft(): SubraceDraft {
    return {
      ...formToDraft(),
      id: draftId(),
      parentRace: parentRaceId(),
    };
  }

  function fillBlank(parent: string) {
    fill(blankDraft(parent));
    setDraftId(crypto.randomUUID());
    setEditingTrait(null);
    setState({ hasDraft: true, editingExisting: false });
  }
  function loadExisting(parent: string, name: string) {
    const parentId = homebrewManager.races().find((r: any) => r.name === parent)?.id;
    if (!parentId) return;
    // Typed `any` to keep the legacy top-level text fallbacks below compiling
    // (older rows predate the `descriptions` map).
    const existing: any = homebrewManager
      .subraces()
      .find((sr) => sr.parentRace === parentId && sr.name === name);
    if (!existing) return;
    const sizes = (existing.size || "")
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean);
    const abilityBonusRows = (existing.abilityBonuses || []).map((a: any) => ({
      name: decodeStat(a.stat ?? a.name),
      value: a.value,
    }));
    const traitRows = (existing.traits || []).map((t: any) => ({
      name: t.details?.name || t.name,
      value: (t.details?.description || t.value || "").split("\n"),
    }));
    // Saved subraces keep their text under descriptions (see draftToModel);
    // fall back to legacy top-level fields for older rows.
    const descs = existing.descriptions || {};
    fill({
      name: existing.name || "",
      sizes,
      speed: existing.speed || 30,
      abilityBonuses: abilityBonusRows,
      languages: {
        fixed: [...(existing.languages || [])],
        amount: existing.languageChoice?.amount || 0,
        options: existing.languageChoice?.options || [],
        desc: descs.language ?? existing.languageDesc ?? "",
      },
      traits: traitRows,
      text: {
        age: descs.age ?? existing.age ?? "",
        alignment: descs.alignment ?? existing.alignment ?? "",
        sizeDesc: descs.size ?? existing.sizeDescription ?? "",
        desc: descs.desc ?? existing.desc ?? "",
      },
    });
    setDraftId(existing.id || crypto.randomUUID());
    setEditingTrait(null);
    setState({ hasDraft: true, editingExisting: true });
  }
  // The library Select fires onChange from a TRACKED internal effect (on
  // mount, and again whenever anything the handler read last run changes),
  // not just on user picks. Untracked+unowned (runWithOwner(null)) is
  // mandatory for both handlers below: without it the echo effect subscribed
  // to the editor state read inside them, so save()'s selection change
  // re-fired the subrace select's echo with a stale "" and fillBlank wiped
  // the just-saved draft. Handlers must also stay idempotent for echoed
  // values, and only navigate when the URL actually changes — otherwise
  // select -> setParams -> effect re-run -> onChange echo loops until the
  // router throws "Too many redirects".
  function setParamsIfChanged(next: { race: string; subrace: string }) {
    if (
      asString(params.race) === next.race &&
      asString(params.subrace) === next.subrace
    )
      return;
    setParams(next);
  }
  function selectParent(p: string) {
    runWithOwner(null, () => selectParentInner(p));
  }
  function selectParentInner(p: string) {
    const parentChanged = p !== state.selection.race;
    // Echo of the current value with nothing left to do: ignore.
    if (!parentChanged && (p ? state.hasDraft : true)) return;
    setState((old) => ({
      selection: { race: p, subrace: parentChanged ? "" : old.selection.subrace },
      editingExisting: parentChanged ? false : old.editingExisting,
    }));
    if (p) {
      if (parentChanged || !state.hasDraft) fillBlank(p);
    } else if (parentChanged) {
      // Parent cleared ("-- choose --"): hide the stale form behind the
      // "Select a parent race to begin." fallback.
      setState("hasDraft", false);
      setEditingTrait(null);
    }
    setParamsIfChanged({ race: p, subrace: state.selection.subrace ?? "" });
  }
  function selectSubrace(name: string) {
    runWithOwner(null, () => selectSubraceInner(name));
  }
  function selectSubraceInner(name: string) {
    const race = state.selection.race;
    if (!race) return;
    // Echo of the current value with nothing left to do: ignore.
    if (
      name === state.selection.subrace &&
      (name ? state.editingExisting : state.hasDraft)
    )
      return;
    if (!name) {
      // "+ New Subrace"
      fillBlank(race);
      setState("selection", { race, subrace: "" });
      setParamsIfChanged({ race, subrace: "" });
      return;
    }
    loadExisting(race, name);
    setState("selection", { race, subrace: name });
    setParamsIfChanged({ race, subrace: name });
  }

  function save() {
    if (!state.hasDraft) return;
    const d = currentDraft();
    const errs = validateDraft(d, homebrewManager.subraces() as any);
    setState("errors", errs);
    if (errs.length) return;
    // Write only to the flat `subraces` table (the popup/char-creation source).
    // parentRace already carries the parent race id (see currentDraft).
    const isUpdate = homebrewManager
      .subraces()
      .some((s) => s.id === d.id || (s.parentRace === d.parentRace && s.name === d.name));
    homebrewManager.saveSubrace(draftToModel(d));
    // Keep the NAME in selection.race — the parent Select value and the
    // loadExisting/deleteCurrent/selectParent lookups all key on the name.
    setState({
      editingExisting: true,
      selection: { race: state.selection.race, subrace: d.name },
    });
    addSnackbar({
      message: isUpdate ? "Subrace updated" : "Subrace created",
      severity: "success",
    });
  }
  function deleteCurrent() {
    if (!state.hasDraft || !state.editingExisting) return;
    const name = form.getR("name") as string;
    const confirmed = window.confirm(
      `Delete subrace "${name}"? This cannot be undone.`
    );
    if (!confirmed) return;
    // removeSubrace matches by id OR (parentRace, name); draftId() is authoritative.
    homebrewManager.removeSubrace(parentRaceId(), name, draftId());
    addSnackbar({ message: "Subrace deleted", severity: "success" });
    fillBlank(state.selection.race);
    setState("selection", { race: state.selection.race, subrace: "" });
    setParamsIfChanged({ race: state.selection.race || "", subrace: "" });
  }

  const parent = createMemo(() => state.selection.race);
  const subraceName = createMemo(() => state.selection.subrace);
  const draft = () => (state.hasDraft ? currentDraft() : undefined);
  if (state.status === "idle") {
    if (parent()) {
      if (subraceName()) loadExisting(parent(), subraceName());
      if (!state.hasDraft) fillBlank(parent());
    }
    setState("status", "ready");
  }
  // Deep link (?race=&subrace=) on a hard reload races the async Dexie
  // hydration: the init block above finds no races/subraces yet. Retry once
  // BOTH the parent race and the target subrace row show up (they hydrate from
  // separate tables), unless a subrace was already loaded.
  let pendingDeepLink = !!(parent() && subraceName());
  createEffect(() => {
    if (!pendingDeepLink) return;
    if (state.editingExisting) { pendingDeepLink = false; return; }
    const parentId = homebrewManager
      .races()
      .find((r: any) => r.name === state.selection.race)?.id;
    if (!parentId) return; // keep waiting for race hydration
    const existing = homebrewManager
      .subraces()
      .find((s) => s.parentRace === parentId && s.name === state.selection.subrace);
    if (!existing) return; // keep waiting for subrace hydration
    pendingDeepLink = false;
    loadExisting(state.selection.race, state.selection.subrace);
  });
  const validationErrors = createMemo(() =>
    state.hasDraft
      ? validateDraft(currentDraft(), homebrewManager.subraces() as any)
      : ["No draft"]
  );

  return {
    state,
    form,
    abilityBonuses,
    traits,
    draft,
    parent,
    subraceName,
    parentNames,
    existingSubraceNames,
    validationErrors,
    editingTrait,
    setEditingTrait,
    selectParent,
    selectSubrace,
    save,
    deleteCurrent,
    SIZE_TOKENS,
    ABILITIES,
  };
}

export type SubraceEditorApi = ReturnType<typeof useSubraceEditor>;
