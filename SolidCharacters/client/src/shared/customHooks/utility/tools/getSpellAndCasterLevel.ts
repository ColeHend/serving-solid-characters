import { CasterType, Class5E } from "../../../../models/generated";

// function getSpellAndCasterLevel(class5e: Class5E, stat: 'caster' | never,level: number): number
function getSpellAndCasterLevel(class5e: Class5E, stat: 'spell' | 'caster',level: number, rounddown?: Boolean): number {
    
  let Level: number = 0;
  const mod = stat === 'spell' ? 1 : 2
  switch(class5e.spellcasting?.metadata.casterType) {
    case CasterType.Full:
    Level = (level / 2) * mod
    rounddown = false;
    break;
    case CasterType.Half:
    Level = (level / 4) * mod
    break;
    case CasterType.Third:
    Level = (level / 6) * mod
    break;
    default:
    Level = -1;
  }
  return rounddown ? Math.floor(Level) : Math.ceil(Level);
}

export default getSpellAndCasterLevel;