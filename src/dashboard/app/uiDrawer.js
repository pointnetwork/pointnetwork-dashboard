class UiDrawer {
  
  constructor() {
    this.isFirefoxInstalled = false;
    this.isPointNodeRunning = false;
  }

  newComponent(args) {
    const { id, title, icon } = args;
    const component = `
                <div class="col-md-12 p-1" id="${id}-container" class="collapsed">
            <div class="card p-1">
            <div class="close right-text"></div>
            <div id="${id}" class="d-flex flex-row">
             
                <div class="d-flex flex-column ml-2 full-width">
      
                                <div class="d-flex justify-content-between menu-extra">
      
                    <span class="title">${icon} ${title} <span class="status text-black-50">Checking</span></span>
                
            </div>
                </div>
            </div>
            <p class="p-3 content no-display"></p>
            </div>
        </div>`;
    $("#app").append(component);
  }

  removeStates(id) {
    let elt = document.getElementById(id);
    elt.classList.remove("checking");
    elt.classList.remove("pass");
    elt.classList.remove("fail");
  }

  toFail(id) {
    removeStates(id);
    let elt = document.getElementById(id);
    elt.classList.add("fail");
  }

  downloadFirefoxHTML() {
    let html = "";
    html += "Firefox Point Browser not installed.<br>";
    // html += getLanguagesSelect();
    html += '<br><button onclick="downloadFirefox()">Download</button>';
    bullet.innerHTML = html;
  }

  downloadingFirefoxHTML() {
    let bullet = document.getElementById("firefox-check");
    let html = "Downloading and installing Firefox Point Browser.<br>";
    bullet.classList.remove("checking");
    bullet.classList.remove("pass");
    bullet.classList.remove("fail");
    bullet.classList.add("checking");
    bullet.innerHTML = html;
  }

  downloadedFirefoxHTML() {
    let bullet = document.getElementById("firefox-check");
    let html = "Firefox Point Browser is installed.";
    html += '<button onclick="firefoxRun()">Run Firefox Point Browser</button>';
    bullet.classList.remove("pass");
    bullet.classList.remove("fail");
    bullet.classList.remove("checking");
    bullet.classList.add("pass");
    bullet.innerHTML = html;
  }

  removeIconStatuses(id) {
    $(id).removeClass("checking");
    $(id).removeClass("fail");
    $(id).removeClass("pass");
  }

  addIconPassStatus(id) {
    uiDrawer.removeIconStatuses(id);
    $(id).addClass("pass");
  }

  addIconFailStatus(id) {
    this.removeIconStatuses(id);
    $(id).addClass("fail");
  }

  addIconCheckingStatus(id) {
    this.removeIconStatuses(id);
    $(id).addClass("checking");
  }

  expand(id, inBetween) {
    container = `${id}-container`;
    $(container).hide();
    $(`${id} .icon`).removeClass("small-icon");
    $(`${id} .icon`).addClass("big-icon");
    $(`${id} .title`).addClass("big-title");
    $(container).removeClass("col-md-6");
    $(container).addClass("col-md-12");
    $(container).removeClass("collapsed");
    $(container).addClass("expanded");
    $(`${container} .menu-extra .logs`).addClass("hidden");
    $(`${container} .content`).removeClass("no-display");
    if (inBetween != undefined) inBetween();
    $(container).show("slide");
  }

  collapse(id, inBetween) {
    container = `${id}-container`;
    $(container).hide();
    $(`${id} .icon`).removeClass("big-icon");
    $(`${id} .icon`).addClass("small-icon");
    $(`${id} .title`).removeClass("big-title");
    $(`${container} .close`).html("");
    $(container).addClass("col-md-6");
    $(container).removeClass("col-md-12");
    $(container).addClass("collapsed");
    $(container).removeClass("expanded");
    $(`${container} .menu-extra .logs`).removeClass("hidden");
    $(`${container} .content`).addClass("no-display");
    setContent(id, "");
    if (inBetween != undefined) inBetween();
    $(container).show("slide");
  }

  addIconAction(id, fn) {
    $(`${id} .icon`).unbind("click");
    $(`${id} .icon`).click(fn);
  }

  
  addIconActionComponent(component) {
    console.log(component);
    const { jqId, action } = component;
    $(`${jqId} .icon`).unbind("click");
    $(`${jqId} .icon`).click(action);
  }

  addLogsAction(id, fn) {
    $(`${id} .logs`).unbind("click");
    $(`${id} .logs`).click(fn);
  }

  firefoxRun() {
    $("#firefox .status").html("Opening...");
    // sleep(1000);
    window.api.send("firefox-run");
    $("#firefox .status").html("Running");
  }

  sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  isAllReady() {
    return this.isFirefoxInstalled && this.isPointNodeRunning;
  }

  pointNodeCheck() {
    $("#docker-point-node .status").html("Checking");
    window.api.send("point-node-check");
  }

  setStatus(componentId, status) {
    $(`${componentId} .status`).html(status);
  }

  setContent(id, content) {
    $(`${id}-container .content`).html(content);
  }

  cancelProcess(id, status) {
    collapse(id);
    firefoxCheck();
  }

  addCloseButton(id) {
    $(`${id}-container .close`).html(
      `<button onclick="cancelProcess('${id}')" type="button" class="btn-close float-right" aria-label="Close"></button>`
    );
  }

  firefoxInstallation() {
    expand("#firefox-compoenent", () => {
      $("#firefox .status").html("Preparing Installation");

      addCloseButton("#firefox");

      let html = "";
      // html += '<p id="platform" class=""></p>';
      // html += getLanguagesSelect();
      html +=
        '<p><button onclick="firefoxInstall()" type="button" class="btn btn-success">Install</button></p>';

      platformCheck();
      setContent("#firefox", html);
    });
  }

  expandClose(id) {
    collapse(id);
  }

  firefoxInstalled() {
    this.appendLog("Firefox Installed");
  }

  appendLog(log) {
    $(".statusStyle").show("slow");
    $("#statusUI").append( log + "</br>");
    $( ".statusStyle" ).scrollTop( $(".statusStyle").prop("scrollHeight") );
    setTimeout(() => {
      $(".statusStyle").hide("slow");
    }, 45000);
  }

  firefoxInstall() {
    this.addIconCheckingStatus("#firefox .icon");
    $(".statusStyle").show("slow");
    $("#firefox .status").html("Installing");
    this.appendLog("Installing Firefox...");
    // const language = $('#languages').val();
    window.api.send("firefox-download", { language: "en-US" });
  }

  isExpanded(id) {
    return $(id).hasClass("expanded");
  }

  isCollapsed(id) {
    return $(id).hasClass("collapsed");
  }

  firefoxCheck() {
    window.api.send("firefox-check");
  }

  platformCheck() {
    window.api.send("platform-check");
  }

  dockerInstall() {
    this.addIconCheckingStatus("#docker-point-node .icon");
    $("#docker-point-node .status").html("Installing");
    window.api.send("docker-download", { language: language });
  }

  dockerCheckInstalled() {
    window.api.send("docker-check-installed");
  }

  dockerLog(log) {
    this.appendLog(log);
  }
}
