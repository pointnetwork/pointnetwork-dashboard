import { useEffect, useState } from "react";

export default function Installer() {
  const [logsElement,setLogsElement] = useState<HTMLElement>();

    function handleSayHello() {
      window.Main.startInstallation();
  
      window.Main.on('installer:log',(log:string[]) => {
        addLog(log);
        console.log(...log)
      })
    }

    function addLog(log:string[]) {
      const li = document.createElement('li');
      li.innerHTML = `${log.join('')}`
      logsElement?.appendChild(li);
      window.scrollTo(0,logsElement!.scrollHeight)
    }

    useEffect(() => {
      const logEl = document.getElementById('logs')
      if(logEl) setLogsElement(logEl);
    },[])
  
    return (
      <div>
        <button onClick={handleSayHello}>Click to Start Installation</button>
        <ul id="logs"></ul>
      </div>
    )
  }