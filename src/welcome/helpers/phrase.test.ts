import { generatePhrase, validatePhrase, ERROR_MESSAGES } from './phrase'

type TestCase = [string, string | null]

const testCases: TestCase[] = [
  [
    // [OK] Valid phrase.
    'include shadow name differ wear maximum infant ticket tomorrow pioneer unhappy major',
    null,
  ],
  [
    // [OK] Valid phrase with extra white spaces at the beginning and end.
    '   include shadow name differ wear maximum infant ticket tomorrow pioneer unhappy major  ',
    null,
  ],
  [
    // [OK] Valid phrase with extra white spaces between words.
    'include    shadow name differ wear maximum infant   ticket tomorrow pioneer unhappy major',
    null,
  ],
  [
    // [KO] 11-word phrase.
    'shadow name differ wear maximum infant ticket tomorrow pioneer unhappy major',
    ERROR_MESSAGES.invalidLength,
  ],
  [
    // [KO] Typo in one of the words
    'include shadow name difer wear maximum infant ticket tomorrow pioneer unhappy major',
    ERROR_MESSAGES.invalidWords(['difer']),
  ],
  [
    // [KO] Typo in one of the words and a non-existent word.
    'include shadow name difer wear maximum uioqwerlkjasf ticket tomorrow pioneer unhappy major',
    ERROR_MESSAGES.invalidWords(['difer', 'uioqwerlkjasf']),
  ],
  [
    // [KO] All valid words from the dictionary, but no valid checksum.
    'include shadow name differ wear maximum infant ticket tomorrow pioneer unhappy minor',
    ERROR_MESSAGES.invalidPhrase,
  ],
]

describe('Phrase class for dealing with mnemonics', () => {
  test.each(testCases)(
    'validates "%s" and returns "%s" as the error message',
    (input, expected) => {
      const got = validatePhrase(input)
      expect(got).toEqual(expected)
    }
  )

  it('creates a valid phrase', () => {
    const phrase = generatePhrase()
    expect(validatePhrase(phrase)).toBeNull()
  })
})
