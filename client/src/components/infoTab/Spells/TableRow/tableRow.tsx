import { Component, Show } from "solid-js";
import { effect } from "solid-js/web";
import { Spell } from "../../../../models/spell.model";
import styles from "./tableRow.module.scss";

type Props = {
    spell: Spell;
};

const TableRow: Component<Props> = (props) => {
    const isMaterial = props.spell.isMaterial
    const isSomatic = props.spell.isSomatic
    const isVerbal = props.spell.isVerbal
    

    function spellComponents(){
        let components = []
        let toReturn = "";
        if(isVerbal){
            components.push("V")
        }
        if(isSomatic){
            components.push("S")
        }
        if(isMaterial){
            components.push("M")
        }
        toReturn = components.join(", ")

        if(isMaterial){
            return toReturn + ` (${props.spell.materials_Needed})`
        }
        return toReturn
    }
    
    return (
        <>
            <tr class={`${styles.TableRow}`}>
                <td>level:{props.spell.level}</td>
                <td>school:{props.spell.school}</td>
                <td>casting time:{props.spell.castingTime}</td>
                <td>range: {props.spell.range}</td>
                <td>components: {spellComponents()}</td>
                <td>duration: {props.spell.duration}</td>
                <td>classes: {props.spell.classes.join(", ")}</td>
                <td>subclasses: {props.spell.subClasses.join(", ")}</td>
                <td>Description: {props.spell.desc}</td>
                <Show when={!!props.spell.higherLevel}><td>at higher levels: {props.spell.higherLevel}</td></Show>
            </tr>
        </>
    );
};
export default TableRow;