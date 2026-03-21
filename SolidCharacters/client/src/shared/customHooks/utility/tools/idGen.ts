export function createNewId(): string {
    const uniqueId = crypto.randomUUID();
    if (uniqueId) {
        return uniqueId;
    }
    // Fallback to a simple random string if crypto.randomUUID is not supported
    return `${Date.now()}-${Math.random().toString(36)}`;
}