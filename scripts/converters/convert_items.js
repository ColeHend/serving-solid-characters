const fs = require('fs');
const path = require('path');

// Define file paths
const inputFilePath = path.join(__dirname, '../../data/srd/2024/items.json');
const backupFilePath = path.join(__dirname, '../../data/srd/2024/items.json.bak');
const outputFilePath = path.join(__dirname, '../../data/srd/2024/items.json');

// Enum mapping from the TypeScript interface
const ItemType = {
  Weapon: 0,
  Armor: 1,
  Tool: 2,
  Item: 3,
};

// Function to determine item type based on category
function getItemType(category) {
  if (category.includes('Weapon')) {
    return ItemType.Weapon;
  } else if (category.includes('Armor') || category.includes('Shield')) {
    return ItemType.Armor;
  } else if (category.includes('Tool')) {
    return ItemType.Tool;
  } else {
    return ItemType.Item;
  }
}

// Function to convert weight string to number
function parseWeight(weightStr) {
  if (!weightStr) return 0;
  
  const match = weightStr.match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : 0;
}

// Main conversion function
function convertItems() {
  try {
    // Read the original file
    const data = fs.readFileSync(inputFilePath, 'utf8');
    const items = JSON.parse(data);
    
    // Create a backup
    fs.writeFileSync(backupFilePath, data);
    console.log(`Created backup at ${backupFilePath}`);
    
    // Transform items to match the Item interface
    const convertedItems = items.map((item, index) => {
      return {
        id: index + 1, // Assign sequential IDs
        name: item.name,
        desc: item.description,
        type: getItemType(item.category),
        weight: parseWeight(item.weight),
        cost: item.cost || '',
        properties: item.properties || {}
      };
    });
    
    // Write the converted data back to the file
    fs.writeFileSync(outputFilePath, JSON.stringify(convertedItems, null, 2));
    console.log(`Successfully converted ${convertedItems.length} items to match the Item interface`);
    console.log(`Updated file saved to ${outputFilePath}`);
  } catch (error) {
    console.error('Error converting items:', error);
  }
}

// Run the conversion
convertItems();