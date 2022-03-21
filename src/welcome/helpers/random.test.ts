import { pickMultipleRandomly } from './random'

describe('pickMultipleRandomly', () => {
  const seed =
    'radar label try injury moment own relief strategy park first famous hub'

  const input = seed.split(' ')
  const output = pickMultipleRandomly(input, 4)

  it('picks 4 words from a string[]', () => {
    expect(output).toHaveLength(4)
  })

  it('picks words contained in the input array', () => {
    output.forEach(n => expect(input).toContain(n))
  })

  it('does not pick any duplicates', () => {
    expect(Array.from(new Set(output))).toHaveLength(4)
  })
})
