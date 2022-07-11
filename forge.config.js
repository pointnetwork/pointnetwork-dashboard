module.exports = {
  packagerConfig: {
    name: "point",
    executableName: "point",
    icon: "assets/icon",
    extraResource: [
      "assets"
    ],
    osxSign: {
      "identity": `${process.env.APPLE_IDENTITY}`,
      "hardened-runtime": true,
      "entitlements": "entitlements.plist",
      "entitlements-inherit": "entitlements.plist",
      "signature-flags": "library"
    },
    osxNotarize: {
      "appleBundleId": "com.electron.point-network",
      "appleId": `${process.env.APPLE_ID}`,
      "appleIdPassword": `${process.env.APPLE_DEV_ID_APP_SPECIFIC_PASSWORD}`,
      "ascProvider": '44K963DDUU',
    }
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
        certificatePassword: process.env.WINDOWS_PFX_PASSWORD || '',
        noMsi: true
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
      config: {
        icon: "assets/icon.png"
      }
    },
    {
      name: "@electron-forge/maker-rpm",
      config: {
        icon: "assets/icon.png"
      }
    }
  ]
}
