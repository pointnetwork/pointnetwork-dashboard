import { render } from '@testing-library/react'

import { Firefox } from './index'

test('Greetings should renders', () => {
  const { getByText, getByAltText } = render(<Firefox />)

  expect(
    getByText('Welcome to Point Network installer. Please review the components to be installed and click "Start".')
  ).toBeTruthy()
  expect(getByAltText('Point logo')).toBeTruthy()
})
