import { Button, Cell, Column, Header, Option, Select, Table } from "coles-solid-library";
import { Accessor, Component, createMemo, createSignal, For } from "solid-js";

interface props {
    toggleValue: (objString: string, proficiencyChoice: string) => void;
    getValue: Accessor<Record<string, string> | undefined>;
}

export const AllProfsFeature: Component<props> = (props) => {

    const madValue = createMemo(() => props.getValue());

    const getMadValue = (key: string) => {
        return madValue()?.[key];
    }

    const skills = createMemo(() => {
        const value = getMadValue('allProficiencies');

        if (!value) {
            return [];
        }

        return value.split(",").map(s => s.trim());
    })

    const proficiencyBonusChoice = createMemo(() => {
        const value = getMadValue('proficiencyBonusChoice');

        if (!value) return null;

        return value;
    });
    
    const [skillsToAdd, setSkillsToAdd] = createSignal<string[]>(skills());
    const [proficiencyChoice, setProficiencyChoice] = createSignal<string>(proficiencyBonusChoice() ?? "Third PB");

    const setSkillProficiency = (skill: string) => {
        if (!skill) {
            return;
        }   

        setSkillsToAdd(prev => [...prev, skill]);
    }

    const getSkillProficiency = (skill: string): Accessor<string | null> => {
        if (!skill) {
            return () => null;
        }

        return createMemo(() => skillsToAdd().find(s => s === skill) ?? null);
    }

    const getAllSkills = (): string[] => {
        return Object.keys(skillsToAdd());
    }

    const handleSubmit = () => {
        const arrayString = getAllSkills().join(",");
        
        props.toggleValue(arrayString, proficiencyChoice());
    }

    // check this against the character's skills to make sure they all exist and are spelled correctly
    const allSkills = createMemo(() => [
        "Acrobatics",
        "Animal Handling",
        "Arcana",
        "Athletics",
        "Deception",
        "History",
        "Insight",
        "Intimidation",
        "Investigation",
        "Medicine",
        "Nature",
        "Perception",
        "Performance",
        "Persuasion",
        "Religion",
        "Sleight of Hand",
        "Stealth",
        "Survival"
    ]);

    const columns = [
        "Name",
        "choice"
    ]

    const skillProfChoices = [
        "Third PB",
        "Half PB",
        "Full PB"
    ]


    return <div>
        Select how much of the proficiency bonus you want to add to each skill, then select which skills you want to apply it to. This will add the chosen amount of proficiency bonus to all selected skills.

         <Select value={proficiencyChoice()} onChange={(value) => setProficiencyChoice(value)}>
            <For each={skillProfChoices}>
                {choice => <Option value={choice}>{choice}</Option>}
            </For>
        </Select>

        <Table columns={columns} data={allSkills}>
            <Column name="Name">
                <Header>Name</Header>
                <Cell<string>>
                    {skill => <span>
                        {skill}
                    </span>}
                </Cell>
            </Column>
            <Column name="choice">
                <Header>Choice</Header>
                <Cell<string>>
                    {skill => <Button onClick={() => setSkillProficiency(skill)}>{getSkillProficiency(skill)() ? "Selected" : "Not Selected"}</Button>}
                </Cell>
            </Column>
        </Table>
        
        <Button onClick={handleSubmit}>Set Proficiencies</Button>
    </div>
}