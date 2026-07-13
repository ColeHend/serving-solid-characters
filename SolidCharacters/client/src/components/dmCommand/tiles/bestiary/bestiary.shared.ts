export interface BestiaryMonster {
    name: string;
    cr: string;
    hp: number;
    ac: number;
}

// TEMP demo bestiary until an SRD monster source exists.
export const DEMO_MONSTERS: BestiaryMonster[] = [
    { name: 'Goblin', cr: '1/4', hp: 7, ac: 15 },
    { name: 'Goblin Boss', cr: '1', hp: 21, ac: 17 },
    { name: 'Bugbear', cr: '1', hp: 27, ac: 16 },
    { name: 'Hobgoblin', cr: '1/2', hp: 11, ac: 18 },
    { name: 'Kobold', cr: '1/8', hp: 5, ac: 12 },
    { name: 'Wolf', cr: '1/4', hp: 11, ac: 13 },
    { name: 'Ogre', cr: '2', hp: 59, ac: 11 },
    { name: 'Young Kraken', cr: '10', hp: 152, ac: 16 },
];
