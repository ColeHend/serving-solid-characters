import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the magic_items.json file
const magicItemsPath = path.resolve(__dirname, '../../../data/srd/2024/magic_items.json');
const backupPath = `${magicItemsPath}.backup-${new Date().toISOString().replace(/:/g, '-')}`;

// Backup the original file
function createBackup() {
  try {
    fs.copyFileSync(magicItemsPath, backupPath);
    console.log(`Backup created at: ${backupPath}`);
    return true;
  } catch (error) {
    console.error('Error creating backup:', error);
    return false;
  }
}

// Read and convert the JSON data
function convertMagicItems() {
  try {
    // Create backup first
    if (!createBackup()) {
      console.error('Failed to create backup. Aborting conversion.');
      return;
    }

    // Read the original file
    const jsonData = fs.readFileSync(magicItemsPath, 'utf8');
    const items = JSON.parse(jsonData);

    // Transform the data to match the MagicItem interface
    const convertedItems = items.map((item, index) => {
      // Extract weight from properties if available
      let weight = item.weight || '';
      if (!weight && item.properties.Weight) {
        weight = item.properties.Weight;
      }

      // Create a MagicItemProperties object
      const properties = {
        Attunement: item.properties.Attunement || undefined,
        Effect: item.properties.Effect || undefined,
        Charges: item.properties.Charges || undefined,
      };

      // Add other properties that might exist
      Object.entries(item.properties).forEach(([key, value]) => {
        if (!['Attunement', 'Effect', 'Charges', 'Weight'].includes(key)) {
          properties[key] = value;
        }
      });

      // Return the converted item
      return {
        id: index + 1, // Assign sequential IDs
        name: item.name,
        desc: item.description,
        rarity: item.rarity,
        cost: item.cost || '',
        category: item.category,
        weight: weight,
        properties
      };
    });

    // Write the converted data back to the file
    fs.writeFileSync(magicItemsPath, JSON.stringify(convertedItems, null, 2));
    console.log('Conversion completed successfully!');
    console.log(`Converted ${convertedItems.length} magic items.`);
  } catch (error) {
    console.error('Error during conversion:', error);
  }
}

// Run the conversion
convertMagicItems();