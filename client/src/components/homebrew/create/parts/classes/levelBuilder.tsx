import {
  Component,
  createSignal,
  For,
  Show,
  splitProps,
  type Accessor,
  type Setter,
} from "solid-js";
import {
  Input,
  Button,
  Select,
  Option,
  Carousel,
  Chip,
} from "../../../../../shared/components/index";
import { Feature, Info } from "../../../../../models/core.model";
import styles from "./classes.module.scss";
import { DnDClass } from "../../../../../models";
import { effect } from "solid-js/web";
import { LevelEntity } from "../../../../../models/class.model";

interface Props {
  level: number;
  features: Accessor<Feature<unknown, string>[]>;
  setFeatures: Setter<Feature<unknown, string>[]>;
  name: Accessor<string>;
  allClasses: Accessor<DnDClass[]>;
  hasSpellCasting: Accessor<boolean>;
  classLevels: Accessor<LevelEntity[]>;
  setClassLevels: Setter<LevelEntity[]>;
  casterType: Accessor<string>;
  setCasterType: Setter<string>;
}
const LevelBuilder: Component<Props> = (props) => {
  const [{setClassLevels, level, features, setFeatures, name, hasSpellCasting, classLevels, casterType, setCasterType }] = splitProps(props, [
    "level",
    "features",
    "setFeatures",
    "name",
    "hasSpellCasting",
    "classLevels",
    "setClassLevels",
    "casterType",
    "setCasterType"
  ]);
  
  const classFeatureNullCheck = <T,>(value: T) => {
    const val = JSON.parse(JSON.stringify(value));
    if (typeof val === "string") return val;
    if (Array.isArray(val)) return val.join("\n");
    return "-unknown-";
  };
  const [toAddName, setToAddName] = createSignal("");
  const [toAddValue, setToAddValue] = createSignal("");
  const getSlotString = (slot: number) => slot === 0 ? "cantrips_known" : `spell_slots_level_${slot}`;
  const getSlotValue:(slot:number)=>string = (slot: number) => {
    if(!!classLevels()[level - 1]?.spellcasting) {
      if(slot === 0) return `${classLevels()[level - 1]?.spellcasting?.cantrips_known}`;
      
      return classLevels()[level - 1]?.spellcasting?.[`spell_slots_level_${slot}`] ? `${classLevels()[level - 1]?.spellcasting?.[`spell_slots_level_${slot}`]}`: "";
    }
    return "";
  }

  return (
    <div>
      <h3>Level {level}</h3>
      <h3>Info</h3>
      <div class={`${styles.otherStuff}`}>
        <div>Proficency Bonus: {Math.ceil(level / 4) + 1}</div>
      </div>
      <Show when={hasSpellCasting()}>
            <div>
                <div class={`${styles.hasCasting}`} >
                    <h4>Spells Slots: </h4>
                    <For each={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]}>{(slot) => <>
                        <label for={`spell_slots_level_${slot}`}>{slot > 0 ? `Level ${slot} `: "Cantrips "}</label>
                        <span >
                            <Input value={getSlotValue(slot)} type="number" name={`spell_slots_level_${slot}`} onChange={(e)=>{
                              setClassLevels((old)=>{
                                switch (slot) {
                                    case 0:
                                      old[level - 1].spellcasting = {...old[level - 1]?.spellcasting, ["cantrips_known"] : +e.currentTarget.value}
                                      break;
                                    case 1:
                                      old[level - 1].spellcasting = {...old[level - 1]?.spellcasting, ["spell_slots_level_1"] : +e.currentTarget.value}
                                      break;
                                    case 2:
                                      old[level - 1].spellcasting = {...old[level - 1]?.spellcasting, ["spell_slots_level_2"] : +e.currentTarget.value}
                                      break;
                                    case 3:
                                      old[level - 1].spellcasting = {...old[level - 1]?.spellcasting, ["spell_slots_level_3"] : +e.currentTarget.value}
                                      break;
                                    case 4:
                                      old[level - 1].spellcasting = {...old[level - 1]?.spellcasting, ["spell_slots_level_4"] : +e.currentTarget.value}
                                      break;
                                    case 5:
                                      old[level - 1].spellcasting = {...old[level - 1]?.spellcasting, ["spell_slots_level_5"] : +e.currentTarget.value}
                                      break;
                                    case 6:
                                      old[level - 1].spellcasting = {...old[level - 1]?.spellcasting, ["spell_slots_level_6"] : +e.currentTarget.value}
                                      break;
                                    case 7:
                                      old[level - 1].spellcasting = {...old[level - 1]?.spellcasting, ["spell_slots_level_7"] : +e.currentTarget.value}
                                      break;
                                    case 8:
                                      old[level - 1].spellcasting = {...old[level - 1]?.spellcasting, ["spell_slots_level_8"] : +e.currentTarget.value}
                                      break;
                                    case 9:
                                      old[level - 1].spellcasting = {...old[level - 1]?.spellcasting, ["spell_slots_level_9"] : +e.currentTarget.value}
                                      break;
                                    default:
                                      break;
                                  }
                                    return JSON.parse(JSON.stringify(old));
                                });
                            }} />
                        </span>
                    </>}</For>
                </div>
                <div>
                    <Input placeholder="Spells Known" />
                    <Select value={casterType()} onChange={(e)=>{
                        setCasterType(e.currentTarget.value);
                    }}  disableUnselected={true}>
                        <Option value={""}>None</Option>
                        <Option value={"full"}>Full Caster</Option>
                        <Option value={"halfUp"}>Half Caster Round Up</Option>
                        <Option value={"halfDown"}>Half Caster Round Down</Option>
                        <Option value={"thirdUp"}>Third Caster Round Up</Option>
                        <Option value={"thirdDown"}>Third Caster Round Down</Option>
                    </Select>
                </div>
            </div>
        </Show>
      <div class={`${styles.buttons}`}>
        <Button
          onClick={(e) => {
            setFeatures((old) => {
              old.push({
                name: `New Feature${
                  old.filter((x) => x.info.level === level).length + 1
                }`,
                value: "new feature description",
                info: {
                  className: name(),
                  subclassName: "",
                  level: level,
                  type: "Class Feature",
                  other: "",
                },
              });
              return JSON.parse(JSON.stringify(old));
            });
          }}
        >
          Add New Feature
        </Button>
        <Button>Add Existing Feature</Button>
      </div>
      <h3>Features</h3>
      <For each={features().filter((x) => x.info.level === level)}>
        {(feature, i) => {
          return (
            <div>
              
              <div>
                <h4>Name</h4>
                <Input
                  value={feature.name}
                  onChange={(e) => {
                    setFeatures((old) => {
                      old[level - 1] = {
                        name: e.currentTarget.value,
                        value: feature.value,
                        info: feature.info,
                      };
                      return JSON.parse(JSON.stringify(old));
                    });
                  }}
                />
              </div>
              <div>
                <h4>Value</h4>
                <textarea 
                class={`${styles.textArea}`}
                value={classFeatureNullCheck(feature.value)}
                onChange={(e) => {
                  setFeatures((old) => {
                    old[level - 1] = {
                      name: feature.name,
                      value: e.currentTarget.value,
                      info: feature.info,
                    };
                    return JSON.parse(JSON.stringify(old));
                  });
                }}/>
              </div>
              <div>
              <Button
                  onClick={() => {
                    setFeatures((old) => {
                      const index = old.findIndex((x) => x.name === feature.name && x.info.level === level);
                      old.splice(index, 1);
                      return JSON.parse(JSON.stringify(old));
                    });
                  }}
                >
                    Remove
                </Button>
              </div>
            </div>
          );
        }}
      </For>
      <Show
        when={features().filter((x) => x.info.level === level).length === 0}
      >
        <div>No Features Found!</div>
      </Show>
      <h3>New Class Specific <i>(like barbarian rages)</i></h3>
        <div>
          <Input value={toAddName()} onChange={(e)=>{
            setToAddName(e.currentTarget.value);
          }} placeholder="Name" />
          <Input value={toAddValue()} onChange={(e)=>{
            setToAddValue(e.currentTarget.value);
          }} type="number" placeholder="Value" />
          <Button disabled={toAddName().length < 1} onClick={(e)=>{
            setClassLevels((old)=>{
              old[level - 1].classSpecific[toAddName()] = toAddValue();
              setToAddName("");
              setToAddValue("");
              return JSON.parse(JSON.stringify(old));
            });
          }}>Add New</Button>
          <br />
          <For each={Object.keys(classLevels()[level - 1].classSpecific)}>{(item, i)=><>
            <div>
              <h4>{item}</h4>
              <Input class={`${classLevels()[level - 1].classSpecific[item] ? "error " : ""}`} value={item} onChange={(e)=>{
                setClassLevels((old)=>{
                  old[level - 1].classSpecific[e.currentTarget.value] = old[level - 1].classSpecific[item];
                  return JSON.parse(JSON.stringify(old));
                });
              }} />
              <Input type="number" value={classLevels()[level - 1].classSpecific[item]} onChange={(e)=>{
                setClassLevels((old)=>{
                  old[level - 1].classSpecific[item] = e.currentTarget.value;
                  return JSON.parse(JSON.stringify(old));
                });
              }} />
              <Button onClick={(e)=>{
                setClassLevels((old)=>{
                  delete old[level - 1].classSpecific[item];
                  return JSON.parse(JSON.stringify(old));
                });
              }}>Remove</Button>
            </div>
          </>}</For>
          <br />
        </div>
    </div>
  );
};

export default LevelBuilder;
