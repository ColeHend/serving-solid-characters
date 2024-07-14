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
import { Feature } from "../../../../../models/core.model";
import styles from "./classes.module.scss";
import { DnDClass } from "../../../../../models";
import { effect } from "solid-js/web";

interface Props {
  level: number;
  features: Accessor<Feature<unknown, string>[]>;
  setFeatures: Setter<Feature<unknown, string>[]>;
  name: Accessor<string>;
  allClasses: Accessor<DnDClass[]>;
  hasSpellCasting: Accessor<boolean>;
}
const LevelBuilder: Component<Props> = (props) => {
  const [{ level, features, setFeatures, name, hasSpellCasting }] = splitProps(props, [
    "level",
    "features",
    "setFeatures",
    "name",
    "hasSpellCasting"
  ]);
  
  const classFeatureNullCheck = <T,>(value: T) => {
    const val = JSON.parse(JSON.stringify(value));
    if (typeof val === "string") return val;
    if (Array.isArray(val)) return val.join("\n");
    return "-unknown-";
  };

//   effect(()=>{
    console.log(props.allClasses().filter(x=> x.classLevels.flatMap(y=>!!y.spellcasting ? Object.keys(y.spellcasting).length > 0 : false).includes(true)));
//   })

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
                    <For each={[1, 2, 3, 4, 5, 6, 7, 8, 9]}>{(slot) => <>
                        <label for={`slot${slot}`}>Level {slot}</label>
                        <span >
                            <Input value={0} type="number" name={`slot${slot}`} />
                        </span>
                    </>}</For>
                </div>
                <div>
                    <Input placeholder="Spells Known" />
                    <Select disableUnselected={true}>
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
                  placeholder={feature.name}
                  onInput={(e) => {
                    setFeatures((old) => {
                      old[i()] = {
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
                placeholder={classFeatureNullCheck(feature.value)}
                class={`${styles.textArea}`}
                onInput={(e) => {
                  setFeatures((old) => {
                    old[i()] = {
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
                      old.splice(i(), 1);
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
    </div>
  );
};

export default LevelBuilder;
