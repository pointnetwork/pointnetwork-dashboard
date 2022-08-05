export type Word = { word: string; idx: number }

/**
 * Randomly picks a given quantity of elements from an array,
 * without duplicating picks.
 */
export function pickMultipleRandomly(arr: string[], quantity: number): Word[] {
    const availableOptions = arr.map((word, idx) => ({word, idx}));
    const shuffled = [...availableOptions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, quantity);
}
