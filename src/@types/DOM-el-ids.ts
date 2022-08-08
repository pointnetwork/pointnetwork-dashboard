/* eslint-disable linebreak-style */
/* eslint-disable object-curly-newline */
const DomIds = Object.freeze({
    dashboard: {
        checkForUpdatesDialog: {
            retryUpdatesButton: 'dashboard:checkForUpdatesDialog:retryUpdatesButton',
            closeButton: 'dashboard:checkForUpdatesDialog:closeButton'
        },
        contactSupport: {
            supportLink: 'dashboard:contactSupport:supportLink',
            copyIdentifierButton: 'dashboard:contactSupport:copyIdentifierButton'
        },
        dashboardUpdateAlert: {
            dashboardUpdateDownloadLink:
                'dashboard:dashboardUpdateAlert:dashboardUpdateDownloadLink'
        },
        errorDialog: {
            logoutButton: 'dashboard:errorDialog:logoutButton',
            closeButton: 'dashboard:errorDialog:closeButton'
        },
        mainContent: {
            copyWalletAddress: 'dashboard:mainContent:copyWalletAddress'
        },
        sidebar: {
            openHelpMenuButton: 'dashboard:sidebar:openHelpMenuButton',
            openSettingsMenuButton: 'dashboard:sidebar:openSettingsMenuButton',
            openLogoutDialogButton: 'dashboard:sidebar:openLogoutDialogButton',
            launchUninstallerMenuItem: 'dashboard:sidebar:launchUninstallerMenuItem',
            openSupportLinkMenuItem: 'dashboard:sidebar:openSupportLinkMenuItem',
            cancelLogoutButton: 'dashboard:sidebar:cancelLogoutButton',
            logoutButton: 'dashboard:sidebar:logoutButton'
        },
        timeoutAlert: {
            launchUninstallerButton: 'dashboard:timeoutAlert:launchUninstallerButton',
            launchNodeButton: 'dashboard:timeoutAlert:launchNodeButton',
            closeButton: 'dashboard:timeoutAlert:closeButton'
        },
        topbar: {
            minimizeButton: 'dashboard:topbar:minimizeButton',
            closeButton: 'dashboard:topbar:closeButton',
            closeCancelButton: 'dashboard:topbar:closeCancelButton',
            closeConfirmButton: 'dashboard:topbar:closeConfirmButton'
        }
    },
    installer: {
        app: {
            startInstallationButton: 'installer:app:startInstallationButton',
            restartInstallationButton: 'installer:app:restartInstallationButton'
        },
        disclaimerDialog: {
            openTermsLink: 'installer:disclaimerDialog:openTermsLink',
            acceptTermsButton: 'installer:disclaimerDialog:acceptTermsButton',
            rejectTermsButton: 'installer:disclaimerDialog:rejectTermsButton'
        },
        topbar: {
            minimizeButton: 'installer:topbar:minimizeButton',
            closeButton: 'installer:topbar:closeButton'
        }
    },
    welcome: {
        mainLayout: {
            goBackButton: 'welcome:mainLayout:goBackButton'
        },
        topbar: {
            minimizeButton: 'welcome:topbar:minimizeButton',
            closeButton: 'welcome:topbar:closeButton'
        },
        generateNew: {
            generateSeedPhraseButton: 'welcome:generateNew:generateSeedPhraseButton',
            copySeedPhraseButton: 'welcome:generateNew:copySeedPhraseButton',
            continueSeedVerificationButton: 'welcome:generateNew:continueSeedVerificationButton'
        },
        home: {
            generateNewCard: 'welcome:home:generateNewCard',
            importExistingCard: 'welcome:home:importExistingCard'
        },
        importExisting: {
            pasteSeedPhraseButton: 'welcome:importExisting:pasteSeedPhraseButton',
            loginButton: 'welcome:importExisting:loginButton'
        },
        verifyPhrase: {
            loginButton: 'welcome:importExisting:loginButton'
        }
    }
});

export default DomIds;
