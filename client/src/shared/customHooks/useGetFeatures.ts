import { createMemo } from "solid-js"
import useGetClasses from "./data/useGetClasses"
import useGetFeats from "./data/useGetFeats"
import { Feature, FeatureTypes } from "../../models/core.model"
import { GetFeatureType, UniqueSet } from "./utility/Tools"
import useGetBackgrounds from "./data/useGetBackgrounds"
import useGetItems from "./data/useGetItems"
import { n, V } from "@vite-pwa/assets-generator/shared/assets-generator.5e51fd40"

const useGetFeatures = () => {
	const allClasses = useGetClasses()
	const allFeats = useGetFeats()
	const allBackgrounds = useGetBackgrounds()
	const allItems = useGetItems();
	const allFeatures = createMemo(() => {
		const classes = allClasses();
		const feats = allFeats();

		const classFeatures = classes
			.flatMap((c) => c.classLevels)
			.flatMap((l) => l.features);
		const subclassFeatures = classes
			.flatMap((c) => c.subclasses)
			.flatMap((s) => s.features);
		const featsFeatures = feats
			.flatMap((f) => ({
				name: f.name,
				value: f.desc,
				info: {
					type: FeatureTypes.Feat,
				}
			} as Feature<string, string>));
		const magicItemFeatures = allItems().flatMap((i) => i?.features?.map(x=>({...x,info:{
			...x.info,
			type: FeatureTypes.Item
		}})) ?? []);
		const backgroundFeatures = allBackgrounds().flatMap((b) => b.feature.map((f)=>({
			name: b.name,
			value: f.value.join(', '),
			info: {
				...f.info,
				type: FeatureTypes.Background
			}
		})));
		const allFeatures = ([...classFeatures, ...subclassFeatures, ...featsFeatures, ...magicItemFeatures, ...backgroundFeatures] as Feature<string, string>[])
		.filter((f) => !!f.name)
		.sort((a, b) => a.name.localeCompare(b.name));
		const uniqueFeatures = new UniqueSet<Feature<string, string>>();
		allFeatures.forEach((f) => uniqueFeatures.add(f));
		return uniqueFeatures.value;
	});
	return allFeatures;
}

export { useGetFeatures }
export default useGetFeatures;