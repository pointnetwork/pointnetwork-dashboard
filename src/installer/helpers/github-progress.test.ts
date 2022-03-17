import { getProgressFromGithubMsg, GithubProgressMsg } from './github-progress'

type TestCase = [string, GithubProgressMsg | null]

const testCases: TestCase[] = [
  [
    'Counting objects:   8% (61/759)',
    {
      progress: 8 / 2,
      message: 'Counting objects',
    },
  ],
  [
    'Counting objects:  50% (61/759)',
    {
      progress: 50 / 2,
      message: 'Counting objects',
    },
  ],
  [
    'Compressing objects:  75% (61/759)',
    {
      progress: Math.round(75 / 2 + 50),
      message: 'Compressing objects',
    },
  ],
  [
    'Compressing objects:  14% (61/759)',
    {
      progress: Math.round(14 / 2 + 50),
      message: 'Compressing objects',
    },
  ],
  ['Short message', null],
  ['Another kind of message', null],
  ['Total 109 (delta 27), reused 109 (delta 27), pack-reused 0', null],
]

describe('getProgressFromGithubMsg', () => {
  test.each(testCases)('parses %s correctly', (input, expected) => {
    expect(getProgressFromGithubMsg(input)).toEqual(expected)
  })
})
