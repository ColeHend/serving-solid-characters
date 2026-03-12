// Class

import { Background } from "../generated";


// Subclass


// Backgrounds

type HalfBackground = Omit<Background,"proficiencies"|"startEquipment"|"languages"|"features">

export interface BackgroundForm extends HalfBackground {
    langChoiceAmount: number;
    optionKey: string;
}

// Race


// Subrace


// Spells


// Feats


// Items