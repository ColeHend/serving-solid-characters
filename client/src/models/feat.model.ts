import { Feature } from "./core.model";

export interface Feat {
    Name:    string;
    Desc:    string[];
    PreReqs: Feature<string, string>[];
}


