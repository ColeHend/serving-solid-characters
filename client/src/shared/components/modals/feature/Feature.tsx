import { Accessor, Component, createSignal, Setter } from "solid-js";
import { Feature } from "../../../../models/core.model";
import { Clone } from "../../..";
import Modal from "../../popup/popup.component";
import style from "./Feature.module.scss";

type props = {
	currentFeature: Accessor<Feature<unknown, string>>;
	accesor: Accessor<boolean>;
	settor: Setter<boolean>;
}

const FeatureHover: Component<props> = (props) => {
		
	const feature = props.currentFeature;

	
	return (<Modal backgroundClick={[props.accesor,props.settor]} title={feature().name }>
		<div class={`${style.flexBox}`}>
			<h1>{feature().name}</h1>

			<span>
				
				{Clone(feature()).name}
			</span>
		</div>
	</Modal>)
};

export default FeatureHover;