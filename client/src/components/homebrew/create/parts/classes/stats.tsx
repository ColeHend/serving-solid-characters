import { FormField, Option, Select } from "coles-solid-library";
import { Component } from "solid-js";
import { Stat } from "../../../../../shared/models/stats";
import styles from "./classes.module.scss";
export const Stats: Component = () => {
  return (
    <div class={`${styles.classSection}`}>
      <div class={`${styles.fieldSizeMd}`}>
        <FormField name="Hit Die" formName="hitDie">
          <Select>
            <Option value={4}>d4</Option>
            <Option value={6}>d6</Option>
            <Option value={8}>d8</Option>
            <Option value={10}>d10</Option>
            <Option value={12}>d12</Option>
          </Select>
        </FormField>
      </div>
      <div class={`${styles.fieldSizeLg}`}>
        <FormField name="Primary Stat" formName="primaryStat">
          <Select>
            <Option value={Stat.STR}>Strength</Option>
            <Option value={Stat.DEX}>Dexterity</Option>
            <Option value={Stat.CON}>Constitution</Option>
            <Option value={Stat.INT}>Intelligence</Option>
            <Option value={Stat.WIS}>Wisdom</Option>
            <Option value={Stat.CHA}>Charisma</Option>
          </Select>
        </FormField>
      </div>
    </div>
  );
};