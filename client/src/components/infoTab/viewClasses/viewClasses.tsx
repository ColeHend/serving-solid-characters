import { Component, For, Show, Switch, Match, createSignal, createMemo, Accessor, useContext } from "solid-js";
import ExpansionPanel from "../../../shared/components/expansion/expansion";
import FeatureTable from "../../../shared/components/modals/classModal/featureTable/featureTable";
import useGetClasses from "../../../shared/customHooks/data/useGetClasses";
import useStyle from "../../../shared/customHooks/utility/style/styleHook";
import styles from "./viewClasses.module.scss"
import { useSearchParams, useParams } from "@solidjs/router";
import { effect } from "solid-js/web";
import type { DnDClass } from "../../../models";
import Carousel from "../../../shared/components/Carosel/Carosel";
import { Feature } from "../../../models/core.model";
import { Subclass } from "../../../models/class.model";
import Button from "../../../shared/components/Button/Button";
import { SharedHookContext } from "../../rootApp";
import useStyles from "../../../shared/customHooks/utility/style/styleHook";
import getUserSettings from "../../../shared/customHooks/userSettings";
import ClassModal from "../../../shared/components/modals/classModal/classModal.component";
import { Body } from "../../../shared";
import Table from "../../../shared/components/Table/table";
import { Cell, Column, Header } from "../../../shared/components/Table/innerTable";


const viewClasses: Component = () => {
    const sharedHooks = useContext(SharedHookContext);
    const [userSettings, setUserSettings] = getUserSettings();
    const stylin = createMemo(()=>useStyles(userSettings().theme));
    const dndSrdClasses = useGetClasses();
    const [searchParam, setSearchParam] = useSearchParams();
    const selectedClass = dndSrdClasses().findIndex((val) => val.name.toLowerCase() === searchParam.name?.toLowerCase());
    const [currentClassIndex, setCurrentCharacterIndex] = createSignal<number>(selectedClass >= 0 ? selectedClass : 0);

    if (!!!searchParam.name) setSearchParam({ name: dndSrdClasses().length > 0 ? dndSrdClasses()[currentClassIndex()].name : "barbarian" })

    // const currentClass: Accessor<DnDClass> = createMemo(() => 
		// 	dndSrdClasses()?.length > 0 && currentClassIndex() >= 0 && currentClassIndex() < dndSrdClasses()?.length ? dndSrdClasses()[currentClassIndex()] : ({} as DnDClass))
		const [currentClass, setCurrentClass] = createSignal<DnDClass>({} as DnDClass);
    const currentSubclasses = createMemo(() => currentClass()?.subclasses?.length > 0 ? currentClass()?.subclasses : [] as Subclass[])
		const [showClass, setShowClass] = createSignal<boolean>(false);

    effect(() => {
        setSearchParam({ name: dndSrdClasses()?.length > 0 ? currentClass().name : "barbarian" })
        console.table(currentClass());
				console.log(dndSrdClasses());
    })

    return (
        <Body class={`${stylin()?.primary} ${styles.CenterPage}`}>
            {/* Current Class Selector */}
            <Table data={dndSrdClasses} columns={["name"]}>
								<Column name="name">
									<Header>Name</Header>
									<Cell<DnDClass>>{(x, i) => <span onClick={() => {
										setCurrentClass(x);
										setSearchParam({ name: x.name });
										setShowClass(!showClass());
									}}>{x.name}</span>}</Cell>
								</Column>
						</Table>
						<Show when={showClass()}>
								<ClassModal boolean={showClass} booleanSetter={setShowClass} currentClass={currentClass} />
						</Show>
        </Body>
    )
};
export default viewClasses