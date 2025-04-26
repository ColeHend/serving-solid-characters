const fs = require('fs');
const path = require('path');

// Path to the source JSON file
const sourcePath = path.resolve(__dirname, 'data/srd/2024/subclasses.json');
const backupPath = path.resolve(__dirname, 'data/srd/2024/subclasses.json.bak');

// Create a backup first
console.log('Creating backup...');
fs.copyFileSync(sourcePath, backupPath);
console.log(`Backup created at ${backupPath}`);

// Read the source JSON file
console.log('Reading source file...');
const sourceData = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));

// Convert the data
console.log('Converting data...');
const convertedData = sourceData.map(source => {
  // Convert features from source format to target format
  const features = {};
  
  // Process each level's features
  Object.entries(source.features).forEach(([level, levelFeatures]) => {
    const numericLevel = parseInt(level, 10);
    
    // Skip if level isn't a valid number
    if (isNaN(numericLevel)) return;
    
    // Convert the features for this level
    features[numericLevel] = levelFeatures.map(feature => ({
      name: feature.name,
      description: feature.description,
      // Optional fields are not provided in the source data
    }));
  });

  return {
    name: source.subclass,
    parent_class: source.class,
    description: `${source.subclass} subclass for ${source.class}`, // Add a generic description since none exists
    features: features,
    // No choices in the source data
  };
});

// Write the converted data back to the file
console.log('Writing converted data...');
fs.writeFileSync(sourcePath, JSON.stringify(convertedData, null, 2));
console.log('Conversion complete!');