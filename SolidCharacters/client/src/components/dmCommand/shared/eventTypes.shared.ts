export type EventType = 'combat' | 'social' | 'travel' | 'exploration' | 'scene' | 'custom' | 'puzzle' | 'rest';

export interface EventTypeMeta {
    label: string;
    /** CSS custom property defined on the DM Command page root (.mainBody). */
    color: string;
}

export const EVENT_TYPE_META: Record<EventType, EventTypeMeta> = {
    combat:      { label: 'Combat',  color: 'var(--dm-type-combat)' },
    social:      { label: 'Social',  color: 'var(--dm-type-social)' },
    travel:      { label: 'Travel',  color: 'var(--dm-type-travel)' },
    exploration: { label: 'Explore', color: 'var(--dm-type-explore)' },
    scene:       { label: 'Scene',   color: 'var(--dm-type-scene)' },
    custom:      { label: 'Custom',  color: 'var(--dm-type-custom)' },
    puzzle:      { label: 'Puzzle',  color: 'var(--dm-type-puzzle)' },
    rest:        { label: 'Rest',    color: 'var(--dm-type-rest)' },
};

export const eventTypeMeta = (type: string): EventTypeMeta =>
    EVENT_TYPE_META[type as EventType] ?? { label: type, color: 'var(--dm-type-custom)' };
