// Shared constants & helpers for Background editor
// Keep simple data arrays separated from component logic for maintainability.

export const SKILLS = [
  'Acrobatics','Animal Handling','Arcana','Athletics','Deception','History','Insight','Intimidation','Investigation','Medicine','Nature','Perception','Performance','Persuasion','Religion','Sleight of Hand','Stealth','Survival'
];

export const TOOLS = [
  "Artisan's Tools","Smith's Tools","Brewer's Supplies","Calligrapher's Supplies","Carpenter's Tools","Cobbler's Tools","Cook's Utensils","Glassblower's Tools","Jeweler's Tools","Leatherworker's Tools","Mason's Tools","Painter's Supplies","Potter's Tools","Tinker's Tools","Weaver's Tools","Woodcarver's Tools","Disguise Kit","Forgery Kit","Gaming Set","Herbalism Kit","Musical Instrument","Navigator's Tools","Poisoner's Kit","Thieves' Tools","Vehicles (Land)","Vehicles (Water)"
];

export const ARMOR = ['Light Armor','Medium Armor','Heavy Armor','Shields'];

export const WEAPONS = [
  'Club','Dagger','Greatclub','Handaxe','Javelin','Light Hammer','Mace','Quarterstaff','Sickle','Spear','Light Crossbow','Dart','Shortbow','Sling','Battleaxe','Flail','Glaive','Greataxe','Greatsword','Halberd','Lance','Longsword','Maul','Morningstar','Pike','Rapier','Scimitar','Shortsword','Trident','War Pick','Warhammer','Whip','Blowgun','Hand Crossbow','Heavy Crossbow','Longbow','Net'
];

export const COMMON_ITEMS = [
  'Backpack','Bedroll','Rations (1 day)','Rope (50 feet)','Torch','Waterskin','Dagger','Shortsword','Quarterstaff','Spellbook','Holy Symbol','Thieves\' Tools','Grappling Hook','Crowbar','Hammer','Piton','Lantern','Oil (flask)','Ink (bottle)','Ink Pen','Parchment','Herbalism Kit'
];

// Derive candidate equipment items from existing backgrounds + static fallback list
export function candidateEquipmentItems(allBackgrounds: Record<string, any>): string[] {
  const map = new Set<string>();
  Object.values(allBackgrounds).forEach((b: any) => {
    (b?.startEquipment || []).forEach((g: any) => (g?.items || []).forEach((i: string) => map.add(i)));
  });
  COMMON_ITEMS.forEach(i => map.add(i));
  return Array.from(map).sort();
}
