import { Component, createSignal } from "solid-js";
import { Proficiencies } from "./proficiencies";
import { FeatureTable } from "./featureTable";
import { Stats } from "./stats";
import { Items } from "./items";
import { Header } from "./header";
import { Container, Form, FormGroup, Validators, FormArray, Button } from "coles-solid-library";
import styles from './classes.module.scss';
import { CastingStat, Stat } from "../../../../../shared/models/stats";
import { DnDClass, ClassMetadata, LevelEntity, Subclass, ClassCasting } from "../../../../../models/old/class.model";
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
    hitDie: [undefined, []],
    primaryStat: [undefined, []],
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
  const onSubmit = (data: ClassForm) => {
    const fullData: ClassForm = {
      ...data,
      weaponProficiencies: profStore().weapons || [],
      armorProficiencies: profStore().armor || [],
      toolProficiencies: profStore().tools || [],
      classLevels: classLevels(),
    };
    console.log('ProfStore: ', profStore());
    
    console.log('Submitted: ', fullData);
    
  };
  ClassFormGroup.set('classLevels', defaultClassLevels);
  const [classLevels, setClassLevels] = createSignal<LevelEntity[]>(defaultClassLevels);
  const [profStore, setProfStore] = createSignal<ProfStore>({})
  return (
    <Container theme="surface" class={`${styles.container}`}>
      <Form data={ClassFormGroup} onSubmit={onSubmit}>
        <div class={`${styles.body}`}>
          <Header />
          <Stats />
          <Proficiencies setProfStore={setProfStore} formGroup={ClassFormGroup} />
          <Items formGroup={ClassFormGroup} />
          <FeatureTable tableData={classLevels} setTableData={setClassLevels} formGroup={ClassFormGroup} />
        </div>
        <Button type="submit">
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