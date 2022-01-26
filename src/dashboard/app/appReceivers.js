window.api.receive("point-node-checked", (isRunning) => {
    if (isRunning) {
      isPointNodeRunning = true;
      addIconPassStatus("#docker-point-node .icon");
      $("#docker-point-node .status").html("Ready");
  
      addIconAction("#firefox", firefoxRun);
      $("#firefox .status").html("Ready");
      addIconPassStatus("#firefox .icon");
  
      $("#msg").addClass("no-display");
      if (isAllReady && !window.firefox_auto_started) {
        // If Point Node and Firefox are good, then immediately run Firefox.
        // But only one time
        window.firefox_auto_started = true;
        firefoxRun();
      }
      return;
    }
    addIconFailStatus("#docker-point-node .icon", "fail");
    $("#docker-point-node .status").html("Not running");
    //$("#msg").removeClass("no-display");
    //$("#msg").html(
    //  "Point Node is not running, please run <code>point-up</code> in a terminal"
    //);
  
    addIconFailStatus("#firefox .icon", "fail");
    $("#firefox .icon").unbind("click");
    $("#firefox .status").html("Point Node not running");
  });
  
  window.api.receive("firefox-checked", (isInstalled) => {
    if (isInstalled) {
      addIconPassStatus("#firefox .icon");
      addIconAction("#firefox", firefoxRun);
      setStatus("#firefox", "Ready");
      isFirefoxInstalled = true;
      if (isAllReady) {
        // If Point Node and Firefox are good, then immediately run Firefox.
        firefoxRun();
      }
      return;
    }
    addIconFailStatus("#firefox .icon", "fail");
    addIconAction("#firefox", firefoxInstallation);
    $("#firefox .status").html("Not installed");
    // If it's not installed, immediately start downloading and configuring.=
    firefoxInstall();
  });
  
  window.api.receive("platform-checked", (platform) => {
    const os = platform.os.charAt(0).toUpperCase() + platform.os.slice(1);
    const arch = platform.arch;
    $("#platform").html(`${os} (${arch})`);
  });
  
  window.api.receive("firefox-closed", () => {
    setStatus("#firefox", "Ready");
  });
  
  window.api.receive("docker-checked", (containerInfo) => {
    const component = containerInfo.component;
    const status = containerInfo.status;
  
    if (status == "healthy") {
      addIconPassStatus(`${component} .icon`);
      setStatus(component, "Healthy");
      return;
    }
    if (status == "starting") {
      addIconCheckingStatus(`${component} .icon`);
      setStatus(component, "Starting");
      return;
    }
    if (status == "unhealthy") {
      addIconFailStatus(`${component} .icon`);
      setStatus(component, "Unhealthy");
      return;
    }
    if (status == "no connection") {
      addIconFailStatus(`${component} .icon`);
      setStatus(component, "No connection");
      return;
    }
    if (status == "not running") {
      addIconFailStatus(`${component} .icon`);
      setStatus(component, "Not running");
      return;
    }
    addIconFailStatus(`${component} .icon`);
    setStatus(component, "No connection");
  });

  window.api.receive("firefox-installed", () => {
    firefoxInstalled();
  });