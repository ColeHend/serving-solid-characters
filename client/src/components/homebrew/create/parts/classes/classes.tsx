import { Component, createSignal, createMemo } from "solid-js";
import { Proficiencies } from "./proficiencies";
import { toClass5E } from "./classAdapter";
// Use unified homebrewManager so new classes immediately appear in homebrew views
import { homebrewManager } from "../../../../../shared/customHooks/homebrewManager";
import { FeatureTable } from "./featureTable";
import { Stats } from "./stats";
import { Items } from "./items";
import { Header } from "./header";
import { Container, Form, FormGroup, Validators, FormArray, Button } from "coles-solid-library";
import addSnackbar from "../../../../../shared/components/Snackbar/snackbar";
import styles from './classes.module.scss';
import { CastingStat, Stat } from "../../../../../shared/models/stats";
import { DnDClass, ClassMetadata, LevelEntity, Subclass, ClassCasting } from "../../../../../models/old/class.model";
import { useDnDClassesFiltered } from "../../../../../shared/customHooks/dndInfo/info/all/classesFiltered";
import { getUserSettings } from "../../../../../shared/customHooks/userSettings";
import { CasterType, Choice, FeatureTypes } from "../../../../../models/old/core.model";
import { SpellsKnown } from "../../../../../shared/models/casting";
import { ArrayValidation, ValidatorResult } from "coles-solid-library/dist/components/Form/formHelp/models";

interface ClassSpecificValue {
  key: string;
  value: string;
};

export interface ClassForm {
  name: string;
  description: string;
  hitDie: number;
  primaryStat: Stat;
  savingThrows: Stat[];
  armorProficiencies: string[];
  weaponProficiencies: string[];
  toolProficiencies: string[];
  armorStart: string[];
  weaponStart: string[];
  itemStart: string[];
  armorProfChoices: Choice<string>[];
  weaponProfChoices: Choice<string>[];
  toolProfChoices: Choice<string>[];
  skills: Stat[];
  skillChoiceNum: number;
  skillChoices: string[];
  startingEquipment: string[];
  spellCasting: boolean;
  castingStat?: CastingStat;
  casterType?: CasterType;
  classSpecificValues?: ClassSpecificValue[];
  subclasses?: Subclass[];
  metadataSubclassLevels?: number[];
  metadataSubclassName?: string;
  metadataSubclassPos?: 'before' | 'after' | string;
  classLevels: LevelEntity[];
  spellcastName: string;
  spellsKnownCalc: SpellsKnown;
  spellcastAbility: CastingStat;
  spellsKnownRoundup?: boolean;
  spellsInfo: string;
  spellsLevel: number;
  hasCantrips: boolean;
}

export const Classes: Component = () => {
  // SRD classes (depends on userSettings().dndSystem: 2014 | 2024 | both)
  const srdClasses = useDnDClassesFiltered();
  const [userSettings] = getUserSettings();

  const defaultClassLevels: LevelEntity[] = Array.from({ length: 20 }, (_, i) => ({
    level: i + 1,
    features: [{
      name: `Feature ${i + 1}`,
      value: 'Description of the feature',
      metadata: {

      },
      info: {
        className: '',
        subclassName: '',
        level: i + 1,
        type: FeatureTypes.Class,
        other: '',
      }
    }],
    info: {
      className: '',
      subclassName: '',
      level: i + 1,
      type: FeatureTypes.Class,
      other: '',
    },
    profBonus: i < 5 ? 2 : i < 9 ? 3 : i < 13 ? 4 : i < 17 ? 5 : 6,
    classSpecific: {},
  }));

  // const classLevels = new FormArray<LevelEntity[]>([[], []], defaultClassLevels);

  const ClassFormGroup = new FormGroup<ClassForm>({
    name: ['', [Validators.Required]],
    description: ['', []],
    hitDie: [undefined, [Validators.Required]],
    primaryStat: [undefined, [Validators.Required]],
    savingThrows: [[], []],
    armorProficiencies: [[], []],
    weaponProficiencies: [[], []],
    toolProficiencies: [[], []],
    armorStart: [[], []],
    weaponStart: [[], []],
    itemStart: [[], []],
    armorProfChoices: [[], []],
    weaponProfChoices: [[], []],
    toolProfChoices: [[], []],
    skills: [[], []],
    skillChoiceNum: [undefined, []],
    skillChoices: [[], []],
    startingEquipment: [[], []],
    spellCasting: [false, []],
    castingStat: [undefined, []],
    casterType: [CasterType.Full, []],
    classSpecificValues: [[], []],
    subclasses: [[], []],
    metadataSubclassLevels: [[], []],
    metadataSubclassName: ['', []],
    metadataSubclassPos: ['before', []],
    classLevels: [[], []],
    spellcastName: ['', []],
    spellsKnownCalc: [SpellsKnown.Number, []],
    spellcastAbility: [CastingStat.WIS, []],
    spellsKnownRoundup: [false, []],
    spellsInfo: ['', []],
    spellsLevel: [1, []],    
    hasCantrips: [false, []]
  });
  const [resetNonce, setResetNonce] = createSignal(0);
  const resetForm = () => {
    // Clear values succinctly (no reset API on FormGroup yet)
    // Reapply primitives
    ClassFormGroup.set('name','' as any);
    ClassFormGroup.set('description','' as any);
    ClassFormGroup.set('hitDie', undefined as any);
    ClassFormGroup.set('primaryStat', undefined as any);
    ClassFormGroup.set('savingThrows', [] as any);
    ClassFormGroup.set('armorProficiencies', [] as any);
    ClassFormGroup.set('weaponProficiencies', [] as any);
    ClassFormGroup.set('toolProficiencies', [] as any);
    ClassFormGroup.set('armorStart', [] as any);
    ClassFormGroup.set('weaponStart', [] as any);
    ClassFormGroup.set('itemStart', [] as any);
    ClassFormGroup.set('armorProfChoices', [] as any);
    ClassFormGroup.set('weaponProfChoices', [] as any);
    ClassFormGroup.set('toolProfChoices', [] as any);
    ClassFormGroup.set('skills', [] as any);
    ClassFormGroup.set('skillChoiceNum', undefined as any);
    ClassFormGroup.set('skillChoices', [] as any);
    ClassFormGroup.set('startingEquipment', [] as any);
    ClassFormGroup.set('spellCasting', false as any);
    ClassFormGroup.set('castingStat', undefined as any);
    ClassFormGroup.set('casterType', CasterType.Full as any);
    ClassFormGroup.set('classSpecificValues', [] as any);
    ClassFormGroup.set('subclasses', [] as any);
    ClassFormGroup.set('metadataSubclassLevels', [] as any);
    ClassFormGroup.set('metadataSubclassName', '' as any);
    ClassFormGroup.set('metadataSubclassPos', 'before' as any);
    ClassFormGroup.set('classLevels', defaultClassLevels as any);
    ClassFormGroup.set('spellcastName', '' as any);
    ClassFormGroup.set('spellsKnownCalc', SpellsKnown.Number as any);
    ClassFormGroup.set('spellcastAbility', CastingStat.WIS as any);
    ClassFormGroup.set('spellsKnownRoundup', false as any);
    ClassFormGroup.set('spellsInfo', '' as any);
    ClassFormGroup.set('spellsLevel', 1 as any);
    ClassFormGroup.set('hasCantrips', false as any);
    setClassLevels(defaultClassLevels);
    setProfStore({});
    setResetNonce(n => n + 1);
  };

  const onSubmit = async (data: ClassForm) => {
    const fullData: ClassForm = {
      ...data,
      weaponProficiencies: profStore().weapons || [],
      armorProficiencies: profStore().armor || [],
      toolProficiencies: profStore().tools || [],
      classLevels: classLevels(),
    };
    const adapted = toClass5E(fullData, profStore(), classLevels());
    // Simple duplicate guard
    if (homebrewManager.classes().some(c => c.name.toLowerCase() === (adapted.name || '').toLowerCase())) {
      addSnackbar({ message: 'Class name already exists', severity: 'warning' });
      return;
    }
    await homebrewManager.addClass(adapted as any);
    addSnackbar({ message: 'Class saved', severity: 'success' });
    resetForm();
  };
  ClassFormGroup.set('classLevels', defaultClassLevels);
  const [classLevels, setClassLevels] = createSignal<LevelEntity[]>(defaultClassLevels);
  const [profStore, setProfStore] = createSignal<ProfStore>({});

  // Track existing SRD class names for basic uniqueness hint (not a form validator yet)
  const existingNames = createMemo(() => new Set(srdClasses().map(c => c.name.toLowerCase())));

  // Optional: hook into form changes to warn about duplicates (non-blocking for now)
  const checkNameUnique = () => {
    const raw = ClassFormGroup.get('name');
    if (!raw) return true;
    const name = raw.toString().trim().toLowerCase();
    if (!name) return true;
    return !existingNames().has(name);
  };

  // Could surface this in UI later; for now just a console hint
  createMemo(() => {
    const unique = checkNameUnique();
    if (!unique) {
      // console.warn(`[homebrew-class] Name already exists in SRD (${userSettings().dndSystem || 'current'} set).`);
    }
    return unique;
  });
  return (
    <Container theme="surface" class={`${styles.container}`}>
      <Form data={ClassFormGroup} onSubmit={onSubmit}>
        <div class={`${styles.body}`}>
          <Header resetNonce={resetNonce()} />
          <Stats />
          <Proficiencies setProfStore={setProfStore} formGroup={ClassFormGroup} />
          <Items formGroup={ClassFormGroup} />
          <FeatureTable tableData={classLevels} setTableData={setClassLevels} formGroup={ClassFormGroup} />
        </div>
        <Button type="submit" aria-label="Save Class">
          Submit
        </Button>
      </Form>
    </Container>
  );
};

export interface ProfStore {
  weapons?: string[];
  armor?: string[];
  tools?: string[];
}