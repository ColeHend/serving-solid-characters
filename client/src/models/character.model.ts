export interface Character {
    name: string;
		class: string;
		subclass: string;
		level: number;
		metadata: CharacterMetadata;
}
export interface CharacterMetadata {
	something: string;
}