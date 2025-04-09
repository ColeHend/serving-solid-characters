import { Component } from "solid-js";
import { Proficiencies } from "./proficiencies";
import { FeatureTable } from "./featureTable";
import { Stats } from "./stats";
import { Items } from "./items";
import { Header } from "./header";
import { Container, Form, FormGroup, Validators, FormArray } from "coles-solid-library";
import styles from './classes.module.scss';
import { CastingStat, Stat } from "../../../../../shared/models/stats";
import { DnDClass, ClassMetadata, LevelEntity, Subclass, ClassCasting } from "../../../../../models/class.model";
import { Choice, FeatureTypes } from "../../../../../models/core.model";
import { SpellsKnown } from "../../../../../shared/models/casting";
import { ArrayValidation, ValidatorResult } from "coles-solid-library/dist/components/Form/formHelp/models";
enum CasterType {
  None,
  Third,
  Half,
  Full
};

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
}

export const Classes: Component = () => {
  const defaultClassLevels: LevelEntity[] = Array.from({ length: 20 }, (_, i) => ({
    level: i + 1,
    features: [],
    spellcasting: undefined,
    info: {
      className: "",
      classLevel: i + 1,
      subclassName: '',
      level: i + 1,
      type: FeatureTypes.Class,
      other: ''
    },
    profBonus: 1 + Math.ceil((i + 1) / 4),
    classSpecific: {}
  }));

  const classLevels = new FormArray<LevelEntity[]>([[], []], defaultClassLevels);

  const ClassFormGroup = new FormGroup<ClassForm>({
    name: ['', [Validators.Required]],
    description: ['', [Validators.Required]],
    hitDie: [undefined, [Validators.Required]],
    primaryStat: [undefined, [Validators.Required]],
    savingThrows: [[], [Validators.Required]],
    armorProficiencies: [[], []],
    weaponProficiencies: [[], []],
    toolProficiencies: [[], []],
    armorStart: [[], []],
    weaponStart: [[], []],
    itemStart: [[], []],
    armorProfChoices: [[], []],
    weaponProfChoices: [[], []],
    toolProfChoices: [[], []],
    skills: [[], [Validators.Required]],
    skillChoiceNum: [undefined, []],
    skillChoices: [[], []],
    startingEquipment: [[], []],
    spellCasting: [false, []],
    castingStat: [undefined, []],
    casterType: [CasterType.None, []],
    classSpecificValues: [[], []],
    subclasses: [[], []],
    metadataSubclassLevels: [[], []],
    metadataSubclassName: ['', []],
    metadataSubclassPos: ['before', []],
    classLevels: classLevels,
    spellcastName: ['', []],
    spellsKnownCalc: [SpellsKnown.Number, []],
    spellcastAbility: [CastingStat.WIS, []],
    spellsKnownRoundup: [false, []],
    spellsInfo: ['', []],
    spellsLevel: [1, []]
  });

  const onSubmit = (data: ClassForm) => {
    console.log('Submitted: ', data);
  };

  return (
    <Container theme="surface" class={`${styles.container}`}>
      <Form data={ClassFormGroup} onSubmit={onSubmit}>
        <div class={`${styles.body}`}>
          <Header />
          <Stats />
          <Proficiencies formGroup={ClassFormGroup} />
          <Items formGroup={ClassFormGroup} />
          <FeatureTable formGroup={ClassFormGroup} />
        </div>
      </Form>
    </Container>
  );
};