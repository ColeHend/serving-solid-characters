export interface Feature<T, K> {
    Info:  Info<K>;
    Name:  string;
    Value: T;
}

export interface Info<T> {
    ClassName:    string;
    SubclassName: string;
    Level:        number;
    Type:         string;
    Other:        T;
}

export interface Choice<T>
{
    Choose:  number;
    Type:    string;
    Choices: T[];
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