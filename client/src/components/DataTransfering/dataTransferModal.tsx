import { Accessor, Component, Setter, useContext } from "solid-js";
import styles from "./dataTransferModal.module.scss";
import { Tab, Tabs } from "../../shared";
import Importing from "./Import/Importing";
import Exporting from "./Export/Exporting";
import { SharedHookContext } from "../rootApp";
import { Modal } from "coles-solid-library";

interface props {

    show: [Accessor<boolean>, Setter<boolean>]
}

const DataTransferModal:Component<props> = (props) => {
  const sharedContext = useContext(SharedHookContext);

  return <Modal title="File Exchange" show={props.show} width={sharedContext.isMobile()?`99%`:""} height={sharedContext.isMobile()?"95%":""}>
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