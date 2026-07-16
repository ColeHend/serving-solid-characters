import { Body } from "coles-solid-library";
import { Component, For, Show, onCleanup, onMount } from "solid-js";
import styles from "./about.module.scss";

import Li_Icon from "../../assets/LI-In-Bug.png";

// Portrait is loaded via glob so the build survives while the file hasn't been added yet;
// an empty match just means Slade falls back to the placeholder disc.
const portraitGlob = import.meta.glob("../../assets/slade_portrait.png", {
  eager: true,
  import: "default",
}) as Record<string, string>;
const sladePortrait: string | undefined = portraitGlob["../../assets/slade_portrait.png"];

const ABILITIES = ["STR", "DEX", "CON", "INT", "WIS", "CHA"] as const;
type Ability = typeof ABILITIES[number];

interface Developer {
  name: string;
  subtitle: string;
  traitTitle: string;
  traitText: string;
  linkedinUrl: string;
  linkedinLabel: string;
  scores: Record<Ability, number>;
  avatarSrc?: string;
  avatarText: string;
}

const developers: Developer[] = [
  {
    name: "Cole H.",
    subtitle: "Medium humanoid (developer), chaotic curious",
    traitTitle: "Innovator's Insight.",
    traitText: "A curious and innovative developer who loves the exploration and challenge of developing solutions — eager to bring that skillset wherever he works.",
    linkedinUrl: "https://www.linkedin.com/in/coleahenderson/",
    linkedinLabel: "Reach Cole on LinkedIn",
    scores: { STR: 10, DEX: 12, CON: 14, INT: 18, WIS: 15, CHA: 13 },
    avatarSrc: undefined,
    avatarText: "Cole",
  },
  {
    name: "Slade A.",
    subtitle: "Medium humanoid (developer), neutral driven",
    traitTitle: "Hands-On Learner.",
    traitText: "A passionate and imaginative developer with a strong desire to grow — eager to apply his skills to exciting projects and contribute to a dynamic team, continuously seeking new challenges both professionally and personally.",
    linkedinUrl: "https://www.linkedin.com/in/slade-anderson-b17826324/",
    linkedinLabel: "Reach Slade on LinkedIn",
    scores: { STR: 12, DEX: 14, CON: 13, INT: 16, WIS: 14, CHA: 16 },
    avatarSrc: sladePortrait,
    avatarText: "Slade",
  },
];

interface Credit {
  title: string;
  linkText?: string;
  href?: string;
  note?: string;
}

const credits: Credit[] = [
  {
    title: "Parchment Background",
    linkText: "Where we found it",
    href: "https://commons.wikimedia.org/wiki/File:Parchment.00.jpg",
  },
  {
    title: "Solbera's DnD Fonts",
    linkText: "Thanks to Solbera",
    href: "https://github.com/jonathonf/solbera-dnd-fonts",
  },
  {
    title: "LinkedIn's Logo",
    linkText: "Fair use page",
    href: "https://brand.linkedin.com/in-logo",
  },
  {
    title: "Backgrounds",
    note: "AI-generated (ChatGPT); every effort made to avoid infringing existing copyrights.",
  },
];

export const aboutPage:Component = () => {

  onMount(() => {
    document.body.classList.add("aboutUS-bg");
  })

  onCleanup(() => {
    document.body.classList.remove("aboutUS-bg");
  })

  return <Body class={`${styles.body}`}>
    <header class={styles.pageHeader}>
      <h1 class={styles.pageTitle}>About Us</h1>
      <p class={styles.tagline}>Roll initiative — meet the party behind the Arcane Dictionary.</p>
    </header>

    <div class={styles.cardsRow}>
      <For each={developers}>{(dev) =>
        <article class={styles.statblock}>
          <div class={styles.cardHeader}>
            <div class={styles.avatar}>
              <Show when={dev.avatarSrc} fallback={<span class={styles.avatarDisc}>{dev.avatarText}</span>}>
                <img class={styles.avatarImg} src={dev.avatarSrc} alt={dev.name} />
              </Show>
            </div>
            <div>
              <h2 class={styles.devName}>{dev.name}</h2>
              <p class={styles.devSubtitle}>{dev.subtitle}</p>
            </div>
          </div>

          <div class={styles.taperedDivider} role="presentation" />
          <div class={styles.abilityRow}>
            <For each={ABILITIES}>{(ability) =>
              <div class={styles.ability}>
                <span class={styles.abilityLabel}>{ability}</span>
                <span class={styles.abilityValue}>{dev.scores[ability]}</span>
              </div>
            }</For>
          </div>
          <div class={styles.taperedDivider} role="presentation" />

          <p class={styles.trait}>
            <span class={styles.traitLead}>{dev.traitTitle} </span>{dev.traitText}
          </p>

          <p class={styles.trait}>
            <span class={styles.traitLead}>Action — Send a Raven. </span>
            <a href={dev.linkedinUrl} target="_blank" rel="noreferrer" class={styles.linkedinLink}>
              {dev.linkedinLabel}<img src={`${Li_Icon}`} alt="" class={styles.liIcon} />
            </a>
          </p>
        </article>
      }</For>
    </div>

    <section class={styles.appendix}>
      <span class={styles.appendixOverline}>Appendix A</span>
      <h2 class={styles.appendixTitle}>Licenses &amp; Credits</h2>

      <h3 class={styles.creditHeading}>DnD 5.2 SRD</h3>
      <p class={styles.appendixText}>
          The System Reference Document 5.2 (“SRD 5.2”) is provided to you free of charge by Wizards of the Coast LLC
          (“Wizards”) under the terms of the Creative Commons Attribution 4.0 International License (“CC-BY-4.0”).
          You are free to use the content in this document in any manner permitted under CC-BY-4.0, provided that you
          include the following attribution statement in any of your work:
          This work includes material from the System Reference Document 5.2 (“SRD 5.2”) by Wizards of the Coast
          LLC, available at <a href="https://www.dndbeyond.com/srd" target="_blank" class={`${styles.underlineText}`}>https://www.dndbeyond.com/srd</a>. The SRD 5.2 is licensed under the Creative Commons
          Attribution 4.0 International License, available at <a href="https://creativecommons.org/licenses/by/4.0/legalcode" target="_blank" class={`${styles.underlineText}`}>https://creativecommons.org/licenses/by/4.0/legalcode</a>.
          Please do not include any other attribution to Wizards or its parent or affiliates other than that provided
          above. You may, however, include a statement on your work indicating that it is “compatible with fifth edition”
          or “5E compatible.”
          Section 5 of CC-BY-4.0 includes a Disclaimer of Warranties and Limitation of Liability that limits our liability
          to you.
      </p>

      <div class={styles.creditsGrid}>
        <For each={credits}>{(credit) =>
          <div class={styles.credit}>
            <h3 class={styles.creditHeading}>{credit.title}</h3>
            <Show when={credit.href} fallback={<p class={styles.appendixText}>{credit.note}</p>}>
              <p class={styles.appendixText}>
                <a href={credit.href} target="_blank" rel="noreferrer" class={`${styles.underlineText}`}>{credit.linkText}</a>
              </p>
            </Show>
          </div>
        }</For>
      </div>
    </section>

  </Body>
}
