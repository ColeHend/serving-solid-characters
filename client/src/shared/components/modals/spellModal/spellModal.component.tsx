import { Accessor, Component, createMemo, createSignal, Setter, Show, splitProps, useContext } from "solid-js";
// import Modal from "../../popup/popup.component";
import { Spell } from "../../../../models";
import getUserSettings from "../../../customHooks/userSettings";
import { SharedHookContext } from "../../../../components/rootApp";
import { useUserStyles } from "../../../customHooks/utility/style/styleHook";
import style from "./spellModal.module.scss";
import { spellLevel, spellComponents } from "../../../customHooks/utility/tools/Tools";
import { Modal } from "coles-solid-library";

type props = {
  spell: Accessor<Spell>;
  backgroundClick: [Accessor<boolean>, Setter<boolean>];
};

const SpellModal: Component<props> = (props) => {
  
  const sharedHooks = useContext(SharedHookContext);
  const [{"0":showSpell, "1":setShowSpell}, other] = splitProps(props.backgroundClick, ["0","1"]);


   const checkForComponents = (spell: Spell) => {
    const returnarr:string[] = [];
    
    if (spell.isSomatic) {
      returnarr.push("S");
    }
    if (spell.isVerbal) {
      returnarr.push("V");
    }
    if (spell.isMaterial) {
      returnarr.push("M");
    }

    return returnarr;
  }

  return (
    <Modal
      title={props.spell().name}
      width={sharedHooks.isMobile() ? "90%" : "50%"} // fuck with it
      height={sharedHooks.isMobile() ? "90%" : "47%"} // fuck with it
      show={[showSpell,setShowSpell]}
    >
      <div class={`${style.view}`}>
        {/* <h1>{props.spell().name}</h1> */}

        <h2>
          {spellLevel(props.spell().level)} {props.spell().school}
        </h2>

        <h2>Casting time: {props.spell().castingTime} </h2>

        <Show when={props.spell().range !== ""}>
          <h2>Range: {props.spell().range} </h2>
        </Show>

        <h2>Component: {checkForComponents(props.spell())}</h2>

        <Show when={props.spell().duration !== ""}>
          <h2>Duration: {props.spell().duration}</h2>
        </Show>

        <Show when={props.spell().classes.length !== 0}>
          <h2>Classes: {props.spell().classes.join(", ")}</h2>
        </Show>

        <Show when={props.spell().subClasses.length > 0}>
          <h2>SubClasses: {props.spell().subClasses.join(", ")}</h2>
        </Show>

        <span>{props.spell().desc}</span>

        <Show when={!!props.spell().higherLevel}>
          <h4>At Higher Levels: </h4> <span>{props.spell().higherLevel}</span>
        </Show>
      </div>
    </Modal>

  );
};
export default SpellModal