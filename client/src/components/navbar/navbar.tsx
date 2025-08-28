import { Accessor, Component, Show, createSignal, Setter, createMemo, splitProps } from "solid-js";
import navStyles from './navbar.module.scss';
import {  effect, style } from "solid-js/web";
import { A } from "@solidjs/router";
import useStyles from "../../shared/customHooks/utility/style/styleHook";
import getUserSettings from "../../shared/customHooks/userSettings";
import { Button, Container, Icon } from "coles-solid-library";
import DataTransferModal from "../DataTransfering/dataTransferModal";

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
  const [showDataTransfer, setShowDataTransfer] = createSignal(false);
  const [local, other] = splitProps(props, ["list"]);

  return (
    <Container theme="header"  class={`${navStyles.navbar}`}>
      <div class={`${other.style ?? ''}`}>
        <span>
          <A href="/">
            Arcane Dictionary
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
          {/* <Button onClick={()=>setShowDamageCalc(!showDamageCalc())} title="damage calculator">
            <Calculator />
          </Button> */}

          <Button 
            transparent
            title='Import & Export'  
            onClick={() => setShowDataTransfer(!showDataTransfer())}>
            <Icon color="white" name="file_export" size="large"></Icon>
          </Button>

        

          <Button transparent ref={props.setAnchor} onClick={()=>(local.list[1](true))} >
            <Icon  color="white" name="menu" size="large" />
          </Button>
        </div>
                
      </div>

      
      <Show when={showDataTransfer()}>
        <DataTransferModal show={[showDataTransfer,setShowDataTransfer]} />
      </Show>

      {/* <Show when={showDamageCalc()}>
        <DamageCalulator setter={setShowDamageCalc} accssor={showDamageCalc} />
      </Show> */}
    </Container>
  )
}
export default Navbar;