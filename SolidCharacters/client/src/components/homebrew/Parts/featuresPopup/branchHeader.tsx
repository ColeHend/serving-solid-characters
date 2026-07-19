import { Component } from "solid-js";
import { Input } from "coles-solid-library";
import styles from "./featuresPopup.module.scss";

interface BranchHeaderProps {
    group: number;
    label: string;
    onRename: (label: string) => void;
}

/** Section header for one mutually-exclusive effect branch: number badge + editable name. */
export const BranchHeader: Component<BranchHeaderProps> = (props) => (
    <div class={styles.branchHead}>
        <span class={styles.branchBadge}>Branch {props.group}</span>
        <div class={`${styles.underlineField} ${styles.branchLabelInput}`}>
            <Input
                transparent
                value={props.label}
                onChange={(e) => props.onRename(e.currentTarget.value.trim())}
                placeholder="Name this branch (e.g. Drow)"
                aria-label={`Branch ${props.group} name`}
            />
        </div>
    </div>
);
