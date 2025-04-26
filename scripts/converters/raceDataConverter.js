import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Path to the races.json file - using absolute path for reliability
const racesJsonPath = '/home/coleh/Desktop/Projects/serving-solid-characters/data/srd/races.json';
const backupPath = '/home/coleh/Desktop/Projects/serving-solid-characters/data/srd/races.backup.json';

// Convert ability score string to enum
function mapAbilityScore(abilityName) {
  const abilityMap = {
    'STR': 0, // AbilityScores.STR
    'DEX': 1, // AbilityScores.DEX
    'CON': 2, // AbilityScores.CON
    'INT': 3, // AbilityScores.INT
    'WIS': 4, // AbilityScores.WIS
    'CHA': 5  // AbilityScores.CHA
  };

  return abilityName in abilityMap ? abilityMap[abilityName] : 6; // CHOICE = 6
}

// Convert to StatBonus format
function convertStatBonus(bonus) {
  return {
    stat: mapAbilityScore(bonus.Name),
    value: bonus.Value
  };
}

// Convert trait to Feat format
function convertTrait(trait) {
  return {
    details: {
      name: trait.Name,
      description: Array.isArray(trait.Value) ? trait.Value.join('\n') : trait.Value
    },
    prerequisites: []
  };
}

// Convert choice format
function convertChoiceDetail(choice) {
  if (!choice || choice.Choose === 0) return undefined;

  return {
    options: choice.Choices || [],
    amount: choice.Choose
  };
}

// Convert ability bonus choice format
function convertAbilityBonusChoice(choice) {
  if (!choice || choice.Choose === 0) return undefined;

  return {
    amount: choice.Choose,
    choices: (choice.Choices || []).map(convertStatBonus)
  };
}

// Convert trait choice format
function convertTraitChoice(choice) {
  if (!choice || choice.Choose === 0) return undefined;

  return {
    amount: choice.Choose,
    choices: (choice.Choices || []).map(convertTrait)
  };
}

// Convert a subrace to the new format
function convertSubrace(subrace, parentRaceId) {
  return {
    id: subrace.Id,
    name: subrace.Name,
    parentRace: parentRaceId,
    size: subrace.Size || 'Medium',
    speed: parseInt(subrace.Speed || '30'),
    languages: subrace.Languages || [],
    languageChoice: convertChoiceDetail(subrace.LanguageChoice),
    abilityBonuses: (subrace.AbilityBonuses || []).map(convertStatBonus),
    abilityBonusChoice: convertAbilityBonusChoice(subrace.AbilityBonusChoice),
    traits: (subrace.Traits || []).map(convertTrait),
    traitChoice: convertTraitChoice(subrace.TraitChoice),
    descriptions: {
      description: subrace.Desc || '',
      alignment: subrace.Alignment || '',
      age: subrace.Age || '',
      sizeDescription: subrace.SizeDescription || ''
    }
  };
}

// Convert a race to the new format
function convertRace(race) {
  return {
    id: race.Id,
    name: race.Name,
    size: race.Size,
    speed: parseInt(race.Speed),
    languages: race.Languages || [],
    languageChoice: convertChoiceDetail(race.LanguageChoice),
    abilityBonuses: (race.AbilityBonuses || []).map(convertStatBonus),
    abilityBonusChoice: convertAbilityBonusChoice(race.AbilityBonusChoice),
    traits: (race.Traits || []).map(convertTrait),
    traitChoice: convertTraitChoice(race.TraitChoice),
    descriptions: {
      alignment: race.Alignment || '',
      age: race.Age || '',
      sizeDescription: race.SizeDescription || '',
      languageDescription: race.LanguageDesc || ''
    }
  };
}

function convertRacesJson() {
  try {
    // Read the races.json file
    const racesData = fs.readFileSync(racesJsonPath, 'utf8');
    const races = JSON.parse(racesData);
    
    // Create a backup of the original file
    fs.writeFileSync(backupPath, racesData);
    console.log(`Backup created at ${backupPath}`);
    
    // Convert races to the new format
    const convertedRaces = [];
    const convertedSubraces = [];
    
    races.forEach(race => {
      // Convert the main race
      convertedRaces.push(convertRace(race));
      
      // Convert and collect subraces
      if (race.SubRaces && race.SubRaces.length > 0) {
        race.SubRaces.forEach(subrace => {
          convertedSubraces.push(convertSubrace(subrace, race.Id));
        });
      }
    });
    
    // Create the output structure
    const output = {
      races: convertedRaces,
      subraces: convertedSubraces
    };
    
    // Write the converted data back to races.json
    fs.writeFileSync(racesJsonPath, JSON.stringify(output, null, 2));
    console.log(`Conversion complete! Updated ${racesJsonPath}`);
  } catch (error) {
    console.error('Error converting races.json:', error);
  }
}

// Run the conversion
convertRacesJson();