/**
 * Randomly picks an item from an array
 */
function pickRandomly<T>(arr: T[]): T {
  const idx = Math.floor(Math.random() * arr.length)
  return arr[idx]
}

/**
 * Removes an item from an array (using strict equality).
 * Returns a new array.
 */
function removeFromArray<T>(arr: T[], target: T): T[] {
  return arr.filter(i => i !== target)
}

export type Word = { word: string; idx: number }

/**
 * Randomly picks a given quantity of elements from an array,
 * without duplicating picks.
 */
export function pickMultipleRandomly(arr: string[], quantity: number): Word[] {
  let availableOptions = [...arr]
  const picks: Word[]  = []

  for (let i = 0; i < quantity; i++) {
    const pick = pickRandomly(availableOptions)
    picks.push({ word: pick, idx: arr.indexOf(pick) })
    availableOptions = removeFromArray(availableOptions, pick)
  }

  return picks
}
