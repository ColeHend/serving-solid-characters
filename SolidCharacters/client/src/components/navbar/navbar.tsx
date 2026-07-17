import { Accessor, Component, Show, createSignal, Setter, splitProps, createMemo } from "solid-js";
import navStyles from './navbar.module.scss';
import { A } from "@solidjs/router";
import { Button, Container, Icon } from "coles-solid-library";
import DataTransferModal from "../DataTransfering/dataTransferModal";
import { Dictionary, FileExport, Menu } from "coles-solid-library/icons";
import GrimoireNavButton from "./GrimoireNavButton";
import UpdateSrdNavButton from "./UpdateSrdNavButton";
import { isAiConfigured } from "../../shared/customHooks/userSettings";
import { RulesDictionary } from "../../shared/components/modals/rulesDictionary/rulesDictionary";
import { srdUpdateAvailable } from "../../pwa/offline/srdVersion";
import { useOnline } from "../../shared/customHooks/utility/useOnline";

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
    Link?: string;
}

const Navbar: Component<Props> = (props) => {
  const [showDataTransfer, setShowDataTransfer] = createSignal(false);
  const [showRulesDict, setShowRulesDict] = createSignal(false);
  const [local, other] = splitProps(props, ["list"]);
  const online = useOnline();

  return (
    <Container theme="header"  class={`${navStyles.navbar}`}>
      <div class={`${other.style ?? ''}`}>
        <span class={navStyles.siteTitle}>
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
            title='Rules Dictionary'
            onClick={() => setShowRulesDict(old => !old)}>
              <Icon icon={Dictionary} size="large"></Icon>
            </Button>

          <Button 
            transparent
            title='Import & Export'  
            onClick={() => setShowDataTransfer(old => !old)}>
            <Icon icon={FileExport} size="large"></Icon>
          </Button>

          <Show when={isAiConfigured()}>
            <GrimoireNavButton />
          </Show>

          <Show when={srdUpdateAvailable() && online()}>
            <UpdateSrdNavButton />
          </Show>

          <Button transparent ref={props.setAnchor} onClick={()=>(local.list[1](true))} >
            <Icon icon={Menu} size="large" />
          </Button>
        </div>
                
      </div>

      <Show when={showRulesDict()}>
        <RulesDictionary show={showRulesDict} setShow={setShowRulesDict} />
      </Show>
      
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