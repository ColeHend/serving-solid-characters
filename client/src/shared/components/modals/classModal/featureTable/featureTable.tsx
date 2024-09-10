import { Accessor, Component, For, Show } from "solid-js";
import { DnDClass } from "../../../../../models/class.model";
import { formatKeysForDisplay, toDisplayFormat } from "../../../../customHooks/utility/stringsHelper";
import styles from "./featureTable.module.scss";
type Props = {
    Class: Accessor<DnDClass>,
}


const FeatureTable: Component<Props> = (props) => {

    const Class = props.Class
    const fixedSelectValues = (key: string) => {
        switch (props.Class().name.toLowerCase()) {
            case "rogue":
            case "monk":
                if(!Number.isNaN(+key)) return key
                const fixedValues = JSON.parse(key);
                return `${JSON.parse(fixedValues).DiceCount}d${JSON.parse(fixedValues).DiceValue}`
        }
        return key
    }

    const fixedSorerer = (keyArr: string[]) => {
        if (props.Class().name.toLowerCase() === "sorcerer") {
            return keyArr.slice(1)
        }
        return keyArr
    }

    const highestClassSpecificKeyAmountFirstArr = () => {
        const classSpecific = props.Class()?.classLevels
        const sorted = classSpecific?.sort((b, a) => Object.keys(a.classSpecific).length - Object.keys(b.classSpecific).length)
        return sorted
    }

    return (
        <table class={`${styles.table}`}>
            <thead>
                <tr>
                    <th>
                        Level
                    </th>
                    <th>
                        PB
                    </th>
                    <th>
                        Features
                    </th>
                    <For each={fixedSorerer(Object.keys(highestClassSpecificKeyAmountFirstArr()[0].classSpecific))}>
                        {(Specifickey)=>
                            <th>
                                {toDisplayFormat(Specifickey)}
                            </th>
                        }
                    </For>
                </tr>
            </thead>
            <tbody>
                <For each={Class().classLevels.sort((a,b)=> a.info.level - b.info.level)}>
                    {(item)=>
                            <tr style={{border: "1px solid white"}}>
                                
                                <td>{item.info.level}</td>

                                <td>{item.profBonus}</td>

                                <td class={`${styles.feature}`}>
                                    {item.features.map(x => x.name).join(", ")}
                                </td>
                                
                                {/* class specific stuff ↓ needs alot work */}

                                <For each={fixedSorerer(Object.keys(item.classSpecific))}>
                                    {(Specifickey)=>
                                        <td>
                                            <span>{fixedSelectValues(item.classSpecific[Specifickey])}</span>
                                        </td>
                                    }
                                </For>
                                
                            </tr>

                    }
                </For>
            </tbody>
    </table>
    )
}

export default FeatureTable;