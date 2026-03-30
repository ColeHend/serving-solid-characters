// Class

import { MadFeature } from "../../shared/customHooks/mads/madModels";
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


// features

export interface MadForm extends MadFeature {
    name: string;
    commandType: string;
    commandCategory: string;
}