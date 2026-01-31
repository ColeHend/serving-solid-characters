
export interface UserSettings {
    userId: number;
    username: string;
    email: string;
    theme: string;
    dndSystem: 'both' | '2014' | '2024' | string;
}