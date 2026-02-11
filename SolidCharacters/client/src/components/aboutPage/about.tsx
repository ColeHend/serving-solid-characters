import { Body, Container, Icon } from "coles-solid-library";
import { Component } from "solid-js";
import styles from "./about.module.scss";

import Li_Icon from "../../assets/LI-In-Bug.png";

export const aboutPage:Component = () => {

  return <Body class={`${styles.body}`}>
    <h1>About Us</h1>
    <h2>
      <a href="https://www.linkedin.com/in/coleahenderson/" target="_blank" class={`${styles.Icon}`}>
        <img src={`${Li_Icon}`} alt="Linkedin" />
      </a>    
      <span>Cole H. </span>
    </h2>
    <p>
        a curious and innovative developer. loves the exploration and/or challenges and development of solutions. eager to add this skillset to the employers' environments where ever he works.
    </p>

    

    <h2>
      <a href="https://www.linkedin.com/in/slade-anderson-b17826324/" target="_blank" class={`${styles.Icon}`}>
        <img src={`${Li_Icon}`} alt="Linkedin" />
      </a>
      <span>Slade A.</span>
    </h2>
    <p>
        a passionate and imaginative developer As Well as a hands on learner with a strong desire to learn. eager to apply skills and knowledge to exciting projects and contribute to a dynamic team. I'm continuously seeking new challenges and opportunities to grow both professionally and personally
    </p>

    <h1>Attributions</h1>
    <h2>Dnd 5.2 Srd</h2>
    <p>
        The System Reference Document 5.2 (“SRD 5.2”) is provided to you free of charge by Wizards of the Coast LLC
        (“Wizards”) under the terms of the Creative Commons Attribution 4.0 International License (“CC-BY-4.0”).
        You are free to use the content in this document in any manner permitted under CC-BY-4.0, provided that you
        include the following attribution statement in any of your work:
        This work includes material from the System Reference Document 5.2 (“SRD 5.2”) by Wizards of the Coast
        LLC, available at <a href="https://www.dndbeyond.com/srd" target="_blank">https://www.dndbeyond.com/srd</a>. The SRD 5.2 is licensed under the Creative Commons
        Attribution 4.0 International License, available at <a href="https://creativecommons.org/licenses/by/4.0/legalcode" target="_blank">https://creativecommons.org/licenses/by/4.0/legalcode</a>.
        Please do not include any other attribution to Wizards or its parent or affiliates other than that provided
        above. You may, however, include a statement on your work indicating that it is “compatible with fifth edition”
        or “5E compatible.”
        Section 5 of CC-BY-4.0 includes a Disclaimer of Warranties and Limitation of Liability that limits our liability
        to you.
    </p>
    <h2>Parchment background</h2>
    <p>
      <a href="https://commons.wikimedia.org/wiki/File:Parchment.00.jpg" target="_blank">Where we Found it.</a>
    </p>
    <h2>Solbera's dnd fonts</h2>
    <p>
      <a href="https://github.com/jonathonf/solbera-dnd-fonts" target="_blank">Thanks to Solbera for the awesome fonts.</a>
    </p>
    <h2>Linkedin's Logo</h2>
    <p>
      <a href="https://brand.linkedin.com/in-logo" target="_blank">Fair use page</a>
    </p>
  </Body>
}