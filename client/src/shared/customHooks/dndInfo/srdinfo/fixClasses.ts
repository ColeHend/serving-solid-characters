import { DnDClass } from "../../../../models";


function FixFeature(feature:string) {
	const hasCurly = feature.trim()[0] !== "{";
	const hasSquare = feature.trim()[0] !== "[";
	if (hasCurly && hasSquare) return feature;
	if (!hasCurly) {
		const parsedObj = JSON.parse(feature);
		if (Array.isArray(parsedObj)) {
			if (typeof parsedObj[0] === "string") {
				return parsedObj.join("\n");
			}
		}
		if (Object.keys(parsedObj).includes("Desc")) return parsedObj?.Desc?.join("\n");
		return feature;
	}
	if (!hasSquare) {
		const parsedObj = JSON.parse(feature);
		if (Object.keys(parsedObj).includes("Desc")) return parsedObj?.Desc?.join("\n");
		if (Array.isArray(parsedObj)) {
			if (typeof parsedObj[0] === "string") {
				return parsedObj.join("\n");
			}
		}
		return feature;
	}
	const parsedObj = JSON.parse(feature);
	if (!!parsedObj?.Desc) return parsedObj?.Desc?.join("\n");
	return feature;
}

export function FixClasses(classes:DnDClass[]) {
	return classes.map((c,i)=>{
		return {...c,
			classLevels: c.classLevels.map((l,j)=>{
				return {...l,
					features: l.features.map((f)=>{
						return {...f, value: FixFeature(f.value)}
					})
				}
			}),
			subclasses: c.subclasses.map((s,j)=>{
				return {...s,
					features: s.features.map((f)=>{
						return {...f, value: FixFeature(f.value)}
					})
				}
			})
		}
	});
}