import { useEffect, useState } from 'react'
import { IconContext } from 'react-icons'
import { FaDocker } from 'react-icons/fa'
import { Button, Container } from './styles'

export default function() {
  const [activeDocker, setActiveDocker] = useState<string>()


  useEffect(() => {

    window.Dashboard.checkDocker()

    window.Dashboard.on('docker:log', (log: string) => {
      console.log(log);
    })

    window.Dashboard.on('pointNode:checked', (active: boolean) => {
      const color = active? 'green': 'red';
      setActiveDocker(color);

    })

  }, [])

  const openLogs = () => {
    window.Dashboard.createLogWindow()
  }

  useEffect(()=>{
    window.Dashboard.checkNode()
  }, [activeDocker])


  const dockerStyle = { 
    color: activeDocker, size: '150px' 
  }



  return (
    <>
    <IconContext.Provider value={dockerStyle}>
      <Container>
        <FaDocker style={{float: 'left'}} />
        <Button style={{float: 'left'}} onClick={openLogs}>Button</Button>
      </Container>
    </IconContext.Provider>
  </>
  )
}




