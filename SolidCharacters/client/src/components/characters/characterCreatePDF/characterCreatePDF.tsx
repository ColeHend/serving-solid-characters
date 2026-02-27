import { Body } from "coles-solid-library";
import { Component } from "solid-js";
import { characterManager } from "../../../shared";

export const CreateCharacterPDF: Component = () => {
    const characters = characterManager.characters();

    const character = characterManager.getCharacter(characters[0].name);


    return <Body>
        
        hello: {character?.name ?? "Bob"};

    </Body>

}