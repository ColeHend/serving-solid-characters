import { Cell, Column, FormGroup, Header, Icon, Modal, Row, Table } from "coles-solid-library";
import { Accessor, Component, createMemo, For, Setter, Show } from "solid-js";
import { Class5E } from "../../../../../models/data";
import styles from "./AddClass.module.scss";
import { CharacterForm } from "../../../../../models/character.model";
import { getUserSettings, mobileCheck } from "../../../../../shared";

interface modalProps {
    show: [Accessor<boolean>,Setter<boolean>];
    allClasses: Accessor<Class5E[]>;
    charClasses: Accessor<string[]>;
    setCharClasses: Setter<string[]>;
    stats: Accessor<Record<string, number>>;
    mods: Accessor<Record<string, number>>;
}

export const AddClass: Component<modalProps> = (props) => {
    const [show,setshow] = props.show;

    const isMobile = mobileCheck();

    const [userSettings,] = getUserSettings();

    const theme = userSettings().theme;

    const stats = createMemo(()=>props.stats());
    const mods = createMemo(()=>props.mods());

    const charClasses = createMemo(()=>props.charClasses());

    const isDarkTheme = createMemo(()=>{
        if (theme === "dark") {
            return true
        } else if (theme === "light") {
            return false;
        }

        return true;
    })

    // functions

    const getStat = (stat: string): number => {
        return stats()[`${abbreviateStat(stat.trim())}`] as number;
    }

    const getMod = (stat: string): number => {
        return mods()[`${abbreviateStat(stat.trim())}`] as number;
    }

    const checkRequirments = (class5e: Class5E) => {
        const primaryStat = class5e.primaryAbility.split(",");

        return primaryStat.every((stat)=>{
            const charStat = getStat(stat);
            const statMod = getMod(stat);

            const fullStat = Math.floor(charStat + statMod);
            
            if (fullStat >= 13) {
                console.log("true");
                
                return true; // true, does meet the requirment.
            } else {
                console.log("false");
                
                return false; // false, does not meet the requirment. 
            }
        })
    }

    const abbreviateStat = (stat: string): string=> {
        switch (stat) {
            case "Strength":
                return "str";
            
            case "Dexterity":
                return "dex";

            case "Constitution":
                return "con";
            
            case "Intelligence":
                return "int";

            case "Wisdom":
                return "wis";

            case "Charisma":
                return "cha";

            default:
                return "";
        }
    }

    const handleClick = (class5e: Class5E) => {
        if (charClasses().length >= 1) {
            if (!checkRequirments(class5e)) {
                return;
            }
        }

        props.setCharClasses(old => [...old,class5e.name])
        setshow(false);
    }

    return <Modal show={props.show} title="Add a class">
        <div class={`${styles.AddClassTable}`}>
            <Table data={props.allClasses} columns={isMobile ?["name","primaryAbility"] :["name","primaryAbility","hitdie"]}>
                <Column name="name">
                    <Header>Name</Header>
                    <Cell<Class5E>>
                        {(class5e) => <span>
                                {class5e.name}
                            </span>}
                    </Cell>
                    <Cell<Class5E> rowNumber={2}>
                        {(class5e)=><span>Requirements:</span>}
                    </Cell>
                </Column>
                
                <Column name="primaryAbility">
                    <Header>Primary Stat</Header>
                    <Cell<Class5E>>
                        {(class5e)=><span>
                            {class5e.primaryAbility}
                        </span>}
                    </Cell>
                    <Cell<Class5E> rowNumber={2}>
                    {(class5e)=> <div style={{display:"flex",gap:"2px","justify-content":"flex-start"}}>

                            <Show when={charClasses().length >= 1}>
                                <For each={class5e.primaryAbility.split(",")}>
                                    {(stat) => {
                                        const trimmedStat = stat.trim();
                                        const statVal = createMemo(() => getStat(trimmedStat));
                                        const statMod = createMemo(() => getMod(trimmedStat));
                                        const meetsRequirement = createMemo(() => (statVal() + statMod()) >= 13);
                                        
                                        return (
                                            <span style={{ 
                                                "border-bottom": meetsRequirement() ? "2px solid green" : "2px solid red",
                                                display: "flex",
                                                "justify-content": "center",
                                                "align-items": "center",
                                                padding: "4px 8px",
                                                gap: "6px"
                                            }}>
                                                <span>{trimmedStat} of 13</span>
                                                <Show when={meetsRequirement()} fallback={<Icon name="close" size="small" color="red"/>}>
                                                    <Icon name="check" size="small" color="green"/>
                                                </Show>
                                            </span>
                                        );
                                    }}
                                </For>
                            </Show>
                        </div>} 
                    </Cell>
                </Column>

                <Column name="hitdie">
                    <Header>Hit Die</Header>
                    <Cell<Class5E>>
                        {(class5e)=><span>
                            {class5e.hitDie}
                        </span>}
                    </Cell>
                </Column>

                <Row rowNumber={1} onClick={(e,class5e: Class5E)=>handleClick(class5e)} />
                <Row rowNumber={2} style={isDarkTheme() ? {"border-bottom": "1px solid rgba(255, 255, 255, 0.65)"} : {"border-bottom":"1px solid rgba(0,0,0,0.65)"}} />
            </Table>
        </div>
    </Modal>
}