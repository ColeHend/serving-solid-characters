import { Accessor, Component, createSignal, Setter, Show} from "solid-js";
import styles from "./dataTransferModal.module.scss";
import Importing from "./Import/Importing";
import Exporting from "./Export/Exporting";
import { Modal, TabBar } from "coles-solid-library";

interface props {
  show: [Accessor<boolean>, Setter<boolean>]
}

const DataTransferModal:Component<props> = (props) => {
  const [activeTab, setActiveTab] = createSignal<number>(1);

  return <Modal title="File Exchange" show={props.show}>
    <div class={`${styles.body}`}>
      <TabBar tabs={["Import","Export"]} activeTab={activeTab()} onTabChange={(label,index)=>setActiveTab(index)}/>

      <Show when={activeTab() === 0}>
        <Importing />
      </Show>

      <Show when={activeTab() === 1}>
        <Exporting />
      </Show>
    </div>
  </Modal>
}

export default DataTransferModal;