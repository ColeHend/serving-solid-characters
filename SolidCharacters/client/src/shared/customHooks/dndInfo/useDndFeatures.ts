import { useDnDBackgrounds } from "./info/all/backgrounds"
import { useDnDClasses } from "./info/all/classes";
import { useDnDFeats } from "./info/all/feats";
import { useDnDRaces } from "./info/all/races";
import { useDnDSubraces } from "./info/all/subraces";
import { useDnDSubclasses } from "./info/all/subclasses";
import { createSignal } from "solid-js";
import { FeatureDetail } from "../../../models/data";
import { DebugConsole } from "../DebugConsole";

const backgrounds = useDnDBackgrounds();
const classes = useDnDClasses();
const feats = useDnDFeats();
const races = useDnDRaces();
const subraces = useDnDSubraces();
const subclasses = useDnDSubclasses();

const [allFeatures, setAllFeatures] = createSignal<FeatureDetail[]>([]);

export const useDndFeature = () => {
    const bgFeatures = backgrounds().flatMap(x => x.features ?? []);
    const classFeatures = classes().flatMap(x => {
        const features: FeatureDetail[] = [];

        for (let i = 1; i <= 20; i++) {
            if (x.features) {
               x.features[i].forEach(feature => features.push(feature as FeatureDetail));
            } else {               
                DebugConsole.warn(`Class ${x.name} has no features defined for level ${i}`);
            }
        }

        return features;
    }) ;
    const subclassFeatures: FeatureDetail[] = subclasses().flatMap(x => {
        const features: FeatureDetail[] = [];

        for (let i = 1; i <= 20; i++) {
            if (x.features) {
               x.features[i].forEach(feature => features.push(feature as FeatureDetail));
            } else {               
                DebugConsole.warn(`Subclass ${x.name} has no features defined for level ${i}`);
            }
        }

        return features;
    }) as FeatureDetail[];
    const featFeatures = feats().flatMap(x => x.details);
    const raceFeatures = races().flatMap(x => x.traits.flatMap(y => y.details));
    const subracesFeatures = subraces().flatMap(x => x.traits.flatMap(x => x.details));

    const all: FeatureDetail[] = [
        ...bgFeatures as FeatureDetail[],
        ...classFeatures as FeatureDetail[],
        ...subclassFeatures as FeatureDetail[],
        ...featFeatures as FeatureDetail[],
        ...raceFeatures as FeatureDetail[],
        ...subracesFeatures as FeatureDetail[]
    ]

    setAllFeatures(all);

    return {
        allFeatures, setAllFeatures
    }
}