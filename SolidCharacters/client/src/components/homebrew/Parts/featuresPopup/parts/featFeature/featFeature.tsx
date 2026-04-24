import { Accessor, Component, createMemo, createSignal, Show } from "solid-js";
import { Feat, Markdown } from "../../../../../../shared";
import { Button, Cell, Column, Header, Table } from "coles-solid-library";
import style from "./featFeature.module.scss";

interface props {
    toggleValue: (ID: string) => void;
    getValue: Accessor<Record<string, string> | undefined>;
    allFeats: Accessor<Feat[]>;
}

export const FeatFeature: Component<props> = (props) => {

    const madValue = createMemo(() => props.getValue());
    const allFeats = createMemo(() => props.allFeats());

    

    const getMadValue = (key: string) => {
        return madValue()?.[key] ?? null;
    }

    const currentFeatID = createMemo(() => getMadValue("featID"));

    const [localID, setLocalID] = createSignal<string>(currentFeatID() ?? "");

    const isLearned = (id: string) => localID() === id;

    const getFeatByID = (id: string) => {
        const toReturn = allFeats().find(feat => feat.id === id);

        if (!toReturn) return null;
        
        return toReturn;
    };

    const columns = ['Name', 'Action'];

    const handleSubmit = () => {
        props.toggleValue(localID());
    }

    const CurrentDetails = createMemo(() => getFeatByID(localID())?.details ?? null);

    return <div class={`${style.wrapper}`}>
        <div>
            <p>
                Select a feat to be added by the change.
            </p>

            <div class={`${style.featTable}`}>
                <Table columns={columns} data={allFeats}>
                    <Column name="Name">
                        <Header>Name</Header>
                        <Cell<Feat>>
                            {feat => <span>
                                {feat.details.name}
                            </span>}
                        </Cell>
                    </Column>

                    <Column name="Action">
                        <Header>Learn</Header>
                        <Cell<Feat>>
                            {feat => <Button onClick={() => setLocalID(feat.id)}>{isLearned(feat.id) ? "Learned" : "Not Learned"}</Button>}
                        </Cell>
                    </Column>
                </Table>
            </div>

            <Button onClick={handleSubmit}>Set Feat</Button>
        </div>
        
        <Show when={CurrentDetails()}>
            <div>
                <h2>{CurrentDetails()?.name}</h2>

                <Markdown text={CurrentDetails()?.description ?? ""} />
            </div>
        </Show>
    </div>
}