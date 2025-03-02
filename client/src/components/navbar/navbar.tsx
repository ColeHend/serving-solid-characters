import { Accessor, Component, Show, createSignal, Setter, createMemo, splitProps } from "solid-js";
import navStyles from './navbar.module.scss';
import {  effect } from "solid-js/web";
import { A } from "@solidjs/router";
import Button from "../../shared/components/Button/Button";
import BarMenu from "../../shared/svgs/barMenu";
import useStyles from "../../shared/customHooks/utility/style/styleHook";
import getUserSettings from "../../shared/customHooks/userSettings";
import { Calculator } from "../../shared/svgs/calulator";
import DamageCalulator from "../../shared/components/modals/damageCalculator/damageCalculator";

type Props = {
    style?: CSSModuleClasses[string],
    siteName?: string,
    links?: Tab[]
    list: [Accessor<boolean>, Setter<boolean>];
    isMobile: boolean;
};

export interface Tab {
    Name: string;
    Link: string;
}

const Navbar: Component<Props> = (props) => {
  const [userSettings] = getUserSettings();
  const stylin = createMemo(()=>useStyles(userSettings().theme));
  const [showDamageCalc,setShowDamageCalc] = createSignal(false);
  const [{"list":[, setShowList]}, other] = splitProps(props, ["list"]);

  effect(()=>{
    if (other.isMobile) setShowList(false);
  });
  return (
    <div class={`${stylin()?.primary} ${navStyles.navbar}`}>
      <div  class={`${other.style ?? ''}`}>
        <span>
          <A href="/">
                        MySite
          </A>
        </span>

        <ul style={other.isMobile ? {margin: "0 auto", width: "min-content"} :{}}>
          <Show when={other.isMobile}>
            <li >
              <div>
                <A href="/">
                                        MySite
                </A>
              </div>
            </li> 
          </Show>
        </ul>

        <div class={`${navStyles.toolBar}`}> 
          <Button onClick={()=>setShowDamageCalc(!showDamageCalc())} title="damage calculator">
            <Calculator />
          </Button>
        </div>
                
        <Button onClick={()=>setShowList(old => !old)} >
          <BarMenu />
        </Button>
      </div>


      <Show when={showDamageCalc()}>
        <DamageCalulator setter={setShowDamageCalc} accssor={showDamageCalc} />
      </Show>
    </div>
  )
}
export default Navbar;