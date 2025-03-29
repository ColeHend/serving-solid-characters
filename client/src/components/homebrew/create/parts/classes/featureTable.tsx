import { Component } from "solid-js";
import { LevelEntity } from "../../../../../models/class.model";
import { FormArray } from "coles-solid-library";
import styles from "./classes.module.scss";
interface FeatureTableProps {
  formArray: FormArray<LevelEntity[]>;
}
export const FeatureTable: Component<FeatureTableProps> = (props) => {
  return (
    <div class={`${styles.classSection}`}>
      <div>
        Feature Table
      </div>
      <div>
        <div>
          Features
        </div>
        <div>
          Casting
        </div>
      </div>
    </div>
  );
};