// Class

import { Background } from "../generated";


// Subclass


// Backgrounds

type HalfBackground = Omit<Background,"proficiencies"|"startEquipment"|"languages"|"features">

export interface BackgroundForm extends HalfBackground {
    newName: string,
    langChoiceAmount: number
}

// Race


// Subrace


// Spells


// Feats


// Items