import { Component, createMemo } from "solid-js";
import Markdown from "../../../MarkDown/MarkDown";
import styles from "./description.module.scss";

interface props {
    text?: string;
}

export const Description:Component<props> = (props) => {

    const desc = createMemo(() => props.text?.trim() ?? "");

    const getFirstCharacter = (text: string) => {
        if (!text || text.length === 0) return "";

        return text.charAt(0);
    }
    
    const getDescription = (text: string) => {
        if (!text || text.length === 0) return "";

        const firstChar = getFirstCharacter(text);

        const description = `<span class="${styles.bigLetter}">${firstChar}</span>${text.substring(1)}`;

        return description;
    }

    const description = createMemo(() => getDescription(desc()));

    return <Markdown text={description()} />
}