const fs = require('fs');
const path = require('path');

// Constants for file paths
const SOURCE_FILE = path.resolve(__dirname, '../../data/srd/2024/races.json');
const BACKUP_FILE = path.resolve(__dirname, '../../data/srd/2024/races.json.bak');
const OUTPUT_FILE = path.resolve(__dirname, '../../data/srd/2024/races.json');

// AbilityScores enum from your project
const AbilityScores = {
    STR: 0,
    DEX: 1,
    CON: 2,
    INT: 3,
    WIS: 4,
    CHA: 5,
    CHOICE: 6,
    ALL: 7
};

// Helper function to convert trait descriptions to Feat objects
function traitsToFeats(traits) {
    return Object.entries(traits).map(([name, description]) => ({
        details: {
            name,
            description,
            metadata: extractMetadata(description)
        },
        prerequisites: [],
    }));
}

// Extract metadata from trait descriptions like uses, recharge, etc.
function extractMetadata(description) {
    const metadata = {};
    
    // Check for uses/recharge patterns
    if (description.includes('per Long Rest') || description.includes('after a Long Rest')) {
        metadata.recharge = 'long rest';
    }
    
    // Check for usage limits by proficiency bonus
    if (description.includes('equal to your proficiency bonus')) {
        metadata.uses = 'proficiency bonus';
    }
    
    // Check for spells granted
    const spellMatch = description.match(/\b(know|cast)\b.*\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\b/g);
    if (spellMatch) {
        metadata.spells = spellMatch.map(s => s.replace(/.*\b(know|cast)\b.*\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\b/g, '$2'));
    }
    
    return Object.keys(metadata).length > 0 ? metadata : undefined;
}

// Helper function to extract language choices
function parseLanguages(languagesArray) {
    const languages = [];
    let languageChoice = undefined;
    
    languagesArray.forEach(lang => {
        if (lang.includes('plus one') || lang.includes('of your choice')) {
            // This indicates a language choice
            languageChoice = {
                options: ["Any"],
                amount: 1
            };
        } else {
            languages.push(lang);
        }
    });
    
    return { languages, languageChoice };
}

// Helper function to extract ability bonuses from text
function parseAbilityBonuses(abilityText) {
    // Since the 2024 SRD has moved away from fixed racial bonuses,
    // and uses a more flexible system, we'll set up the ability bonus choice structure
    
    // Default empty ability bonuses array
    const abilityBonuses = [];
    
    // Create the ability bonus choice structure
    const abilityBonusChoice = {
        amount: 3,
        choices: [
            { stat: AbilityScores.STR, value: 1 },
            { stat: AbilityScores.DEX, value: 1 },
            { stat: AbilityScores.CON, value: 1 },
            { stat: AbilityScores.INT, value: 1 },
            { stat: AbilityScores.WIS, value: 1 },
            { stat: AbilityScores.CHA, value: 1 }
        ]
    };
    
    return { abilityBonuses, abilityBonusChoice };
}

// Main conversion function
function convertRacesToInterface(inputRaces) {
    return inputRaces.map((race, index) => {
        // Create a unique ID based on name
        const id = race.name.toLowerCase().replace(/\s+/g, '-');
        
        // Extract speed as a number
        const speedMatch = race.speed.match(/(\d+)/);
        const speed = speedMatch ? parseInt(speedMatch[1]) : 30;
        
        // Parse languages and language choices
        const { languages, languageChoice } = parseLanguages(race.languages);
        
        // Convert traits object to Feat array
        const traits = traitsToFeats(race.traits);
        
        // Check if there's a trait choice
        let traitChoice = undefined;
        if (race.name === "Elf" || race.name === "Gnome" || race.name === "Goliath" || race.name === "Tiefling") {
            // These races have lineage/ancestry choices that we should model as trait choices
            const choiceAmount = 1;
            traitChoice = {
                amount: choiceAmount,
                choices: traits.filter(t => 
                    t.details.name.includes("Lineage") || 
                    t.details.name.includes("Legacy") || 
                    t.details.name.includes("Ancestry"))
            };
            
            // Remove the trait choice from the regular traits array
            const traitChoiceName = traitChoice.choices[0]?.details.name;
            if (traitChoiceName) {
                const filteredTraits = traits.filter(t => t.details.name !== traitChoiceName);
                traits.length = 0;
                traits.push(...filteredTraits);
            }
        }
        
        // Parse ability score adjustments
        const { abilityBonuses, abilityBonusChoice } = parseAbilityBonuses(race.ability_score_adjustments);
        
        // Extract size (Medium or Small)
        let size = "Medium";
        if (race.size.toLowerCase().includes('small')) {
            size = "Small";
        } else if (race.size.toLowerCase().includes('medium or small')) {
            // For races that can be either Medium or Small (like Tiefling)
            size = "Medium"; // Default to Medium, but note the choice in descriptions
        }
        
        // Create race object matching interface
        const raceObj = {
            id,
            name: race.name,
            size,
            speed,
            languages,
            abilityBonuses,
            traits,
            descriptions: {
                physical: race.size,
                abilities: race.ability_score_adjustments
            }
        };
        
        // Add optional properties if they exist
        if (languageChoice) {
            raceObj.languageChoice = languageChoice;
        }
        
        if (abilityBonusChoice) {
            raceObj.abilityBonusChoice = abilityBonusChoice;
        }
        
        if (traitChoice) {
            raceObj.traitChoice = traitChoice;
        }
        
        return raceObj;
    });
}

// Main function to run the conversion
function main() {
    try {
        // Read the source file
        const rawData = fs.readFileSync(SOURCE_FILE, 'utf8');
        const races = JSON.parse(rawData);
        
        // Make a backup of the original file
        fs.copyFileSync(SOURCE_FILE, BACKUP_FILE);
        console.log(`Created backup at ${BACKUP_FILE}`);
        
        // Convert the data
        const convertedRaces = convertRacesToInterface(races);
        
        // Write the converted data
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(convertedRaces, null, 2));
        console.log(`Converted races written to ${OUTPUT_FILE}`);
        
    } catch (error) {
        console.error('Error converting races:', error);
    }
}

// Run the script
main();