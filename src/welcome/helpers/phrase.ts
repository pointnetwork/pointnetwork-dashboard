import Mnemonic from 'bitcore-mnemonic'

export const ERROR_MESSAGES = {
  invalidLength: 'Invalid seed length',
  invalidPhrase: 'Invalid phrase',
  invalidWords: (words: string[]) =>
    `The following words are invalid: "${words.join(' ')}"`,
}

export function getDictionary(): string[] {
  return Mnemonic.Words.ENGLISH
}

function isWordInDictionary(word: string): boolean {
  const dictionary = getDictionary()
  return dictionary.includes(word)
}

export function generatePhrase(): string {
  return new Mnemonic(getDictionary()).toString()
}

export function validatePhrase(phrase: string): string | null {
  const words = phrase.split(' ').filter(Boolean) // ignore spaces

  if (words.length !== 12) {
    return ERROR_MESSAGES.invalidLength
  }

  const badWords = words.filter(w => !isWordInDictionary(w))
  if (badWords.length > 0) {
    return ERROR_MESSAGES.invalidWords(badWords)
  }

  return Mnemonic.isValid(words.join(' ')) ? null : ERROR_MESSAGES.invalidPhrase
}
