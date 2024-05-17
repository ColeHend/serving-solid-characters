export interface Feature<T, K> {
    info:  Info<K>;
    name:  string;
    value: T;
}

export interface Info<T> {
    className:    string;
    subclassName: string;
    level:        number;
    type:         string;
    other:        T;
}

export interface Choice<T>
{
    choose:  number;
    type:    string;
    choices: T[];
}

export interface StartingEquipment {
    class: string;
    quantity: number;
    choice1: Choice<string>[];
    choice2: Choice<string>[];
    choice3: Choice<Feature<number, string>>[];
    choice4: Choice<Feature<number, string>>[];
}

export interface Item {
    item: string;
    quantity: number;
    desc: string[];
}