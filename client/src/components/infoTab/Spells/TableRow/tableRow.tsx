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
        let toReturn = [];
        if(isVerbal){
            components.push("V")
        }
        if(isSomatic){
            components.push("S")
        }
        if(isMaterial){
            components.push("M")
        }
        toReturn.push(components.join(", "));

        if(isMaterial){
            toReturn.push(props.spell.materials_Needed)
        }
        return toReturn
    }
    
    let compsArr = spellComponents()

    return (
        <>
            <tr class={`${styles.TableRow}`}>
                <td><h2><strong>{props.spell.name}</strong></h2></td>
                <td><strong>Level:</strong> {props.spell.level}</td>
                <td><strong>School:</strong> {props.spell.school}</td>
                <td><strong>Casting time:</strong> {props.spell.castingTime}</td>
                <td><strong>Range:</strong> {props.spell.range}</td>
                <td><strong>Components:</strong> {compsArr[0]}</td>
                <Show when={isMaterial}>
                    <td><strong>Materials:</strong> {compsArr[1]}</td>
                </Show>
                <td><strong>Duration:</strong> {props.spell.duration}</td>
                <td><strong>Classes:</strong> {props.spell.classes.join(", ")}</td>
                <td><strong>Subclasses:</strong> {props.spell.subClasses.join(", ")}</td>
                <td>
                    <strong>Description:</strong>
                </td>
                <td>
                    <textarea name="spell_desc">{props.spell.desc}</textarea>
                </td>
                <Show when={!!props.spell.higherLevel}><td><strong>higher levels:</strong></td></Show>
                <Show when={!!props.spell.higherLevel}><td>
                    <textarea >{props.spell.higherLevel}</textarea>    
                </td></Show>
            </tr>
        </>
    );
};
export default TableRow;