export default function Installer() {
    function handleSayHello() {
      window.Main.startInstallation();
  
      window.Main.on('installer:log',(log:string[]) => {
        console.log(...log)
      })
    }
  
    return (
        <button onClick={handleSayHello}>Click to Start Installation</button>
        
    )
  }
   