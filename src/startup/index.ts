

export default class StartUp {
    app: any;

    constructor(app: any) {
      this.app = app;
    }
  
    getIsEnabled() {
      return this.app.getLoginItemSettings().openAtLogin;
    }
  
    enable() {
      this.app.setLoginItemSettings({
        openAtLogin: true,
      });
    }
  
    disable() {
      this.app.setLoginItemSettings({
        openAtLogin: false,
      });
    }
  
  }
  