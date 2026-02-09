import { Accessor, Component, createMemo, createSignal, Setter, Show, splitProps, useContext } from "solid-js";
import { Spell } from "../../../../models";
import getUserSettings from "../../../customHooks/userSettings";
import { SharedHookContext } from "../../../../components/rootApp";
import { useUserStyles } from "../../../customHooks/utility/style/styleHook";
import style from "./spellModal.module.scss";
import { spellLevel, spellComponents } from "../../../customHooks/utility/tools/Tools";
import { Modal } from "coles-solid-library";
import Markdown from "../../MarkDown/MarkDown";

type props = {
  spell: Accessor<Spell>;
  backgroundClick: [Accessor<boolean>, Setter<boolean>];
};

const SpellModal: Component<props> = (props) => {
  
  const sharedHooks = useContext(SharedHookContext);
  const [{"0":showSpell, "1":setShowSpell}, other] = splitProps(props.backgroundClick, ["0","1"]);

  return (
    <Modal
      title={props.spell().name}
      show={[showSpell,setShowSpell]}
    >
      <div class={`${style.view}`}>
        {/* <h1>{props.spell().name}</h1> */}

        <h2>
          <span>
            {spellLevel(+props.spell().level)} {props.spell().school}
          </span>
        </h2>

        <h2>Casting time: <span>
          {props.spell().castingTime}  
        </span> </h2>

        <Show when={props.spell().range !== ""}>
          <h2>Range: <span>
            {props.spell().range}
          </span> </h2>
        </Show>

        <h2>Components: <span>
          {spellComponents(props.spell())}
        </span></h2>

        <Show when={props.spell().duration !== ""}>
          <h2>Duration: <span>
            {props.spell().duration}
          </span></h2>
        </Show>

        <Show when={props.spell().classes.length !== 0}>
          <h2>Classes: {props.spell().classes.join(", ")}</h2>
        </Show>

        <Show when={props.spell().subClasses.length > 0}>
          <h2>SubClasses: {props.spell().subClasses.join(", ")}</h2>
        </Show>

        <span>
          <Markdown 
            text={props.spell().description}
            class={`${style.desc}`}
          />
        </span>

      </div>
    </Modal>

  );
};
export default SpellModal