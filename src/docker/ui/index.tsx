import { useEffect, useState } from 'react'
import { Text } from './styles'

export default function() {
  const [logsElement, setStatusFirefox] = useState<string>()


  useEffect(() => {
    window.Dashboard.checkDocker()

    window.Dashboard.on('docker:log', (log: string) => {
      console.log(log);
    })
  }, [])

  return (
    <Text>Docker Status: {logsElement}</Text>
  )
}



