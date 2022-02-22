
import { useEffect, useState } from 'react'

export default function App() {

  useEffect(() => {

    window.DockerLog.on('docker:log', (log: string[]) => {
      addLog(log)
    })
  }, [])

  function addLog(log: string[]) {
    const li = document.createElement('li')
    li.innerHTML = `${log.join(' ')}`
    const element = document.getElementById('logs');
    element?.appendChild(li)
    window.scrollTo(0, element!.scrollHeight)
  }

  return (
    <div className="py-4 px-4">
    <h1 className="text-2xl font-semibold mb-4">
       Node Logs
    </h1>
    <div
      id="logs"
      className={'p-2 rounded text-sm'}
    >

    </div>
  </div>
  )
}
