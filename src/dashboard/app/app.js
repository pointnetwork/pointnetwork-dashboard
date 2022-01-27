
const uiDrawer = new UiDrawer()
const dockerName = {
  "#docker-point-node": "point_node",
  /* "#docker-contracts": "contract_deployer",
  "#docker-pgadmin": "pgadmin",
  "#docker-database": "database",
  "#docker-blockchain": "blockchain_node",
  "#docker-owner": "website_owner",
  "#docker-visitor": "website_visitor", */
};

function dockerHealth(id) {
  uiDrawer.addIconCheckingStatus(`${id} .icon`);
  uiDrawer.setStatus(id, "Checking");
  const container = dockerName[id];
  window.api.send("docker-check", {
    component: id,
    container: container,
  });
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
    uiDrawer.addLogsAction(id, () => dockerLogs(id));
    uiDrawer.addIconAction(id, () => dockerHealth(id));
  });
}

/* TODO: Change to something else. Currently you would need to be forced to click on #docker-point-node icon */
const firefoxPointBrowser = {
  id: "firefox", 
  title: "Firefox Point Browser", 
  icon:'<i class="small-icon icon fab checking fa-firefox-browser fa-fw"></i>',
  jqId: '#firefox',
  action: () => {
    console.log('entre');
    uiDrawer.firefoxRun();
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
uiDrawer.newComponent(firefoxPointBrowser);
uiDrawer.newComponent(dockerPointNode);
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
  uiDrawer.addIconAction("#docker-visitor", () => dockerHealth("#docker-visitor"));
  uiDrawer.addIconActionComponent(dockerPointNode);
// addIconActionComponent(firefoxPointBrowser);
uiDrawer.firefoxCheck();

// Running once before loop.
// dockerHealthAll();
uiDrawer.pointNodeCheck();
setInterval(function () {
  // dockerHealthAll();
  uiDrawer.pointNodeCheck();
}, 3 * 1000); // 60 * 1000 milsec
