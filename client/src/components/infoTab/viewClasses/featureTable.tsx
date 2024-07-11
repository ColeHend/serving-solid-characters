

import { Component, For, Show } from "solid-js";
import { DnDClass } from "../../../models/class.model";

type Props = {
    Class: DnDClass
}


const FeatureTable: Component<Props> = (props) => {

    const Class = props.Class

    return (
        <table style={{width:"100%"}}>
        <thead>
            <tr>
                <th>
                    Level
                </th>
                <th>
                    Proficiency Bonus
                </th>
                <th>
                    Features
                </th>
                <For each={Object.keys(Class.classLevels[0].classSpecific)}>
                    {(Specifickey)=>
                        <th>
                            {Specifickey}
                        </th>
                    }
                </For>
            </tr>
        </thead>
        <tbody>
            <For each={Class.classLevels.sort((a,b)=> a.info.level - b.info.level)}>
                {(item)=>
                    <tr style={{"text-align": "center"}}>
                        
                        <td>{item.info.level}</td>

                        <td>{item.profBonus}</td>

                        <td>
                            {item.features.map(x => x.name).join(", ")}
                        </td>
                        
                        {/* class specific stuff ↓ needs alot work */}

                        <For each={Object.keys(item.classSpecific)}>
                            {(Specifickey)=>
                                <td>
                                    <span>{item.classSpecific[Specifickey]}</span>
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