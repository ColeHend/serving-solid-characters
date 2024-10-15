import { Accessor, Component, Setter } from "solid-js";
import Modal from "../../shared/components/popup/popup.component";
import styles from "./dataTransferModal.module.scss";
import { Tab, Tabs } from "../../shared";
import Importing from "./Import/Importing";
import Exporting from "./Export/Exporting";
import { useSearchParams } from "@solidjs/router";

interface props {

    setBackClick: Setter<boolean>
}

const DataTransferModal:Component<props> = (props) => {

    return <Modal title="File Exchange" setClose={props.setBackClick}>
        <div class={`${styles.Wrapper}`}>
            <Tabs transparent>
                <Tab name="Import">
                    <Importing />
                </Tab>
                <Tab name="Export">
                    <Exporting />
                </Tab>
            </Tabs>

        </div>
    </Modal>
}

export default DataTransferModal;