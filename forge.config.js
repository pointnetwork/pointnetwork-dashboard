module.exports = {
  packagerConfig: {
    name: "point",
    executableName: "point",
    icon: "assets/icon",
    extraResource: [
      "assets"
    ]
  },
  plugins: [
    [
      "@electron-forge/plugin-webpack",
      {
        mainConfig: "./webpack/main.webpack.js",
        renderer: {
          config: "./webpack/renderer.webpack.js",
          entryPoints: [
            {
              html: "./public/index.html",
              js: "./src/dashboard/ui/index.tsx",
              name: "dashboard_window",
              preload: {
                js: "./src/dashboard/bridge.ts"
              }
            },
            {
              html: "./public/index.html",
              js: "./src/welcome/ui/index.tsx",
              name: "welcome_window",
              preload: {
                js: "./src/welcome/bridge.ts"
              }
            },
            {
              html: "./public/index.html",
              js: "./src/installer/ui/index.tsx",
              name: "installer_window",
              preload: {
                js: "./src/installer/bridge.ts"
              }
            }
          ]
        }
      }
    ]
  ],
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        name: "point",
        certificateFile: process.env.WINDOWS_PFX_FILE,
        certificatePassword: process.env.WINDOWS_PFX_PASSWORD || ''
      }
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: [
        "darwin"
      ]
    },
    {
      name: "@electron-forge/maker-deb",
      config: {}
    },
    {
      name: "@electron-forge/maker-rpm",
      config: {}
    }
  ]
}
