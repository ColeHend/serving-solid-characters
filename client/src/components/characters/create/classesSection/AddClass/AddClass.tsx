import { Cell, Column, Header, Modal, Row, Table } from "coles-solid-library";
import { Accessor, Component, Setter } from "solid-js";
import { Class5E } from "../../../../../models/data";
import { charClasses } from "../classesSection";
import styles from "./AddClass.module.scss";

interface modalProps {
    show: [Accessor<boolean>,Setter<boolean>];
    allClasses: Accessor<Class5E[]>;
    setCharClasses: Setter<charClasses[]>;
}

export const AddClass: Component<modalProps> = (props) => {
    const [show,setshow] = props.show;

    return <Modal show={props.show} title="Add a class">
        <div class={`${styles.AddClassTable}`}>
            <Table data={props.allClasses} columns={["name","hitdie"]}>
                <Column name="name">
                    <Header>Name</Header>
                    <Cell<Class5E>>
                        {(class5e) => <span>
                            {class5e.name}
                        </span>}
                    </Cell>
                </Column>

                <Column name="hitdie">
                    <Header>Hit Die</Header>
                    <Cell<Class5E>>
                        {(class5e)=><span>
                            {class5e.hitDie}
                        </span>}
                    </Cell>
                </Column>

                <Row onClick={(e,class5e: Class5E)=>{
                    props.setCharClasses(old => [...old,{
                        className: class5e.name
                    }])
                    setshow(false);
                }}/>
            </Table>
        </div>
    </Modal>
}