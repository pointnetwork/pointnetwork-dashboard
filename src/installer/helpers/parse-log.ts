import { InstallationStepsEnum } from '../../@types/installation'

export function parseLog(log: string[]): {
  category: InstallationStepsEnum | null
  progress: number | null
  message: string
} {
  if (!log || log.length === 0) {
    return { category: null, progress: null, message: '' }
  }

  // If metadata is present, it will be at index 0 of the `log` array.
  const meta = log[0]

  // Parse category.
  let category: InstallationStepsEnum | null = null
  if (meta.includes(':')) {
    category = meta.split(':')[0] as InstallationStepsEnum
  } else {
    category = meta as InstallationStepsEnum
  }

  if (!(category in InstallationStepsEnum)) {
    // Log does not include metadata.
    return { category: null, progress: null, message: log.join(' ') }
  }

  // At this point, we know the first string in the array is the metadata.
  const message = log.slice(1).join(' ')

  // Parse progress
  let progress: number | null = null
  if (meta.includes(':')) {
    const p = Number(meta.split(':')[1])
    if (!Number.isNaN(p) && p >= 0 && p <= 100) {
      progress = p
    }
  }

  return { category, progress, message }
}
