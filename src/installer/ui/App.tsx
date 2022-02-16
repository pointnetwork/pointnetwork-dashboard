import { Fragment, useEffect, useState } from 'react'

export default function App() {
  const [logsElement, setLogsElement] = useState<HTMLElement>()
  const [installing, setInstalling] = useState<boolean>(false)

  function sendStartInstallation() {
    window.Installer.startInstallation()
    setInstalling(true)

    window.Installer.on('installer:log', (log: string[]) => {
      addLog(log)
      console.log(...log)
    })
  }

  function addLog(log: string[]) {
    const li = document.createElement('li')
    li.innerHTML = `${log.join(' ')}`
    logsElement?.appendChild(li)
    window.scrollTo(0, logsElement!.scrollHeight)
  }

  useEffect(() => {
    const logEl = document.getElementById('logs')
    if (logEl) setLogsElement(logEl)
  }, [])

  return (
    <div className="py-4 px-4">
      <h1 className="text-2xl font-semibold mb-4">
        {installing ? 'Installing' : 'Welcome to the Point Installer'}
      </h1>
      <div
        id="logs"
        className={
          'p-2 rounded text-sm h-48 overflow-scroll' +
          (installing ? 'bg-slate-100' : '')
        }
      >
        {installing ? null : (
          <Fragment>
            <p>
              The following components will be installed on your system to run
              the point dashboard
            </p>
            <ul className="text-sm list-disc ml-4 mt-2 mb-8">
              <li>Point Node</li>
              <li>Point Dashboard</li>
              <li>Firefox (Point Browser)</li>
              <li>Docker & WSL</li>
            </ul>
            <button
              onClick={sendStartInstallation}
              className="block bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white py-2 px-4 text-sm rounded"
            >
              Start Installation
            </button>
          </Fragment>
        )}
      </div>
    </div>
  )
}
