import { useEffect, useState } from 'react'
import { Text } from './styles'
import { FaFirefox } from 'react-icons/fa'
import { IconContext } from 'react-icons'

export default function () {
  const [logsElement, setStatusFirefox] = useState<string>()
  const [firefoxColor, setFirefoxColor] = useState<string>('red')

  useEffect(() => {
    window.Dashboard.checkFirefox()

    window.Dashboard.on('firefox:log', (log: string) => {
      setStatusFirefox(log)
    })

    window.Dashboard.on('firefox:active', (active: boolean) => {
      const color = active? 'green': 'red';
      setFirefoxColor(color)
    })
  }, [])

  const FirefoxStyle = { 
    color: firefoxColor, size: '150px' 
  }

  return (
    <>
      <IconContext.Provider value={FirefoxStyle}>
        <div>
          <FaFirefox />
        </div>
      </IconContext.Provider>
      <Text>Firefox Status: {logsElement}</Text>
    </>
  )
}
