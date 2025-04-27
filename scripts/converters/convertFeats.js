const fs = require('fs');
const path = require('path');

// Enum definitions matching your TypeScript enums
const PrerequisiteType = {
  String: 0,
  Level: 1,
  Class: 2,
  Subclass: 3,
  Feat: 4,
  Race: 5,
  Item: 6,
  Stat: 7
};

// Path to the feats.json file
const featsFilePath = path.join(__dirname, 'data', 'srd', '2024', 'feats.json');
const backupFilePath = path.join(__dirname, 'data', 'srd', '2024', 'backups', 'feats.json.bak');

// Check if backup already exists, if not create one
if (!fs.existsSync(backupFilePath)) {
  console.log('Creating backup of original feats.json file...');
  fs.copyFileSync(featsFilePath, backupFilePath);
  console.log('Backup created at:', backupFilePath);
} else {
  console.log('Backup already exists at:', backupFilePath);
}

// Read the original JSON file
console.log('Reading original feats.json file...');
const featsData = JSON.parse(fs.readFileSync(featsFilePath, 'utf8'));

// Parse prerequisites function
function parsePrerequisites(prerequisitesString) {
  if (!prerequisitesString) return [];
  
  const prerequisites = [];
  const parts = prerequisitesString.split(',').map(part => part.trim());
  
  for (const part of parts) {
    if (part.includes('Level')) {
      // Level prerequisite
      const level = parseInt(part.match(/\d+/)[0]);
      prerequisites.push({
        type: PrerequisiteType.Level,
        value: level.toString()
      });
    } else if (part.includes('Strength') || part.includes('Dexterity') || 
               part.includes('Constitution') || part.includes('Intelligence') || 
               part.includes('Wisdom') || part.includes('Charisma')) {
      // Ability score prerequisite
      const statMatch = part.match(/(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)\s+(\d+)\+/);
      if (statMatch) {
        const stat = statMatch[1].substring(0, 3).toUpperCase(); // Get first 3 letters and uppercase (STR, DEX, etc.)
        const value = statMatch[2];
        prerequisites.push({
          type: PrerequisiteType.Stat,
          value: `${stat}:${value}`
        });
      }
    } else if (part.includes('Fighting Style')) {
      // Feature prerequisite
      prerequisites.push({
        type: PrerequisiteType.String,
        value: "Fighting Style feature"
      });
    } else if (part.includes('Spellcasting')) {
      // Spellcasting prerequisite
      prerequisites.push({
        type: PrerequisiteType.String,
        value: "Spellcasting feature"
      });
    } else {
      // Generic string prerequisite
      prerequisites.push({
        type: PrerequisiteType.String,
        value: part
      });
    }
  }
  
  return prerequisites;
}

// Convert the feats data to match the Feat interface
console.log('Converting feats data to match Feat interface...');
const convertedFeats = featsData.map(feat => {
  // Fix descriptions that have stray characters
  let cleanDescription = feat.description
    .replace(/】/g, '') // Remove stray Unicode character
    .replace(/attac】/g, 'attack') // Fix specific word with stray character
    .replace(/choic】/g, 'choice') // Fix specific word with stray character
    .replace(/way】/g, 'way') // Fix specific word with stray character
    .replace(/technique】/g, 'technique') // Fix specific word with stray character
    .replace(/powe】/g, 'power') // Fix specific word with stray character
    .replace(/freel】/g, 'freely') // Fix specific word with stray character
    .replace(/shadow】/g, 'shadows') // Fix specific word with stray character
    .replace(/illusion】/g, 'illusions') // Fix specific word with stray character
    .replace(/unmatche】/g, 'unmatched') // Fix specific word with stray character
    .replace(/ey】/g, 'eye') // Fix specific word with stray character
    .replace(/il】/g, 'ill'); // Fix specific word with stray character

  return {
    details: {
      name: feat.name,
      description: cleanDescription,
      metadata: {
        category: feat.category
      }
    },
    prerequisites: parsePrerequisites(feat.prerequisites)
  };
});

// Write the converted data back to the original file
console.log('Writing converted data back to feats.json...');
fs.writeFileSync(
  featsFilePath, 
  JSON.stringify(convertedFeats, null, 2), 
  'utf8'
);

console.log('Conversion complete! Original data is backed up at:', backupFilePath);