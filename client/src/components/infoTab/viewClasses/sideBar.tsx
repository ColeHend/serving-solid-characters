import { Accessor, Component, createSignal, For } from "solid-js"
import { DnDClass } from "../../../models"

type Props = { 
    srdClasses: Accessor<DnDClass[]>
}

const classesSideBar:Component<Props> = (props) => {
    const [shown, setShown] = createSignal(false);
    const srdClasses = props.srdClasses();

    const [RowShown, SetRowShown] = createSignal<number[]>([]);
    const toggleRow = (index: number) =>
      !hasIndex(index)
        ? SetRowShown([...RowShown(), index])
        : SetRowShown(RowShown().filter((i) => i !== index));
    const hasIndex = (index: number) => RowShown().includes(index);

    return (
        <div>
            <For each={srdClasses}>
                {(item) =>
                    <div id="classSideBar" >

                    </div>
                }
            </For>
        </div>
    )
}