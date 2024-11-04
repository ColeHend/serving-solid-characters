import { Component, Setter } from "solid-js";
import Modal from "../../../../../../shared/components/popup/popup.component";
import { SetStoreFunction } from "solid-js/store";
import { Subrace } from "../../../../../../models/race.model";

interface props {
    setClose: Setter<boolean>,
    setCurrentStore: SetStoreFunction<Subrace>,
    currentStore: Subrace
}

const StartingProf:Component<props> = (props) => {

    return <Modal title="Add A Proficencey" setClose={props.setClose}>
        <div>
            asga
        </div>
    </Modal>
}

export default StartingProf;