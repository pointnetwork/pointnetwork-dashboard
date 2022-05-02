export type GithubProgressMsg = { progress: number; message: string }

export const getProgressFromGithubMsg = (
  msg: string
): GithubProgressMsg | null => {
  // Counting objects:   8% (61/759)
  // Compressing objects:   0% (1/384)
  const parts = msg.split(' ')
  const partsWithoutBlanks = parts.filter(p => !!p)

  if (partsWithoutBlanks.length < 4) {
    // Not a message we're interested in.
    return null
  }

  const action = partsWithoutBlanks[0]
  let progress = Number(partsWithoutBlanks[2].replace('%', ''))

  if (Number.isNaN(progress)) {
    // Message doesn't have the expeted format.
    return null
  }

  // The process has two steps: "counting" and "compressing"
  progress = Math.round(progress / 2)

  if (action.toLowerCase() === 'compressing') {
    // Compressing is the second half of the process
    progress += 50
  }

  // Strip progress data from message to avoid cluttering the UI.
  const message = `${action} objects`

  return { progress, message }
}
