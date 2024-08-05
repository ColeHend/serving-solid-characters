import { Component, createMemo, createSignal, useContext } from "solid-js";
import useStyle from "../../../shared/customHooks/utility/style/styleHook";
import style from './view.module.scss'
import Carousel from "../../../shared/components/Carosel/Carosel";
import { Background, DnDClass, Feat, Item, Spell } from "../../../models";
import Table from "./table/Table";
import useDnDSpells from "../../../shared/customHooks/dndInfo/srdinfo/useDnDSpells";
import HomebrewManager from '../../../shared/customHooks/homebrewManager';
import { MenuButton } from "../../../shared/components/Button/Button";
import { SharedHookContext } from "../../rootApp";
import { useInjectServices } from "../../../shared/customHooks/injectServices";
import getUserSettings from "../../../shared/customHooks/userSettings";
import useStyles from "../../../shared/customHooks/utility/style/styleHook";
import { useNavigate, useSearchParams } from "@solidjs/router";
import { effect } from "solid-js/web";

const View: Component = () => {
    const sharedHooks = useInjectServices();
    const [userSettings, setUserSettings] = getUserSettings();
    
    const navigate = useNavigate();
    const stylin = createMemo(()=>useStyles(userSettings().theme));
    const elementMemo = createMemo(()=>[
        {name: "Spells", element: <Table data={HomebrewManager.spells()} keys={["name", "level"]}
            button={{
                backgroundClick: true,
                generateMenuButtons: (data) => ([
                    { name: "Edit", condition: ()=>true, action: () => { navigate(`/homebrew/create/spells?name=${data.name}`) } },
                    { name: "Delete", condition: ()=>true, action: () => { console.log("Delete", data); } }
                ] as MenuButton[])
            }}
        /> },
        {name: "Feats", element: <Table data={HomebrewManager.feats()} keys={["name"]} 
        button={{
            backgroundClick: true,
            generateMenuButtons: (data) => ([
                { name: "Edit", condition: ()=>true, action: () => { navigate(`/homebrew/create/feats?name=${data.name}`) } },
                { name: "Delete", condition: ()=>true, action: () => { console.log("Delete", data); } }
            ] as MenuButton[])
        }}
        /> },
        {name: "Classes", element: <Table 
        data={HomebrewManager.classes()} 
        keys={["name", "hitDie"]}
        paginator={[5, 10, 25, 50, 100]}
        button={{
            backgroundClick: true,
            generateMenuButtons: (data) => ([
                { name: "Edit", condition: ()=>true, action: () => { navigate(`/homebrew/create/classes?name=${data.name}`) } },
                { name: "Delete", condition: ()=>true, action: () => { console.log("Delete", data); } }
            ] as MenuButton[])
        }}
        /> },
        {name: "Subclasses", element: <Table 
            data={HomebrewManager.classes().flatMap(x=>x.subclasses)} 
            keys={["name", "class"]}
            paginator={[5, 10, 25, 50, 100]}
            button={{
                backgroundClick: true,
                generateMenuButtons: (data) => ([
                    { name: "Edit", condition: ()=>true, action: () => { navigate(`/homebrew/create/subclasses?name=${data.name}`) } },
                    { name: "Delete", condition: ()=>true, action: () => { console.log("Delete", data); } }
                ] as MenuButton[])
            }}
            /> },
        {name: "Items", element: <Table data={HomebrewManager.items()} keys={["name"]} 
        button={{
            backgroundClick: true,
            generateMenuButtons: (data) => ([
                { name: "Edit", condition: ()=>true, action: () => { navigate(`/homebrew/create/items?name=${data.name}`) } },
                { name: "Delete", condition: ()=>true, action: () => { console.log("Delete", data); } }
            ] as MenuButton[])
        }}
    /> },
        {name: "Backgrounds", element: <Table data={HomebrewManager.backgrounds()} keys={["name"]} 
        button={{
            backgroundClick: true,
            generateMenuButtons: (data) => ([
                { name: "Edit", condition: ()=>true, action: () => { navigate(`/homebrew/create/backgrounds?name=${data.name}`) } },
                { name: "Delete", condition: ()=>true, action: () => { console.log("Delete", data); } }
            ] as MenuButton[])
        }}
    /> },
        {name: "Races", element: <Table data={HomebrewManager.races()} keys={["name"]} 
        button={{
            backgroundClick: true,
            generateMenuButtons: (data) => ([
                { name: "Edit", condition: ()=>true, action: () => { navigate(`/homebrew/create/races?name=${data.name}`) } },
                { name: "Delete", condition: ()=>true, action: () => { console.log("Delete", data); } }
            ] as MenuButton[])
        }}
    /> }
    ]);  
    const [searchParam, setSearchParam] = useSearchParams();
    if (!!!searchParam.name) setSearchParam({name: elementMemo()[0].name});
    const startingIndex = createMemo(()=>elementMemo().findIndex((x)=>x.name.toLowerCase() === searchParam.name?.toLowerCase()));
    effect(()=>{
        console.log("startingIndex", startingIndex());
        console.log("searchParam", searchParam.name);
    })
    const [homebrewIndex, setHomebrewIndex] = createSignal<number>(startingIndex());
    effect(()=>{
        setSearchParam({name: elementMemo()[homebrewIndex()].name ?? "spells"})
    })
    return (
        <div class={`${stylin().primary} ${style.body}`}>
            <h1>View</h1>
            <div style={{"text-align": "left"}}>
                <Carousel startingIndex={startingIndex()} currentIndex={[homebrewIndex, setHomebrewIndex]} elements={elementMemo()} />
            </div>
        </div>
    );
}
export default View;