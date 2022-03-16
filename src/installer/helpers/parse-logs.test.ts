import { parseLog, ParsedLog } from './parse-log'
import { InstallationStepsEnum } from '../../@types/installation'

type TestCase = [string[], ParsedLog]

const testCases: TestCase[] = [
  [
    ['Test one'],
    {
      category: null,
      progress: null,
      message: 'Test one',
    },
  ],
  [
    ['Hello', 'Point'],
    {
      category: null,
      progress: null,
      message: 'Hello Point',
    },
  ],
  [
    [],
    {
      category: null,
      progress: null,
      message: '',
    },
  ],
  [
    [`${InstallationStepsEnum.CODE}:23`, 'lorem', 'ipsum'],
    {
      category: InstallationStepsEnum.CODE,
      progress: 23,
      message: 'lorem ipsum',
    },
  ],
  [
    [`${InstallationStepsEnum.CODE}:110`, 'Invalid progress (>100)'],
    {
      category: InstallationStepsEnum.CODE,
      progress: null,
      message: 'Invalid progress (>100)',
    },
  ],
  [
    [`${InstallationStepsEnum.BROWSER}:-9`, 'Invalid progress (<0)'],
    {
      category: InstallationStepsEnum.BROWSER,
      progress: null,
      message: 'Invalid progress (<0)',
    },
  ],
  [
    [`${InstallationStepsEnum.BROWSER}:NotANumber`, 'Invalid progress'],
    {
      category: InstallationStepsEnum.BROWSER,
      progress: null,
      message: 'Invalid progress',
    },
  ],
]

describe('parseLog', () => {
  test.each(testCases)('parses %s correctly', (input, expected) => {
    expect(parseLog(input)).toEqual(expected)
  })
})
