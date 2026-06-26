import { Accessor, Component, Show, createSignal, Setter, splitProps } from "solid-js";
import navStyles from './navbar.module.scss';
import { A } from "@solidjs/router";
import { Button, Container, Icon } from "coles-solid-library";
import DataTransferModal from "../DataTransfering/dataTransferModal";
import { FileExport, Menu } from "coles-solid-library/icons";
import SparkIcon from "../../shared/components/aiSpark/sparkIcon";
import { aiAssistant } from "../../shared/customHooks/aiAssistant";
import { isAiConfigured } from "../../shared/customHooks/userSettings";

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
        
        </ul>

        <div class={`${navStyles.toolBar}`}> 
          {/* <Button onClick={()=>setShowDamageCalc(!showDamageCalc())} title="damage calculator">
            <Calculator />
          </Button> */}

          <Button 
            transparent
            title='Import & Export'  
            onClick={() => setShowDataTransfer(!showDataTransfer())}>
            <Icon icon={FileExport} size="large"></Icon>
          </Button>

          <Show when={isAiConfigured()}>
            <Button transparent title="Grimoire AI" onClick={() => aiAssistant.toggle()}>
              <SparkIcon size={24} />
            </Button>
          </Show>

          <Button transparent ref={props.setAnchor} onClick={()=>(local.list[1](true))} >
            <Icon icon={Menu} size="large" />
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