export function beutifyChip(input: string): string {
    return input
        .replace(/[_-]/g, ' ') // Replace underscores and dashes with spaces
        .split(' ') // Split the string into words
        .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize the first character of each word
        .join(' '); // Join the words back into a single string
}
