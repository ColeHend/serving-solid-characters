export interface Spellcasting {
  metadata: SpellcastingMetadata;
  known_type: 'number' | 'calc';
  spells_known: Record<number, number> | SpellCalc;
  learned_spells: Record<number, string[]>;
}

export interface SpellcastingMetadata {
  slots: Record<number, Spellslots>;
  casterType: CasterType;
}

export interface Spellslots {
  cantripsKnown?: number;
  spellSlotsLevel1?: number;
  spellSlotsLevel_2?: number;
  spellSlotsLevel_3?: number;
  spellSlotsLevel_4?: number;
  spellSlotsLevel_5?: number;
  spellSlotsLevel_6?: number;
  spellSlotsLevel_7?: number;
  spellSlotsLevel_8?: number;
  spellSlotsLevel_9?: number;
};

export interface SpellCalc {
  stat: string;
  level: 'full' | 'half'
  roundUp?: boolean;
}

export enum CasterType {
  None,
  Third,
  Half,
  Full,
  Pact,
};