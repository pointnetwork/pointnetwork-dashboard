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

/**
 * Randomly picks a given quantity of elements from an array,
 * without duplicating picks.
 */
export function pickMultipleRandomly<T>(arr: T[], quantity: number): T[] {
  let availableOptions = [...arr]
  const picks = []

  for (let i = 0; i < quantity; i++) {
    const pick = pickRandomly(availableOptions)
    picks.push(pick)
    availableOptions = removeFromArray(availableOptions, pick)
  }

  return picks
}
