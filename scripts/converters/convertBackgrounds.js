const fs = require('fs');
const path = require('path');

// Define the file paths
const srcFile = path.join(__dirname, '..', 'data', 'srd', '2024', 'backgrounds.json');
const backupFile = path.join(__dirname, '..', 'data', 'srd', '2024', 'backgrounds.json.bak');
const outputFile = srcFile; // We'll overwrite the original file after backup

// Read the source JSON file
console.log('Reading backgrounds.json...');
const backgroundsData = JSON.parse(fs.readFileSync(srcFile, 'utf8'));

// Create a backup of the original file
console.log('Creating backup at backgrounds.json.bak...');
fs.copyFileSync(srcFile, backupFile);

// Convert the data to match the Background interface
const convertedBackgrounds = backgroundsData.map(bg => {
  // Create the proficiencies object
  const proficiencies = {
    armor: [],
    weapons: [],
    tools: bg.toolProficiency ? [bg.toolProficiency] : [],
    skills: bg.skillProficiencies || []
  };

  // Convert equipment options
  const startEquipment = [];
  if (bg.equipmentOptions) {
    if (bg.equipmentOptions.A) {
      startEquipment.push({
        optionKeys: ['A'],
        items: bg.equipmentOptions.A
      });
    }
    
    if (bg.equipmentOptions.B) {
      startEquipment.push({
        optionKeys: ['B'],
        items: [bg.equipmentOptions.B]
      });
    }
  }

  // Create the converted background object
  return {
    name: bg.backgroundName,
    desc: `${bg.backgroundName} background from the 2024 SRD`, // Adding a default description
    proficiencies,
    startEquipment,
    abilityOptions: bg.abilityScoreOptions,
    feat: bg.feat,
    // Adding an empty features array since it's optional in the interface
    features: []
  };
});

// Write the converted data back to the original file
console.log('Writing converted data back to backgrounds.json...');
fs.writeFileSync(outputFile, JSON.stringify(convertedBackgrounds, null, 2));

console.log('Conversion complete! Backup saved at backgrounds.json.bak');