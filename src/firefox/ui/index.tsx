import { useEffect, useState } from 'react'
import { Text } from './styles'

export default function() {
  const [logsElement, setStatusFirefox] = useState<string>()


  useEffect(() => {
    window.Dashboard.checkFirefox()

    window.Dashboard.on('firefox:log', (log: string) => {
      setStatusFirefox(log)
    })
  }, [])

  return (
    <Text>Firefox Status: {logsElement}</Text>
  )
}



