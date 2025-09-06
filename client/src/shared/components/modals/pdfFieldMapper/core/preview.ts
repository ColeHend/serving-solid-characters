import { Character } from '../../../../../models/character.model';

// Build or reuse a character for preview purposes (was inline in hook)
export function buildPreviewCharacter(provided?: Character): Character {
  if (provided) return provided;
  const c = new Character();
  c.name = 'Aria Swiftwind';
  c.className = 'Rogue';
  c.subclass = 'Arcane Trickster';
  c.background = 'Urchin';
  c.alignment = 'CG';
  c.race.species = 'Elf'; c.race.subrace = 'High Elf'; c.race.age = '120';
  c.experience = 14000; c.levels = [
    { class: 'Rogue', level: 1, hitDie: 8, features: [], subclass: undefined },
    { class: 'Rogue', level: 2, hitDie: 8, features: [], subclass: undefined },
    { class: 'Rogue', level: 3, hitDie: 8, features: [], subclass: 'Arcane Trickster' },
    { class: 'Rogue', level: 4, hitDie: 8, features: [], subclass: 'Arcane Trickster' },
    { class: 'Rogue', level: 5, hitDie: 8, features: [], subclass: 'Arcane Trickster' }
  ];
  c.ac = 15; c.initiative = 3; c.speed = 30;
  // Cast to any to avoid needing full structure
  (c as any).proficiencies.skills = { stealth: { stat: 'dex', value: 7, proficient: true, expertise: true } };
  c.languages = ['Common','Elvish','Thieves\' Cant'];
  (c as any).health = { max: 33, current: 33, temp: 0, hitDie: { total: 5, die: 8, used: 0 } };
  (c as any).stats = { str:8,dex:18,con:12,int:14,wis:10,cha:13 };
  (c as any).items.inventory = ['Lockpicks','Grappling Hook'];
  (c as any).items.equipped = ['Rapier','Leather Armor'];
  (c as any).items.attuned = [];
  (c as any).spells = [ { name: 'Mage Hand', prepared: true }, { name: 'Shield', prepared: false } ];
  return c;
}

// Resolve a field key to a preview string (ported from hook)
export function resolvePreviewValue(key: string, ch: Character | undefined | null): string {
  if (!ch) return key;
  try {
  if (key === 'level') return String(ch.level);
  if (key === 'profiencyBonus') return String((ch as any).profiencyBonus);
  if (key === 'size') return String((ch as any).size || '');
    const parts = key.split('.');
    let cur: any = ch;
    for (const p of parts) { if (cur == null) break; cur = cur[p]; }
    if (cur == null || cur === '') return key;
    if (Array.isArray(cur)) {
      if (key === 'spells') return cur.map((s: any) => typeof s === 'string' ? s : s?.name).filter(Boolean).join(', ');
      if (key === 'levels') return cur.map((l: any) => l ? `${l.class}${l.level ? ' ' + l.level : ''}` : '').filter(Boolean).join(', ');
      if (key.startsWith('items.')) return cur.join(', ');
      return cur.join(', ');
    }
    if (typeof cur === 'object') return key; // Avoid noise for complex objects
    return String(cur);
  } catch { return key; }
}
