import { Component, For, createSignal } from "solid-js";
import useStyle from "../../shared/customHooks/utility/style/styleHook";
import styles from "./characters.module.scss";
import { Feature } from "../../models/core.model";
import useCharacters, { Character } from "../../shared/customHooks/dndInfo/useCharacters";
import Button, { MenuButton } from "../../shared/components/Button/Button";


const Characters: Component = () => {
    const stylin = useStyle();
    const [characters, setCharacters] = useCharacters();
    const menuButtons = (character: Character) => ([
        {
            name: "View Character",
            action: ()=>{window.location.href = `/characters/view?name=${character.name}`}
        }
    ]);
    return (
        <div class={`${stylin.accent} ${styles.mainBody}`}>
            <h1 style={{margin: "0 auto", width: "min-content"}}>Characters</h1>
            <div>
                <table style={{width: "50%", margin: "0 auto"}}>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Race</th>
                            <th>Background</th>
                            <th>Level</th>
                            <th>Class</th>
                            <th>Subclass</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        <For each={characters()}>{(character: Character) => (
                            <tr>
                                    <td>{character.name}</td>
                                    <td>{character.race}</td>
                                    <td>{character.background}</td>
                                    <td>{character.level}</td>
                                    <td>{character.class}</td>
                                    <td>{character.subclass}</td>
                                    <td>
                                        <Button enableBackgroundClick={true} menuItems={menuButtons(character)}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 6a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm0 6a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm0 6a2 2 0 1 1 0 4 2 2 0 0 1 0-4z"/></svg>
                                        </Button>
                                    </td>
                            </tr>
                        )}</For>
                    </tbody>
                </table>
            </div>
        </div>
    )
};

export default Characters;