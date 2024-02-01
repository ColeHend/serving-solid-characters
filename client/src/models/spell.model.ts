export interface Spell {
    name: string;
    description: string ;
    higher_levels: string ;
    range: string ;
    components: string;
    duration: string;
    casting_time: string;
    is_ritual: boolean;
    is_concentration: boolean;
    level: number;
    school: string;
    damage_type?: string;
    attack_type?: string;
    dc?: string;
    heal_at_slot_level?: string;
    area_of_effect?: string;
    classes: string[];
  }