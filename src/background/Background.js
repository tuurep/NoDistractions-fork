import MessageHandler from "./MessageHandler.js";
import BlockHandler from "./BlockHandler.js";
import Utilities from "./Utilities.js";
import SettingsUtilities from "../shared/SettingsUtilities.js";
const {defaultSettings, getActiveSettings, checkMissingSettings} = SettingsUtilities;
const defaultBlockedSites = ["twitter.com", "reddit.com", "facebook.com"];
export let enabled = {
    status: false,
    setStatus(newStatus) {
        this.status = newStatus;
        updateIconState(this.status);
        browser.storage.local.set({lastEnabledStatus: this.status})
    }
};

browser.runtime.onMessage.addListener(handleMessage);
browser.runtime.onInstalled.addListener(async details => {
    if (details.reason == "install") {
        console.log("NoDistractions has been installed!");
        await handleInstalled();
    }
    if (details.reason == "update") {
        console.log("NoDistractions has been updated!");
    }

    await checkMissingSettings(await getActiveSettings());
    initalize();
});

async function initalize() {
    console.log("initializing background listeners");
    await BlockHandler.updateRequestListener();

    browser.storage.local.get("lastEnabledStatus").then(res => {
        const status = res.lastEnabledStatus;
        if (status !== undefined) {
            enabled.setStatus(status);
        } else {
            enabled.setStatus(false);
        }
    });
}
initalize();

async function handleMessage(request, sender, sendResponse) {
    if (MessageHandler[request.type]) {
        return MessageHandler[request.type](request);
    } else {
        console.error("Message", request.type, "does not exist.");
    }
}

browser.commands.onCommand.addListener(name => {
    if (name == "toggle-enabled") {
        const newStatus = !enabled.status;
        enabled.setStatus(newStatus);

        browser.storage.local.get("settings").then(res => {
            if(res.settings.notifyOnKeyShortcut) {
                if (newStatus === true) {
                    Utilities.createNotification("toggle-status-notification", "Enabled", true);
                } else {
                    Utilities.createNotification("toggle-status-notification", "Disabled", false);
                }
            }
        });
    }
});

async function handleInstalled() {
    const blockedSites = await browser.storage.local.get("blockedSites_V1");
    if (Object.keys(blockedSites) == 0) {
        await browser.storage.local.set({blockedSites_V1: defaultBlockedSites});
    }
    const settings = await browser.storage.local.get("settings");
    if (Object.keys(settings) == 0) {
        await browser.storage.local.set({settings: defaultSettings});
    }

    console.log("Initial setup complete");
}

function updateIconState(enabledState) {
    const iconPath = enabledState ? "/static/assets/icon-enabled-low.png" : "/static/assets/icon-low.png";
    browser.browserAction.setIcon({path: iconPath});
}
