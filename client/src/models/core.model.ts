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
    choice1: Choice<Item>[];
    choice2: Choice<Item>[];
    choice3: Choice<Item>[];
    choice4: Choice<Item>[];
}

export interface Item {
    item: string;
    quantity: number;
    desc: string[];
}