import { Accessor, Component, createMemo } from "solid-js"
import { MiniStat } from "../MiniStat/MiniStat"
import { SheetDerived } from "../../useSheetDerived";
import { Badge, Bolt, DirectionsRun, Shield } from "coles-solid-library/icons";
import { signed } from "../../../../../../shared/customHooks/utility/tools/dndMath";
import styles from "../../sheet.module.scss";

interface props {
    derived: Accessor<SheetDerived>;
}

export const CombatRow:Component<props> = (props) => {
    const d = createMemo(() => props.derived());

    return <div class={styles.miniRow}>
      <MiniStat value={d().ac} label="Armor Class" sub={d().armorLabel || undefined} icon={Shield} />
      <MiniStat value={signed(d().initiative)} label="Initiative" icon={Bolt} />
      <MiniStat value={`${d().speed} ft.`} label="Speed" icon={DirectionsRun} />
      <MiniStat value={signed(d().profBonus)} label="Proficiency" icon={Badge} />
    </div>
}
