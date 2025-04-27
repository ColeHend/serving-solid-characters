import { Feature } from "./core.model";

export interface Feat {
    name:    string;
    desc:    string[];
    preReqs: Feature<string, string>[];
}


