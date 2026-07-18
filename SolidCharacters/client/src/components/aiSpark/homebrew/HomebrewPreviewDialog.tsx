import { Accessor, Component, Match, Setter, Switch } from "solid-js";
import { Background, Class5E, Feat, Race, Spell, Subclass } from "../../../models/generated";
import { srdItem } from "../../../models/data/generated";
import SpellModal from "../../../shared/components/modals/spellModal/spellModal.component";
import RaceView from "../../../shared/components/modals/raceView/raceView";
import FeatView from "../../../shared/components/modals/featModal/featView";
import BackgroundView from "../../../shared/components/modals/background/backgrondView";
import { ItemPopup } from "../../../shared/components/modals/ItemModal/ItemModal";
import ClassModal from "../../../shared/components/modals/classModal/classModal.component";
import SubclassView from "../../../shared/components/modals/subclassView/subclassView";
import { HomebrewPreview } from "../aiSpark.shared";
import { markHomebrew } from "../../../shared/customHooks/dndInfo/info/provenance";

/**
 * Opens a detail dialog for a generated (not-yet-saved) homebrew entity. Most kinds reuse the
 * same dialog the Info tab uses; the per-kind type narrowing of `preview.entity` lives here so
 * the card stays clean. `magic_item` reuses `ItemPopup` since it's structurally compatible
 * (name/desc/cost/weight/properties), and `subclass` uses the dedicated `SubclassView`.
 */
const HomebrewPreviewDialog: Component<{
    preview: HomebrewPreview;
    show: [Accessor<boolean>, Setter<boolean>];
}> = (props) => {
    // A generated preview IS homebrew by construction, but it's unsaved (not in any
    // homebrewManager store) and unmarked (never passed through the aggregators), so
    // sourceLabel would fall through to the SRD default — mark a display-only copy.
    const e = () => markHomebrew([props.preview.entity])[0];
    return (
        <Switch>
            <Match when={props.preview.kind === "spell"}>
                <SpellModal spell={() => e() as Spell} backgroundClick={props.show} />
            </Match>
            <Match when={props.preview.kind === "race"}>
                <RaceView currentRace={() => e() as Race} backClick={props.show} width="60%" />
            </Match>
            <Match when={props.preview.kind === "feat"}>
                <FeatView feat={() => e() as Feat} show={props.show} width="40%" height="40%" />
            </Match>
            <Match when={props.preview.kind === "background"}>
                <BackgroundView background={() => e() as Background} backClick={props.show} />
            </Match>
            <Match when={props.preview.kind === "item"}>
                <ItemPopup item={() => e() as srdItem} show={props.show} />
            </Match>
            <Match when={props.preview.kind === "magic_item"}>
                <ItemPopup item={() => e() as unknown as srdItem} show={props.show} />
            </Match>
            <Match when={props.preview.kind === "class"}>
                <ClassModal
                    currentClass={() => e() as Class5E}
                    boolean={props.show[0]}
                    booleanSetter={props.show[1]}
                    subclasses={() => []}
                />
            </Match>
            <Match when={props.preview.kind === "subclass"}>
                <SubclassView subclass={() => e() as Subclass} show={props.show} />
            </Match>
        </Switch>
    );
};

export default HomebrewPreviewDialog;
