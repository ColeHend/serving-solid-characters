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
  cantrips_known?: number;
  spell_slots_level_0?: number;
  spell_slots_level_1?: number;
  spell_slots_level_2?: number;
  spell_slots_level_3?: number;
  spell_slots_level_4?: number;
  spell_slots_level_5?: number;
  spell_slots_level_6?: number;
  spell_slots_level_7?: number;
  spell_slots_level_8?: number;
  spell_slots_level_9?: number;
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
  Full
};