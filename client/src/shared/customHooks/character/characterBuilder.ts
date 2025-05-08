import { Class5E, FeatureOption, Race } from "../../../models/data";
import { Item, ItemType } from "../../../models/data/items";
import { Stat } from "../../models/stats";
import { applyModifier } from "./buildCharacter";
import { Character, CharacterHP } from "./character.model";

export class CharacterBuilder {
  private character: Character;
  private stats: Record<keyof Character['stats'], number> = {
    STR: 10,
    DEX: 10,
    CON: 10,
    INT: 10,
    WIS: 10,
    CHA: 10
  };
  private int_race?: Race;
  constructor(private charStats?: Record<keyof Character['stats'], number>) {
    if (charStats) {
      this.stats = charStats;
    }
    this.character = {} as Character;
    this.recalcDerivedStats();
  }
  public loadCharacter(character: Character, race?: Race) {
    this.character = character;
    this.stats = {
      STR: character.stats.STR.base,
      DEX: character.stats.DEX.base,
      CON: character.stats.CON.base,
      INT: character.stats.INT.base,
      WIS: character.stats.WIS.base,
      CHA: character.stats.CHA.base
    }
    this.int_race = race;
  }

  public Build(): Character {
    this.character.stats = {
      STR: { base: this.stats.STR, mod: 0, total: 0 },
      DEX: { base: this.stats.DEX, mod: 0, total: 0 },
      CON: { base: this.stats.CON, mod: 0, total: 0 },
      INT: { base: this.stats.INT, mod: 0, total: 0 },
      WIS: { base: this.stats.WIS, mod: 0, total: 0 },
      CHA: { base: this.stats.CHA, mod: 0, total: 0 }
    };
    this.character.saves = {
      STR: 0,
      DEX: 0,
      CON: 0,
      INT: 0,
      WIS: 0,
      CHA: 0
    };
    this.recalcDerivedStats();
    for (const featur of this.character.features) {
      if (featur.modifiers) {
        for (const modifier of featur.modifiers) {
          applyModifier(this.character, modifier);
        }
      }
    }
    if (this.character.equip.weapons) {
      for (const weapo of this.character.equip.weapons) {
        if (weapo.properties.modifiers) {
          for (const modifier of weapo.properties.modifiers) {
            applyModifier(this.character, modifier);
          }
        }
      }
    }
    if (this.character.equip.armor) {
      if (this.character.equip.armor.properties.modifiers) {
        for (const modifier of this.character.equip.armor.properties.modifiers) {
          applyModifier(this.character, modifier);
        }
      }
    }
    if (this.character.equip.shield) {
      if (this.character.equip.shield.properties.modifiers) {
        for (const modifier of this.character.equip.shield.properties.modifiers) {
          applyModifier(this.character, modifier);
        }
      }
    }
    if (this.character.equip.tools) {
      for (const tool of this.character.equip.tools) {
        if (tool.properties.modifiers) {
          for (const modifier of tool.properties.modifiers) {
            applyModifier(this.character, modifier);
          }
        }
      }
    }
    return this.character;
  }
  public changeStat(stat: keyof Character['stats'], value: number) {
    this.stats[stat] = value;
    this.recalcDerivedStats();
  }

  public get race() {
    return {
      changeRace: this.changeRace.bind(this),
    };
  }

  public get features() {
    return {
      addFeature: this.addFeature.bind(this),
      removeFeature: this.removeFeature.bind(this),
    };
  }

  public get class() {
    return {
      addClass: this.addClass.bind(this),
    };
  }

  public equipItem(item: Item) {
    if (this.isEquip(item)) {
      this.unequipItem(item);
    } else {
      this.applyEquipItem(item);
    }
  }
  // --- Race
  private changeRace(race: Race) {
    this.int_race = race;
    this.character.move.total = this.int_race.speed;
    this.character.proficiencies ??= {} as Character["proficiencies"];
    this.character.proficiencies.languages.push(...this.int_race.languages);
  }

  private applyRaceStats() {
    if (this.int_race) {
      for (const StatBonus of this.int_race.abilityBonuses) {
        const stat = Stat[StatBonus.stat] as keyof Character['stats'];
        const bonus = StatBonus.value;
        this.character.stats[stat].total ??= this.character.stats[stat].base;
        this.character.stats[stat].total += bonus;
        this.character.stats[stat].mod = Math.floor((this.character.stats[stat].total - 10) / 2);
      }
      const toApply = this.character.metadata?.selected.race.statBonuses ?? [];
      for (const StatBonus of toApply) {
        const stat = Stat[StatBonus.stat] as keyof Character['stats'];
        const bonus = StatBonus.value;
        this.character.stats[stat].total ??= this.character.stats[stat].base;
        this.character.stats[stat].total += bonus;
        this.character.stats[stat].mod = Math.floor((this.character.stats[stat].total - 10) / 2);
      }
    }
  }
  // --- features
  private addFeature(feature: FeatureOption) {
    this.character.features ??= [];
    this.character.features.push(feature);
    if (feature.modifiers) {
      for (const modifier of feature.modifiers) {
        applyModifier(this.character, modifier);
      }
    }
    if (feature.grantedSpells) {
      this.character.spellcasting ??= {} as Character["spellcasting"];
      this.character.spellcasting!.spells_known ??= [];
      for (const spell of feature.grantedSpells) {
        this.character.spellcasting!.spells_known.push(spell.spellName);
      }
    }
  }
  private removeFeature(feature: FeatureOption) {
    this.character.features = this.character.features.filter(f => f.name !== feature.name);
    if (feature.grantedSpells && feature.grantedSpells.length > 0) {
      const spellsToRemove = feature.grantedSpells.map(gs => gs.spellName);
      this.character.spellcasting!.spells_known = this.character.spellcasting!.spells_known.filter(spell => !spellsToRemove.includes(spell));
    }
  }
  // --- class
  private addClass(newClass: Class5E, items?: Item[]) {
    const isFirstClass = this.character.classes.length === 0;
    if (isFirstClass) {
      this.character.level = 1;
      this.character.pb = 2;
      this.character.hp ??= {} as CharacterHP;
      this.character.hp.max = +newClass.hit_die.replace(/d/, "");
      this.character.hp.current = +newClass.hit_die.replace(/d/, "");
      this.character.hp.temp = 0;
      this.character.hp.deathSaves.success = 0;
      this.character.hp.deathSaves.failure = 0;
      this.character.classes ??= [];
      this.character.classes.push(newClass.name);
      const startItems = newClass.starting_equipment
        .filter((it) => !!it.items)
        .flatMap((it) => it?.items ?? [])
        .map((it) => {
          const hasMultiple = it?.match(/^\d+/);
          if (hasMultiple) {
            const num = parseInt(hasMultiple[0]);
            const itemName = it?.replace(/^\d+\s+/, "");
            return Array.from({ length: num }, () => itemName);
          }
          return it;
        })
        .flat()
        .map((it) => {
          const item = items?.find((i) => i.name === it);
          if (item) {
            return item;
          }
        })
        .filter((it) => !!it);

        this.character.items ??= [];
        this.character.items.push(...startItems);

      this.character.proficiencies.saves = newClass.saving_throws;
      this.character.proficiencies ??= {} as Character["proficiencies"];
      this.character.proficiencies.armor.push(...newClass.proficiencies.armor);
      this.character.proficiencies.weapons.push(...newClass.proficiencies.weapons);
      this.character.proficiencies.tools.push(...newClass.proficiencies.tools);
    } else {
      this.character.level += 1;
      this.character.pb = Math.floor((this.character.level - 1) / 4) + 2;
      this.character.classes.push(newClass.name);
      this.character.proficiencies.armor.push(...newClass.proficiencies.armor);
      this.character.proficiencies.weapons.push(...newClass.proficiencies.weapons);
      this.character.proficiencies.tools.push(...newClass.proficiencies.tools);
    }
  }
  // --- stats
  private recalcDerivedStats() {
    this.character.stats.STR.base = this.stats.STR;
    this.character.stats.STR.mod = Math.floor((this.stats.STR - 10) / 2);
    this.character.stats.DEX.base = this.stats.DEX;
    this.character.stats.DEX.mod = Math.floor((this.stats.DEX - 10) / 2);
    this.character.stats.CON.base = this.stats.CON;
    this.character.stats.CON.mod = Math.floor((this.stats.CON - 10) / 2);
    this.character.stats.INT.base = this.stats.INT;
    this.character.stats.INT.mod = Math.floor((this.stats.INT - 10) / 2);
    this.character.stats.WIS.base = this.stats.WIS;
    this.character.stats.WIS.mod = Math.floor((this.stats.WIS - 10) / 2);
    this.character.stats.CHA.base = this.stats.CHA;
    this.character.stats.CHA.mod = Math.floor((this.stats.CHA - 10) / 2);
    this.applyRaceStats();
    const pb = Math.floor((this.character.level - 1) / 4) + 2;
    this.character.pb = pb;
    const stats = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as Array<keyof Character['stats']>;
    for (const stat of stats) {
      const isProficient = this.character.proficiencies.saves.some((s) => s.toLowerCase().includes(stat.toLowerCase()));
      const statValue = this.character.stats[stat].mod + (isProficient ? pb : 0);
      this.character.saves[stat] = statValue;
    }
  }
  // --- equip
  private applyEquipItem(item: Item) {
    const isHomebrew = Array.isArray(item.properties.modifiers);
    if (isHomebrew) {
      for (const modifier of item.properties.modifiers!) {
        applyModifier(this.character, modifier);
      }
    }
    switch (item.type) {
      case ItemType.Weapon:
        // Apply weapon properties to character
        this.character.equip.weapons ??= [];
        this.character.equip.weapons.push(item);
        break;
      case ItemType.Armor:
        // Apply armor properties to character
        if (item.name === "Shield") {
          this.character.ac += 2;
          this.character.equip.shield = item;
        } else {
          const acBreakdown = this.breakdownACstring(item?.properties?.AC ?? '');
          if (acBreakdown.baseAC !== -1) {
            this.character.ac = acBreakdown.baseAC;
            if (acBreakdown.maxDex !== -1) {
              const dexBonus = Math.min(this.character.stats.DEX.mod, acBreakdown.maxDex);
              this.character.ac += dexBonus;
            }
          }
          if (item.properties.Stealth) {
            const stealthProp = item.properties.Stealth.toLowerCase();
            const hasDisadvantage = !stealthProp.includes("no disadvantage") && !stealthProp.includes("normal");
            this.character.skills["stealth"].disadvantage = hasDisadvantage;
          }
          const strengthReq = item.properties.StrengthReq?.toLowerCase();
          if (!(strengthReq === "none" || strengthReq === "0")) {
            const strengthReqNumOnly = strengthReq?.replace(/[^0-9]/g, "");
            if (strengthReqNumOnly) {
              const strengthReqNum = parseInt(strengthReqNumOnly);
              if (this.character.stats.STR.base < strengthReqNum) {
                this.character.move.total -= 5; // or some other penalty
              }
            }
          }
          this.character.equip.armor = item;
        }
        break;
      case ItemType.Tool:
        // Apply tool properties to character
        this.character.equip.tools ??= [];
        this.character.equip.tools.push(item);
        break;
      default:
        // Apply item properties to character
        this.character.equip.items ??= [];
        this.character.equip.items.push(item);
        break;
    }
  };

  private breakdownACstring(acString: string) {
    // Example: "14 + Dex modifier (max 2)" or "16" or "11 + Dex modifier"

    const parts = acString.split("+");
    if (parts.length === 1) {
      // No modifier, just a number
      return { baseAC: parseInt(parts[0].trim()), maxDex: 0 };

    } else if (parts.length === 2) {
      const baseAC = parseInt(parts[0].trim());
      if (parts[1].includes("max")) {
        const dexMax = parseInt(parts[1].match(/max (\d+)/)?.[1] || "0");
        return { baseAC, maxDex: dexMax };
      }
    }
    return { baseAC: -1, maxDex: -1 };
  }

  private isEquip(item: Item) {
    // Check if the item is already equipped
    let isEquipped = false;
    if (item.type === ItemType.Weapon) {
      isEquipped = this.character.equip.weapons?.some(i => i.name === item.name) ?? false;
    } else if (item.type === ItemType.Armor) {
      isEquipped = this.character.equip.armor?.name === item.name || this.character.equip.shield?.name === item.name;
    } else if (item.type === ItemType.Tool) {
      isEquipped = this.character.equip.tools?.some(i => i.name === item.name) ?? false;
    } else {
      isEquipped = this.character.equip.items?.some(i => i.name === item.name) ?? false;
    }
    return isEquipped;
  }

  private unequipItem(item: Item) {
    // Remove item from character's equipment
    if (item.type === ItemType.Weapon) {
      this.character.equip.weapons = this.character.equip.weapons?.filter(i => i.name !== item.name);
    } else if (item.type === ItemType.Armor) {
      if (this.character.equip.shield?.name === item.name) {
        this.character.ac -= 2;
        this.character.equip.shield = undefined;
      } else {
        const acBreakdown = this.breakdownACstring(item?.properties?.AC ?? '');
        if (acBreakdown.baseAC !== -1) {
          this.character.ac = acBreakdown.baseAC;
          if (acBreakdown.maxDex !== -1) {
            const dexBonus = Math.min(this.character.stats.DEX.mod, acBreakdown.maxDex);
            this.character.ac -= dexBonus;
          }
        }
        this.character.equip.armor = undefined;
        this.character.ac = 10 + this.character.stats.DEX.mod;
      }
    } else if (item.type === ItemType.Tool) {
      this.character.equip.tools = this.character.equip.tools?.filter(i => i.name !== item.name);
    } else {
      this.character.equip.items = this.character.equip.items?.filter(i => i.name !== item.name);
    }
  }
}

const bob = new CharacterBuilder();