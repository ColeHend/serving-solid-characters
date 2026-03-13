// Class

import { Background } from "../generated";


// Subclass


// Backgrounds

type HalfBackground = Omit<Background,"proficiencies"|"startEquipment"|"languages"|"features">

export interface BackgroundForm extends HalfBackground {
    langChoiceAmount: number;
    optionKey: string;
    PP: number;
    GP: number;
    EP: number;
    SP: number;
    CP: number;
}

// Race


// Subrace


// Spells


// Feats


// Items