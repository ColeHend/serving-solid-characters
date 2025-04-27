const fs = require('fs');
const path = require('path');

// Paths
const jsonPath = path.join(__dirname, '../../data/srd/2024/classes.json');
const backupPath = path.join(__dirname, '../../data/srd/2024/classes.json.bak');

// Read the original file
console.log('Reading classes.json...');
const rawData = fs.readFileSync(jsonPath, 'utf8');
const classes = JSON.parse(rawData);

// Create a backup
console.log('Creating backup at classes.json.bak...');
fs.writeFileSync(backupPath, rawData);

// Convert to the Class5E interface
console.log('Converting data to match Class5E interface...');
const convertedClasses = classes.map((cls, index) => {
  // Extract skill proficiencies from the string
  const skillProfString = cls.skill_proficiencies || '';
  let skills = [];
  
  // Handle different formats of skill proficiencies
  if (skillProfString.includes('Choose any')) {
    skills = ['Any']; // For classes like Bard that can choose any skills
  } else {
    const skillsMatch = skillProfString.match(/Choose \d+ from: (.*)/i);
    skills = skillsMatch ? skillsMatch[1].split(', ') : [];
  }
  
  // Parse weapons proficiencies
  const weaponProfs = cls.weapon_proficiencies ? cls.weapon_proficiencies.split(', ') : [];
  
  // Parse armor proficiencies
  const armorProfs = cls.armor_proficiencies ? cls.armor_proficiencies.split(', ') : [];
  
  // Parse tool proficiencies
  const toolProfs = cls.tool_proficiencies && cls.tool_proficiencies !== 'null' ? 
    cls.tool_proficiencies.split(', ') : 
    [];

  // Convert starting equipment
  const startingEquipment = [];
  if (cls.starting_equipment) {
    Object.entries(cls.starting_equipment).forEach(([key, value]) => {
      if (typeof value === 'string') {
        startingEquipment.push({
          optionKeys: [key],
          items: value.split(', ')
        });
      }
    });
  }

  // Convert features
  const features = {};
  if (cls.class_features) {
    Object.entries(cls.class_features).forEach(([level, levelFeatures]) => {
      features[parseInt(level)] = levelFeatures.map(feature => {
        // Create properly formatted feature detail
        const featureDetail = {
          name: feature.name,
          description: feature.description
        };
        
        // Add metadata for features with uses or recharges
        if (feature.name.includes('Rage') || 
            feature.name.includes('Channel Divinity') || 
            feature.name.includes('Wild Shape') ||
            feature.name.includes('Action Surge') ||
            feature.name.includes('Bardic Inspiration')) {
          
          featureDetail.metadata = {
            uses: getUsesForFeature(feature.name, cls.name),
            recharge: getRechargeForFeature(feature.name)
          };
        }
        
        return featureDetail;
      });
    });
  }

  // Check for class-specific resources
  const classSpecific = getClassSpecificResources(cls.name, cls.class_features);

  // Generate a unique ID (using index for now)
  const id = index + 1;

  // Extract choices (like Expertise for Bard/Rogue)
  const choices = getChoicesForClass(cls.name, cls.skill_proficiencies);

  // Convert to Class5E format
  return {
    id,
    name: cls.name,
    hit_die: cls.hit_die,
    primary_ability: cls.primary_abilities.join(', '),
    saving_throws: cls.saving_throws || [],
    starting_equipment: startingEquipment,
    proficiencies: {
      armor: armorProfs,
      weapons: weaponProfs,
      tools: toolProfs,
      skills: skills
    },
    features: features,
    // Add choices if present
    ...(Object.keys(choices).length > 0 && { choices }),
    // Add class-specific resources if present
    ...(Object.keys(classSpecific).length > 0 && { classSpecific }),
    // Add spellcasting if appropriate
    ...(isSpellcaster(cls.name) && {
      spellcasting: getSpellcastingForClass(cls.name)
    })
  };
});

// Helper to determine if a class is a spellcaster
function isSpellcaster(className) {
  return ['Bard', 'Cleric', 'Druid', 'Paladin', 'Ranger', 'Sorcerer', 'Warlock', 'Wizard'].includes(className);
}

// Helper function to get class-specific resources
function getClassSpecificResources(className, features) {
  const classSpecific = {};
  
  switch(className) {
    case 'Barbarian':
      classSpecific.rage = {};
      // Determine rage count at each level
      for (let i = 1; i <= 20; i++) {
        if (i <= 2) classSpecific.rage[i] = '2';
        else if (i <= 5) classSpecific.rage[i] = '3';
        else if (i <= 11) classSpecific.rage[i] = '4';
        else if (i <= 16) classSpecific.rage[i] = '5';
        else classSpecific.rage[i] = '6';
      }
      break;
    case 'Monk':
      classSpecific.ki = {};
      // Ki points equal monk level
      for (let i = 2; i <= 20; i++) {
        classSpecific.ki[i] = i.toString();
      }
      break;
    case 'Sorcerer':
      classSpecific.sorceryPoints = {};
      // Sorcery points start at level 2
      for (let i = 2; i <= 20; i++) {
        classSpecific.sorceryPoints[i] = i.toString();
      }
      break;
  }
  
  return classSpecific;
}

// Helper function to get feature uses
function getUsesForFeature(featureName, className) {
  if (featureName.includes('Rage')) return 2;
  if (featureName.includes('Channel Divinity')) return 1;
  if (featureName.includes('Wild Shape')) return 2;
  if (featureName.includes('Action Surge')) return 1;
  if (featureName.includes('Bardic Inspiration')) {
    // Uses equal to Charisma modifier, but we'll use 3 as a default
    return 3;
  }
  return 1; // default
}

// Helper function to get feature recharge method
function getRechargeForFeature(featureName) {
  if (featureName.includes('Rage')) return 'long';
  if (featureName.includes('Channel Divinity')) return 'short';
  if (featureName.includes('Wild Shape')) return 'short';
  if (featureName.includes('Action Surge')) return 'short';
  if (featureName.includes('Bardic Inspiration')) return 'long';
  return 'long'; // default
}

// Helper function to determine choices for a class
function getChoicesForClass(className, skillProf) {
  const choices = {};
  
  // Extract number of skills to choose
  const skillCount = skillProf.match(/Choose (\d+)/);
  const skillNumber = skillCount ? parseInt(skillCount[1]) : 0;
  
  if (skillNumber > 0) {
    choices.skills = {
      options: ['Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception', 
                'History', 'Insight', 'Intimidation', 'Investigation', 'Medicine', 
                'Nature', 'Perception', 'Performance', 'Persuasion', 'Religion', 
                'Sleight of Hand', 'Stealth', 'Survival'],
      amount: skillNumber
    };
  }
  
  // Class-specific choices
  switch(className) {
    case 'Bard':
    case 'Rogue':
      choices.expertise = {
        options: ['skills'],
        amount: 2
      };
      break;
    case 'Fighter':
      choices.fightingStyle = {
        options: ['Archery', 'Defense', 'Dueling', 'Great Weapon Fighting', 'Protection', 'Two-Weapon Fighting'],
        amount: 1
      };
      break;
  }
  
  return choices;
}

// Helper function to determine spellcasting for each class
function getSpellcastingForClass(className) {
  let casterType;
  let knownType = 'number';
  let spellsKnown = {};
  
  switch(className) {
    case 'Bard':
    case 'Sorcerer':
      casterType = 'Full';
      // Known spells for various levels
      spellsKnown = {
        1: 4, 2: 5, 3: 6, 4: 7, 5: 8, 6: 9, 7: 10, 8: 11, 9: 12, 10: 14,
        11: 15, 12: 15, 13: 16, 14: 18, 15: 19, 16: 19, 17: 20, 18: 22, 19: 22, 20: 22
      };
      break;
    case 'Warlock':
      casterType = 'Full'; // Special case, but treated as full for slots
      // Known spells for various levels
      spellsKnown = {
        1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 7: 8, 8: 9, 9: 10, 10: 10,
        11: 11, 12: 11, 13: 12, 14: 12, 15: 13, 16: 13, 17: 14, 18: 14, 19: 15, 20: 15
      };
      break;
    case 'Wizard':
      casterType = 'Full';
      knownType = 'calc';
      spellsKnown = {
        stat: 'INT',
        level: 'full',
        roundUp: false
      };
      break;
    case 'Paladin':
    case 'Ranger':
      casterType = 'Half';
      knownType = 'calc';
      spellsKnown = {
        stat: className === 'Paladin' ? 'CHA' : 'WIS',
        level: 'half',
        roundUp: true
      };
      break;
    case 'Cleric':
    case 'Druid':
      casterType = 'Full';
      knownType = 'calc';
      spellsKnown = {
        stat: 'WIS',
        level: 'full',
        roundUp: false
      };
      break;
    default:
      return null;
  }
  
  // Basic spellcasting object
  return {
    metadata: {
      casterType: getCasterTypeEnum(casterType),
      slots: buildSpellSlots(casterType, className)
    },
    known_type: knownType,
    spells_known: spellsKnown,
    learned_spells: {}
  };
}

// Map string caster type to enum
function getCasterTypeEnum(type) {
  switch(type) {
    case 'Full': return 3; // Full = 3 in CasterType enum
    case 'Half': return 2; // Half = 2 in CasterType enum
    case 'Third': return 1; // Third = 1 in CasterType enum
    default: return 0; // None = 0 in CasterType enum
  }
}

// Function to build spell slots based on caster type
function buildSpellSlots(casterType, className) {
  const slots = {};
  
  // Full caster spell slots
  if (casterType === 'Full') {
    slots[1] = { cantrips_known: 3, spell_slots_level_1: 2 };
    slots[2] = { cantrips_known: 3, spell_slots_level_1: 3 };
    slots[3] = { cantrips_known: 3, spell_slots_level_1: 4, spell_slots_level_2: 2 };
    slots[4] = { cantrips_known: 4, spell_slots_level_1: 4, spell_slots_level_2: 3 };
    slots[5] = { cantrips_known: 4, spell_slots_level_1: 4, spell_slots_level_2: 3, spell_slots_level_3: 2 };
    slots[6] = { cantrips_known: 4, spell_slots_level_1: 4, spell_slots_level_2: 3, spell_slots_level_3: 3 };
    slots[7] = { cantrips_known: 4, spell_slots_level_1: 4, spell_slots_level_2: 3, spell_slots_level_3: 3, spell_slots_level_4: 1 };
    slots[8] = { cantrips_known: 4, spell_slots_level_1: 4, spell_slots_level_2: 3, spell_slots_level_3: 3, spell_slots_level_4: 2 };
    slots[9] = { cantrips_known: 4, spell_slots_level_1: 4, spell_slots_level_2: 3, spell_slots_level_3: 3, spell_slots_level_4: 3, spell_slots_level_5: 1 };
    slots[10] = { cantrips_known: 5, spell_slots_level_1: 4, spell_slots_level_2: 3, spell_slots_level_3: 3, spell_slots_level_4: 3, spell_slots_level_5: 2 };
    slots[11] = { cantrips_known: 5, spell_slots_level_1: 4, spell_slots_level_2: 3, spell_slots_level_3: 3, spell_slots_level_4: 3, spell_slots_level_5: 2, spell_slots_level_6: 1 };
    slots[12] = { cantrips_known: 5, spell_slots_level_1: 4, spell_slots_level_2: 3, spell_slots_level_3: 3, spell_slots_level_4: 3, spell_slots_level_5: 2, spell_slots_level_6: 1 };
    slots[13] = { cantrips_known: 5, spell_slots_level_1: 4, spell_slots_level_2: 3, spell_slots_level_3: 3, spell_slots_level_4: 3, spell_slots_level_5: 2, spell_slots_level_6: 1, spell_slots_level_7: 1 };
    slots[14] = { cantrips_known: 5, spell_slots_level_1: 4, spell_slots_level_2: 3, spell_slots_level_3: 3, spell_slots_level_4: 3, spell_slots_level_5: 2, spell_slots_level_6: 1, spell_slots_level_7: 1 };
    slots[15] = { cantrips_known: 5, spell_slots_level_1: 4, spell_slots_level_2: 3, spell_slots_level_3: 3, spell_slots_level_4: 3, spell_slots_level_5: 2, spell_slots_level_6: 1, spell_slots_level_7: 1, spell_slots_level_8: 1 };
    slots[16] = { cantrips_known: 5, spell_slots_level_1: 4, spell_slots_level_2: 3, spell_slots_level_3: 3, spell_slots_level_4: 3, spell_slots_level_5: 2, spell_slots_level_6: 1, spell_slots_level_7: 1, spell_slots_level_8: 1 };
    slots[17] = { cantrips_known: 5, spell_slots_level_1: 4, spell_slots_level_2: 3, spell_slots_level_3: 3, spell_slots_level_4: 3, spell_slots_level_5: 2, spell_slots_level_6: 1, spell_slots_level_7: 1, spell_slots_level_8: 1, spell_slots_level_9: 1 };
    slots[18] = { cantrips_known: 5, spell_slots_level_1: 4, spell_slots_level_2: 3, spell_slots_level_3: 3, spell_slots_level_4: 3, spell_slots_level_5: 3, spell_slots_level_6: 1, spell_slots_level_7: 1, spell_slots_level_8: 1, spell_slots_level_9: 1 };
    slots[19] = { cantrips_known: 5, spell_slots_level_1: 4, spell_slots_level_2: 3, spell_slots_level_3: 3, spell_slots_level_4: 3, spell_slots_level_5: 3, spell_slots_level_6: 2, spell_slots_level_7: 1, spell_slots_level_8: 1, spell_slots_level_9: 1 };
    slots[20] = { cantrips_known: 5, spell_slots_level_1: 4, spell_slots_level_2: 3, spell_slots_level_3: 3, spell_slots_level_4: 3, spell_slots_level_5: 3, spell_slots_level_6: 2, spell_slots_level_7: 2, spell_slots_level_8: 1, spell_slots_level_9: 1 };
  } 
  else if (casterType === 'Half') {
    // Half casters don't get spells until level 2
    slots[1] = { cantrips_known: 0 };
    slots[2] = { cantrips_known: 2, spell_slots_level_1: 2 };
    slots[3] = { cantrips_known: 2, spell_slots_level_1: 3 };
    slots[4] = { cantrips_known: 2, spell_slots_level_1: 3 };
    slots[5] = { cantrips_known: 2, spell_slots_level_1: 4, spell_slots_level_2: 2 };
    slots[6] = { cantrips_known: 2, spell_slots_level_1: 4, spell_slots_level_2: 2 };
    slots[7] = { cantrips_known: 2, spell_slots_level_1: 4, spell_slots_level_2: 3 };
    slots[8] = { cantrips_known: 2, spell_slots_level_1: 4, spell_slots_level_2: 3 };
    slots[9] = { cantrips_known: 2, spell_slots_level_1: 4, spell_slots_level_2: 3, spell_slots_level_3: 2 };
    slots[10] = { cantrips_known: 3, spell_slots_level_1: 4, spell_slots_level_2: 3, spell_slots_level_3: 2 };
    slots[11] = { cantrips_known: 3, spell_slots_level_1: 4, spell_slots_level_2: 3, spell_slots_level_3: 3 };
    slots[12] = { cantrips_known: 3, spell_slots_level_1: 4, spell_slots_level_2: 3, spell_slots_level_3: 3 };
    slots[13] = { cantrips_known: 3, spell_slots_level_1: 4, spell_slots_level_2: 3, spell_slots_level_3: 3, spell_slots_level_4: 1 };
    slots[14] = { cantrips_known: 3, spell_slots_level_1: 4, spell_slots_level_2: 3, spell_slots_level_3: 3, spell_slots_level_4: 1 };
    slots[15] = { cantrips_known: 3, spell_slots_level_1: 4, spell_slots_level_2: 3, spell_slots_level_3: 3, spell_slots_level_4: 2 };
    slots[16] = { cantrips_known: 3, spell_slots_level_1: 4, spell_slots_level_2: 3, spell_slots_level_3: 3, spell_slots_level_4: 2 };
    slots[17] = { cantrips_known: 3, spell_slots_level_1: 4, spell_slots_level_2: 3, spell_slots_level_3: 3, spell_slots_level_4: 3, spell_slots_level_5: 1 };
    slots[18] = { cantrips_known: 3, spell_slots_level_1: 4, spell_slots_level_2: 3, spell_slots_level_3: 3, spell_slots_level_4: 3, spell_slots_level_5: 1 };
    slots[19] = { cantrips_known: 3, spell_slots_level_1: 4, spell_slots_level_2: 3, spell_slots_level_3: 3, spell_slots_level_4: 3, spell_slots_level_5: 2 };
    slots[20] = { cantrips_known: 3, spell_slots_level_1: 4, spell_slots_level_2: 3, spell_slots_level_3: 3, spell_slots_level_4: 3, spell_slots_level_5: 2 };
  }
  
  // Special case for Warlock
  if (casterType === 'Full' && className === 'Warlock') {
    // Warlocks have a different spell slot progression
    // This is a simplified version, actual implementation would need more detail
    slots[1] = { cantrips_known: 2, spell_slots_level_1: 1 };
    slots[2] = { cantrips_known: 2, spell_slots_level_1: 2 };
    slots[3] = { cantrips_known: 2, spell_slots_level_2: 2 };
    slots[4] = { cantrips_known: 3, spell_slots_level_2: 2 };
    slots[5] = { cantrips_known: 3, spell_slots_level_3: 2 };
    slots[6] = { cantrips_known: 3, spell_slots_level_3: 2 };
    slots[7] = { cantrips_known: 3, spell_slots_level_4: 2 };
    slots[8] = { cantrips_known: 3, spell_slots_level_4: 2 };
    slots[9] = { cantrips_known: 3, spell_slots_level_5: 2 };
    slots[10] = { cantrips_known: 4, spell_slots_level_5: 2 };
    slots[11] = { cantrips_known: 4, spell_slots_level_5: 3, spell_slots_level_6: 1 };
    slots[12] = { cantrips_known: 4, spell_slots_level_5: 3, spell_slots_level_6: 1 };
    slots[13] = { cantrips_known: 4, spell_slots_level_5: 3, spell_slots_level_7: 1 };
    slots[14] = { cantrips_known: 4, spell_slots_level_5: 3, spell_slots_level_7: 1 };
    slots[15] = { cantrips_known: 4, spell_slots_level_5: 3, spell_slots_level_8: 1 };
    slots[16] = { cantrips_known: 4, spell_slots_level_5: 3, spell_slots_level_8: 1 };
    slots[17] = { cantrips_known: 4, spell_slots_level_5: 4, spell_slots_level_9: 1 };
    slots[18] = { cantrips_known: 4, spell_slots_level_5: 4, spell_slots_level_9: 1 };
    slots[19] = { cantrips_known: 4, spell_slots_level_5: 4, spell_slots_level_9: 1 };
    slots[20] = { cantrips_known: 4, spell_slots_level_5: 4, spell_slots_level_9: 1 };
  }
  
  return slots;
}

// Write the converted data
console.log('Writing converted data to classes.json...');
fs.writeFileSync(jsonPath, JSON.stringify(convertedClasses, null, 2));

console.log('Conversion complete! Backup saved at classes.json.bak');