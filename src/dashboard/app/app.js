const dockerName = {
  "#docker-point-node": "point_node",
  /* "#docker-contracts": "contract_deployer",
  "#docker-pgadmin": "pgadmin",
  "#docker-database": "database",
  "#docker-blockchain": "blockchain_node",
  "#docker-owner": "website_owner",
  "#docker-visitor": "website_visitor", */
};
let isFirefoxInstalled = false;
let isPointNodeRunning = false;

function newComponent(args) {
  const {id, title, icon} = args;
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

function removeStates(id) {
  let elt = document.getElementById(id);
  elt.classList.remove("checking");
  elt.classList.remove("pass");
  elt.classList.remove("fail");
}

function toFail(id) {
  removeStates(id);
  let elt = document.getElementById(id);
  elt.classList.add("fail");
}

function downloadFirefoxHTML() {
  let html = "";
  html += "Firefox Point Browser not installed.<br>";
  // html += getLanguagesSelect();
  html += '<br><button onclick="downloadFirefox()">Download</button>';
  bullet.innerHTML = html;
}

function downloadingFirefoxHTML() {
  let bullet = document.getElementById("firefox-check");
  let html = "Downloading and installing Firefox Point Browser.<br>";
  bullet.classList.remove("checking");
  bullet.classList.remove("pass");
  bullet.classList.remove("fail");
  bullet.classList.add("checking");
  bullet.innerHTML = html;
}

function downloadedFirefoxHTML() {
  let bullet = document.getElementById("firefox-check");
  let html = "Firefox Point Browser is installed.";
  html +=
    '<button onclick="firefoxRun()">Run Firefox Point Browser</button>';
  bullet.classList.remove("pass");
  bullet.classList.remove("fail");
  bullet.classList.remove("checking");
  bullet.classList.add("pass");
  bullet.innerHTML = html;
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function removeIconStatuses(id) {
  $(id).removeClass("checking");
  $(id).removeClass("fail");
  $(id).removeClass("pass");
}

function addIconPassStatus(id) {
  removeIconStatuses(id);
  $(id).addClass("pass");
}

function addIconFailStatus(id) {
  removeIconStatuses(id);
  $(id).addClass("fail");
}

function addIconCheckingStatus(id) {
  removeIconStatuses(id);
  $(id).addClass("checking");
}

function expand(id, inBetween) {
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

function collapse(id, inBetween) {
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

function addIconAction(id, fn) {
  $(`${id} .icon`).unbind("click");
  $(`${id} .icon`).click(fn);
}


function addIconActionComponent(component) {
  console.log(component);
  const {jqId, action} = component;
  $(`${jqId} .icon`).unbind("click");
  $(`${jqId} .icon`).click(action);
}

function addLogsAction(id, fn) {
  $(`${id} .logs`).unbind("click");
  $(`${id} .logs`).click(fn);
}

function firefoxRun() {
  $("#firefox .status").html("Opening...");
  // sleep(1000);
  window.api.send("firefox-run");
  $("#firefox .status").html("Running");
}

function isAllReady() {
  return isFirefoxInstalled && isPointNodeRunning;
}

function pointNodeCheck() {
  $("#docker-point-node .status").html("Checking");
  window.api.send("point-node-check");
}

function setStatus(componentId, status) {
  $(`${componentId} .status`).html(status);
}

function setContent(id, content) {
  $(`${id}-container .content`).html(content);
}

function cancelProcess(id, status) {
  collapse(id);
  firefoxCheck();
}

function addCloseButton(id) {
  $(`${id}-container .close`).html(
    `<button onclick="cancelProcess('${id}')" type="button" class="btn-close float-right" aria-label="Close"></button>`
  );
}

function firefoxInstallation() {
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

function expandClose(id) {
  collapse(id);
}

function firefoxInstalled() {
  $("#statusUI").html("Firefox Installed");
  setTimeout(() => {
      $(".statusStyle").hide( "slow" );
  }, 2000);
}

function firefoxInstall() {
  addIconCheckingStatus("#firefox .icon");
  $(".statusStyle").show( "slow" );
  $("#firefox .status").html("Installing");
  $("#statusUI").html("Installing Firefox");
  // const language = $('#languages').val();
  window.api.send("firefox-download", { language: "en-US" });
}

function isExpanded(id) {
  return $(id).hasClass("expanded");
}

function isCollapsed(id) {
  return $(id).hasClass("collapsed");
}

function firefoxCheck() {
  window.api.send("firefox-check");
}

function platformCheck() {
  window.api.send("platform-check");
}

function dockerHealth(id) {
  addIconCheckingStatus(`${id} .icon`);
  setStatus(id, "Checking");
  const container = dockerName[id];
  window.api.send("docker-check", {
    component: id,
    container: container,
  });
}

function dockerRun(){
  console.log('run docker');
}

function dockerHealthAll(id) {
  const ids = Object.keys(dockerName);
  ids.forEach((id) => {
    new Promise(() => {
      dockerHealth(id);
    });
  });
}

function dockerLogs(id) {
  const container = dockerName[id];
  window.api.send("docker-logs", {
    component: id,
    container: container,
  });
}

async function dockerInit(id) {
  return new Promise(() => {
    addLogsAction(id, () => dockerLogs(id));
    addIconAction(id, () => dockerHealth(id));
  });
}

/* TODO: Change to something else. Currently you would need to be forced to click on #docker-point-node icon */
function dockerInstall() {
  addIconCheckingStatus("#docker-point-node .icon");
  $("#docker-point-node .status").html("Installing");
  window.api.send("docker-download", { language: language });
}

function dockerCheckInstalled() {
  window.api.send("docker-check-installed");
}

function checkCompose() {}
const firefoxPointBrowser = {
  id: "firefox", 
  title: "Firefox Point Browser", 
  icon:'<i class="small-icon icon fab checking fa-firefox-browser fa-fw"></i>',
  jqId: '#firefox',
  action: () => {
    console.log('entre');
    firefoxRun();
  }
}
const dockerPointNode = {
  id: "docker-point-node", 
  title: "Point Node", 
  icon:'<i class="small-icon icon fab checking fa-docker"></i>',
  jqId: '#docker-point-node',
  action: () => {
    window.api.send("docker-run");
  }
}
newComponent(firefoxPointBrowser);
newComponent(dockerPointNode);
// newComponent('docker-provider', 'Storage Provider', '<i class="small-icon icon fab checking fa-docker fa-fw"></i>');
// newComponent('docker-contracts', 'Contract Deployer', '<i class="small-icon icon fab checking fa-docker fa-fw"></i>');
/* newComponent('docker-pgadmin', 'pgAdmin', '<i class="small-icon icon fab checking fa-docker"></i>');
  newComponent('docker-database', 'Postgres', '<i class="small-icon icon fab checking fa-docker"></i>');
  newComponent('docker-blockchain', 'Blockchain', '<i class="small-icon icon fab checking fa-docker"></i>');
  newComponent('docker-owner', 'Website Owner', '<i class="small-icon icon fab checking fa-docker"></i>');
  newComponent('docker-visitor', 'Website Visitor', '<i class="small-icon icon fab checking fa-docker"></i>');
  // newComponent('pn', 'For the Icon', '<i class="small-icon icon"><img class="fab logo" src="./resources/logo-checking.svg" height="30"></i>');
  newComponent('wallet', 'POINT Wallet', '<i class="small-icon icon fas fab checking fa-wallet"></i>');
  newComponent('notifications', 'Notifications', '<i class="small-icon icon fas fab checking fa-bell"></i>'); */

// dockerInit('#docker-point-node');
/* dockerInit('#docker-contracts');
  dockerInit('#docker-pgadmin');
  dockerInit('#docker-database');
  dockerInit('#docker-blockchain');
  dockerInit('#docker-owner'); */
dockerInit("#docker-visitor");
addIconAction("#docker-visitor", () => dockerHealth("#docker-visitor"));
addIconActionComponent(dockerPointNode);
// addIconActionComponent(firefoxPointBrowser);
firefoxCheck();

// Running once before loop.
// dockerHealthAll();
pointNodeCheck();
setInterval(function () {
  // dockerHealthAll();
  pointNodeCheck();
}, 3 * 1000); // 60 * 1000 milsec
