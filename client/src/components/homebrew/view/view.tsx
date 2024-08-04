import { Component, useContext } from "solid-js";
import useStyle from "../../../shared/customHooks/utility/style/styleHook";
import style from './view.module.scss'
import Carousel from "../../../shared/components/Carosel/Carosel";
import { Background, DnDClass, Feat, Item, Spell } from "../../../models";
import Table from "./table/Table";
import useDnDSpells from "../../../shared/customHooks/dndInfo/srdinfo/useDnDSpells";
import HomebrewManager from '../../../shared/customHooks/homebrewManager';
import { MenuButton } from "../../../shared/components/Button/Button";
import { SharedHookContext } from "../../rootApp";

const View: Component = () => {
    const sharedHooks = useContext(SharedHookContext);
    const stylin = sharedHooks?.useStyle();  
    return (
        <div class={`${stylin?.accent} ${style.body}`}>
            <h1>View</h1>
            <div style={{"text-align": "left"}}>
                <Carousel elements={[
                    {name: "Spells", element: <Table data={HomebrewManager.spells()} keys={["name", "level"]}
                        button={{
                            generateMenuButtons: (data) => ([
                                { name: "Edit", onClick: () => { console.log("Edit", data); } },
                                { name: "Delete", onClick: () => { console.log("Delete", data); } }
                            ] as unknown as MenuButton[])
                        }}
                    /> },
                    {name: "Classes", element: <Table data={HomebrewManager.classes()} keys={["name", "hitDie"]}
                        button={{
                            generateMenuButtons: (data) => ([
                                { name: "Edit", onClick: () => { console.log("Edit", data); } },
                                { name: "Delete", onClick: () => { console.log("Delete", data); } }
                            ] as unknown as MenuButton[])
                        }}
                    /> },
                    {name: "Feats", element: <Table data={HomebrewManager.feats()} keys={["name"]} 
                    button={{
                        generateMenuButtons: (data) => ([
                            { name: "Edit", onClick: () => { console.log("Edit", data); } },
                            { name: "Delete", onClick: () => { console.log("Delete", data); } }
                        ] as unknown as MenuButton[])
                    }}
                /> },
                    {name: "Items", element: <Table data={HomebrewManager.items()} keys={["name"]} 
                    button={{
                        generateMenuButtons: (data) => ([
                            { name: "Edit", onClick: () => { console.log("Edit", data); } },
                            { name: "Delete", onClick: () => { console.log("Delete", data); } }
                        ] as unknown as MenuButton[])
                    }}
                /> },
                    {name: "Backgrounds", element: <Table data={HomebrewManager.backgrounds()} keys={["name"]} 
                    button={{
                        generateMenuButtons: (data) => ([
                            { name: "Edit", onClick: () => { console.log("Edit", data); } },
                            { name: "Delete", onClick: () => { console.log("Delete", data); } }
                        ] as unknown as MenuButton[])
                    }}
                /> },
                    {name: "Races", element: <Table data={HomebrewManager.races()} keys={["name"]} 
                    button={{
                        generateMenuButtons: (data) => ([
                            { name: "Edit", onClick: () => { console.log("Edit", data); } },
                            { name: "Delete", onClick: () => { console.log("Delete", data); } }
                        ] as unknown as MenuButton[])
                    }}
                /> }
                ]} />
            </div>
        </div>
    );
}
export default View;