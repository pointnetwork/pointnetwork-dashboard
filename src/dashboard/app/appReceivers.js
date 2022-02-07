window.api.receive("point-node-checked", (isRunning) => {
    if (isRunning) {
      isPointNodeRunning = true;
      uiDrawer.addIconPassStatus("#docker-point-node .icon");
      $("#docker-point-node .status").html("Ready");
  
      $("#firefox .status").html("Ready");
      uiDrawer.addIconPassStatus("#firefox .icon");
  
      $("#msg").addClass("no-display");
      if (uiDrawer.isAllReady && !window.firefox_auto_started) {
        // If Point Node and Firefox are good, then immediately run Firefox.
        // But only one time
        window.firefox_auto_started = true;
        uiDrawer.firefoxRun();

      }
      return;
    }
    window.api.send("docker-run");
    uiDrawer.addIconFailStatus("#docker-point-node .icon", "fail");
    $("#docker-point-node .status").html("Not running");
    //$("#msg").removeClass("no-display");
    //$("#msg").html(
    //  "Point Node is not running, please run <code>point-up</code> in a terminal"
    //);
  
    uiDrawer.addIconFailStatus("#firefox .icon", "fail");
    $("#firefox .icon").unbind("click");
    $("#firefox .status").html("Point Node not running");
  });
  
  window.api.receive("firefox-checked", (isInstalled) => {
    if (isInstalled) {
      uiDrawer.addIconPassStatus("#firefox .icon");
      uiDrawer.addIconAction("#firefox", uiDrawer.firefoxRun);
      uiDrawer.setStatus("#firefox", "Ready");
      isFirefoxInstalled = true;
      if (uiDrawer.isAllReady) {
        // If Point Node and Firefox are good, then immediately run Firefox.
        // uiDrawer.firefoxRun();
      }
      return;
    }
    uiDrawer.addIconFailStatus("#firefox .icon", "fail");
    uiDrawer.addIconAction("#firefox", uiDrawer.firefoxInstallation);
    $("#firefox .status").html("Not installed");
    // If it's not installed, immediately start downloading and configuring.=
    uiDrawer.firefoxInstall();
  });
  
  window.api.receive("platform-checked", (platform) => {
    const os = platform.os.charAt(0).toUpperCase() + platform.os.slice(1);
    const arch = platform.arch;
    $("#platform").html(`${os} (${arch})`);
  });
  
  window.api.receive("firefox-closed", () => {
    uiDrawer.setStatus("#firefox", "Ready");
  });
  
  window.api.receive("docker-checked", (containerInfo) => {
    const component = containerInfo.component;
    const status = containerInfo.status;
  
    if (status == "healthy") {
      uiDrawer.addIconPassStatus(`${component} .icon`);
      uiDrawer.setStatus(component, "Healthy");
      return;
    }
    if (status == "starting") {
      uiDrawer.addIconCheckingStatus(`${component} .icon`);
      uiDrawer.setStatus(component, "Starting");
      return;
    }
    if (status == "unhealthy") {
      uiDrawer.addIconFailStatus(`${component} .icon`);
      uiDrawer.setStatus(component, "Unhealthy");
      return;
    }
    if (status == "no connection") {
      uiDrawer.addIconFailStatus(`${component} .icon`);
      uiDrawer.setStatus(component, "No connection");
      return;
    }
    if (status == "not running") {
      uiDrawer.addIconFailStatus(`${component} .icon`);
      uiDrawer.setStatus(component, "Not running");
      return;
    }
    uiDrawer.addIconFailStatus(`${component} .icon`);
    uiDrawer.setStatus(component, "No connection");
  });

  window.api.receive("firefox-installed", () => {
    uiDrawer.firefoxInstalled();
  });

  window.api.receive("docker-log", (log) => {
    uiDrawer.dockerLog(log);
  });

  
