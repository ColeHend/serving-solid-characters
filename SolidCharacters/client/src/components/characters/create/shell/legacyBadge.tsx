import { Component } from "solid-js";
import styles from "./legacyBadge.module.scss";

/** "Legacy" chip for 2014 rows in both-mode lists. Callers gate rendering on edition + legacy. */
export const LegacyBadge: Component = () => <span class={styles.legacyBadge}>Legacy</span>;
