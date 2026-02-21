import { Accessor, Component, createMemo, For, Setter, Show } from "solid-js";
import { FlatCard } from "../../../../shared/components/flatCard/flatCard";
import { FormField, FormGroup, Input } from "coles-solid-library";
import styles from "./hpSection.module.scss";
import { CharacterForm } from "../../../../models/character.model";

interface sectionProps {
    currentClass: Accessor<string>;
    classLevels: [Accessor<Record<string, number>>,Setter<Record<string, number>>];
    classNames: Accessor<string[]>;
    stat: Accessor<Record<string, number>>;
    mod: Accessor<Record<string, number>>;
    form: FormGroup<CharacterForm>;
}

export const HitPointSection:Component<sectionProps> = (props) => {
    const currentClass = createMemo(()=>props.currentClass());
    const classNames = createMemo(()=> props.classNames());
    const stat = createMemo(()=>props.stat());
    const mod = createMemo(()=>props.mod());

    const maxHP = createMemo(()=>props.form.get().maxHP);
    const [classLevels,setClassLevels] = props.classLevels;

    const getHitDie = (name?: string) => {
        const searchTarget = name !== undefined ? name : currentClass();

        switch (searchTarget) {
            case "Barbarian":
                return 12;
            case "Fighter":
            case "Paladin":
            case "Ranger":
                return 10;
            case "Bard":
            case "Cleric":
            case "Druid":
            case "Monk":
            case "Rogue":
            case "Warlock":
                return 8;
            case "Sorcerer":
            case "Wizard":
                return 6;
        }
    }

    const getCharacterLevel = (className: string): number => {
  
      return classLevels()[className] ?? 0;
    }

    const showCharacterLevel = (className: string): number => {
        const target = getCharacterLevel(className) - 1;

        if (target === -1) return 0

        return target;
    }


   const getConMod = () => {
        const theStat = stat()["con"];
        const theMod = mod()["con"];

        return Math.floor(((theStat + theMod) - 10)/2);
   }

   const health = createMemo(()=>Math.floor(+maxHP() + +getConMod()));

    return <FlatCard icon="health_and_safety" headerName={`Hit Points: ${health()} hp max`} transparent>
        <div>
            <p>
            <strong>1st level:</strong> Your starting HP equals your class hit die ({getHitDie() ?? "_"}) plus your Constitution modifier.
            </p>
            <p>
            <strong>Subsequent levels:</strong> Each time you level up you gain HP equal to 1d{getHitDie() ?? "_"} + your Constitution modifier.
            </p>
        </div>
        <div>
            <div>
                <strong>Hit Dice: </strong>
                <span>
                    <For each={classNames()}>
                        {(name,i)=><span>
                            {showCharacterLevel(name)} d {getHitDie(name)}<Show when={i() !== classNames().length - 1}> , </Show>
                        </span>}
                    </For>
                </span>
            </div>
            <div>
                <strong>Max Hit Points: </strong>
                <span>
                    {health()} ({maxHP()} + {getConMod()})
                </span>
            </div>
        </div>
        <div class={`${styles.hpInput}`}>
            <FormField name="Max Hit Points" formName="maxHP">
                <Input type="number" min={1} />
            </FormField>
            
            <FormField name="Current Hit Points" formName="currentHP">
                <Input type="number" min={0} />
            </FormField>

            <FormField name="Temp Hit Points" formName="tempHP">
                <Input type="number" min={0} />
            </FormField>
        </div>
        

       
    </FlatCard>
} 