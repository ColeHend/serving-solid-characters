import { Accessor, Component, For, Match, Setter, Switch } from "solid-js";
import { Feat, PrerequisiteType } from "../../../../models/data";
import style from "./featView.module.scss";
import { Modal } from "coles-solid-library";

interface props {
  feat: Accessor<Feat>;
  show: [Accessor<boolean>,Setter<boolean>];
  width:string;
  height:string;
}

const FeatView: Component<props> = (props) => {
  const currentFeat = props.feat;
  const [showMenu,setShowMenu] = props.show;

  return (
    <Modal 
      title={currentFeat()?.details.name} 
      show={[showMenu,setShowMenu]}>

      <div class={`${style.featWrapper}`}>
        <h1 class={`${style.nameHeader}`}>{currentFeat().details.name}</h1>

        <div class={`${style.preRequisites}`}>
          <For each={currentFeat().prerequisites}>
            {(preReq) => (
              <div>
                <div>{PrerequisiteType[`${preReq.type}`]}</div>
                
                <span>{preReq.value}</span>
              </div>
            )}
          </For>
        </div>

        <div class={`${style.description}`}>
            {currentFeat().details.description}
        </div>
      </div>
    </Modal>
  );
};
export default FeatView; 