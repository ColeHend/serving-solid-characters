import { Accessor, Component } from "solid-js";
import { Item } from "../../../../../models/data";
import { Body } from "coles-solid-library";
import styles from "./weaponsView.module.scss";

interface viewProps {
    items: Accessor<Item[]>;
}

export const WeaponsView:Component<viewProps> = (props) => {

    return <Body class={`${styles.viewBody}`}>
        <div>
            search Bar
        </div>

        <div>
            table
        </div>

        <div>
            paginator
        </div>
        
        <div>
            item modal
        </div>
    </Body>
}