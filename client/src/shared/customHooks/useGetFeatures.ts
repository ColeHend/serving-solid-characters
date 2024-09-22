import { createMemo } from "solid-js"
import useGetClasses from "./data/useGetClasses"
import useGetFeats from "./data/useGetFeats"
import { Feature } from "../../models/core.model"
import { UniqueSet } from "./utility/Tools"

const useGetFeatures = () => {
	const allClasses = useGetClasses()
	const allFeats = useGetFeats()
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
					type: 'Feature',
				}
			} as Feature<unknown, string>));
		const allFeatures = [...classFeatures, ...subclassFeatures, ...featsFeatures]
		.filter((f) => !!f.name)
		.sort((a, b) => a.name.localeCompare(b.name));
		const uniqueFeatures = new UniqueSet<Feature<unknown, string>>();
		allFeatures.forEach((f) => uniqueFeatures.add(f));
		return uniqueFeatures.value;
	});
	return allFeatures;
}

export { useGetFeatures }
export default useGetFeatures;