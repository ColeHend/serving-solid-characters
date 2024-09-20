import { Accessor, Component, createMemo, createSignal, Setter, Show, splitProps, useContext } from "solid-js";
import Modal from "../../popup/popup.component";
import { Spell } from "../../../../models";
import getUserSettings from "../../../customHooks/userSettings";
import { SharedHookContext } from "../../../../components/rootApp";
import { useUserStyles } from "../../../customHooks/utility/style/styleHook";
import style from "./spellModal.module.scss";
import { spellLevel, spellComponents } from "../../../customHooks/utility/Tools";

type props = {
  spell: Accessor<Spell>;
  backgroundClick: [Accessor<boolean>, Setter<boolean>];
};

const SpellModal: Component<props> = (props) => {
  
  const sharedHooks = useContext(SharedHookContext);
  const [{"0":showSpell, "1":setShowSpell}, other] = splitProps(props.backgroundClick, ["0","1"]);
  const currentSpell = () => props.spell();
  const stylin = useUserStyles();

  return (
    <Modal
        title={currentSpell().name}
        width={sharedHooks.isMobile() ? "100%" : "98%"} // fuck with it
        height={sharedHooks.isMobile() ? "100%" : "87%"} // fuck with it
        backgroundClick={[showSpell,setShowSpell]}
    >
        <div class={`${style.view}`}>
            <div>
            <h1>{currentSpell().name}</h1>

            <h2>
                {spellLevel(currentSpell().level)} {currentSpell().school}
            </h2>

            <h2>Casting time: {currentSpell().castingTime} </h2>

            <h2>Range: {currentSpell().range} </h2>

            <h2>Component: {spellComponents(currentSpell())}</h2>

            <h2>Duration: {currentSpell().duration}</h2>

            <h2>Classes: {currentSpell().classes.join(", ")}</h2>

            <h2>SubClasses: {currentSpell().subClasses.join(", ")}</h2>

            <span>{currentSpell().desc}</span>

            <Show when={!!currentSpell().higherLevel}>
                <h4>At Higher Levels: </h4> <span>{currentSpell().higherLevel}</span>
            </Show>
            </div>
        </div>
    </Modal>

  );
};
export default SpellModal