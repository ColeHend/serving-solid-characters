import { Accessor, Component, Show, createSignal, Setter, createMemo, splitProps } from "solid-js";
import navStyles from './navbar.module.scss';
import {  effect } from "solid-js/web";
import { A } from "@solidjs/router";
import BarMenu from "../../shared/svgs/barMenu";
import useStyles from "../../shared/customHooks/utility/style/styleHook";
import getUserSettings from "../../shared/customHooks/userSettings";
import { Calculator } from "../../shared/svgs/calulator";
import DamageCalulator from "../../shared/components/modals/damageCalculator/damageCalculator";
import { Button, Container, Icon } from "coles-solid-library";

type Props = {
    style?: CSSModuleClasses[string],
    siteName?: string,
    links?: Tab[]
    list: [Accessor<boolean>, Setter<boolean>];
    isMobile: boolean;
    setAnchor: Setter<HTMLElement | undefined>;
};

export interface Tab {
    Name: string;
    Link: string;
}

const Navbar: Component<Props> = (props) => {
  const [userSettings] = getUserSettings();
  const [showDamageCalc,setShowDamageCalc] = createSignal(false);
  const [local, other] = splitProps(props, ["list"]);

  return (
    <Container theme="header"  class={`${navStyles.navbar}`}>
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

          <Button transparent ref={props.setAnchor} onClick={()=>(local.list[1](true))} >
            <Icon  color="white" name="menu" size="large" />
          </Button>
        </div>
                
      </div>


      <Show when={showDamageCalc()}>
        <DamageCalulator setter={setShowDamageCalc} accssor={showDamageCalc} />
      </Show>
    </Container>
  )
}
export default Navbar;