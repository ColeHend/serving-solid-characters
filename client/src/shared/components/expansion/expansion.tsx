import {type Component, For, Show, createSignal, JSX, Accessor,Setter, useContext, createMemo} from "solid-js";
import useStyle from "../../../shared/customHooks/utility/style/styleHook";
import styles from './expansion.module.scss';
import Button from "../Button/Button";
import { DownArrow, UpArrow } from "../../svgs/arrows";
import { SharedHookContext } from "../../../components/rootApp";
import useStyles from "../../../shared/customHooks/utility/style/styleHook";
import getUserSettings from "../../customHooks/userSettings";

type Props = {
    children: [JSX.Element, JSX.Element],
    styles?: CSSModuleClasses,
    extraLogic?: () => void,
    startOpen?: boolean,
    [key:string]: any,
		arrowSize?: {
			width: string;
			height: string;
		}
}
const ExpansionPanel: Component<Props> = (props)=>{
  const[open, setOpen] = createSignal(!!props.startOpen);
  const [userSettings, setUserSettings] = getUserSettings();
  const sharedHooks = useContext(SharedHookContext);
  const stylin = createMemo(()=>useStyles(userSettings().theme));
  return (
    <div class={`${styles.totalPanel} ${props.styles}`} {...props}>
      <div class={`${stylin()?.accent} ${styles.header}`}>
        <span style={{
          width: 'min-content',
          height: 'min-content',
        }}>
          {props.children[0]}
        </span>
        <Button
          style={{
            width: 'min-content',
            height:'min-content',
            padding: '0px',
            margin: '0px',
          }} 
          onClick={()=>{
            setOpen(old =>!old);
            props.extraLogic ? props.extraLogic() : null 
          }} 
          class={`${stylin()?.hover}`}
        >
          <Show when={!open()}>
            <DownArrow style={{padding:'0px',margin:'0px'}} width={props.arrowSize?.width} height={props.arrowSize?.height} />
          </Show>
          <Show when={open()}>
            <UpArrow style={{padding:'0px',margin:'0px'}} width={props.arrowSize?.width} height={props.arrowSize?.height} />
          </Show>
        </Button>
      </div>
      <Show when={open()}>
        <div class={`${stylin()?.accent} ${styles.body}`}>
          {props.children[1]}
        </div>
      </Show>
    </div>
  )
}
export { ExpansionPanel };
export default ExpansionPanel;