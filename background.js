const defaultBlockedSites = ["twitter.com", "reddit.com", "facebook.com"];
const defaultSettings = {
	enableOnStartup: false,
	visitAnywaysLength: 3
};
let enabled = false;
let blockExceptions = [];
browser.runtime.onInstalled.addListener(handleInstalled);
if (browser.storage.local.get("initialSetup") == true) {
  initalize();
}
async function initalize() {
  await updateRequestListener();
  browser.storage.local.get("settings").then(res => {
    enabled = res.settings.enableOnStartup;
  });
  browser.runtime.onMessage.addListener(handleMessage);
} 

async function handleInstalled(details) {
  if (details.reason !== "install") return;
  const blockedSites = await browser.storage.local.get("blockedSites_V1");
  if (Object.keys(blockedSites) == 0) {
      await browser.storage.local.set({blockedSites_V1: defaultBlockedSites});
  }
  const settings = await browser.storage.local.get("settings");
  if (Object.keys(settings) == 0) {
    await browser.storage.local.set({settings: defaultSettings});
  }

  await browser.storage.local.set({initialSetup: true});
  console.log("OK! calling initialize");
  initalize();
}

async function getBlocklistURLPatterns() {
  let loadedBlocklist = await browser.storage.local.get("blockedSites_V1");
  let URLPatterns = [];
  if (Object.keys(loadedBlocklist) == 0) {
    console.error("Failed to load the blocklist.");
  } 
  for (siteDomain of loadedBlocklist.blockedSites_V1) {
    URLPatterns.push("*://"+siteDomain+"/*");
    if (!siteDomain.startsWith("*.") && !siteDomain.startsWith("www.")) { // this is done for user friendliness sakes. I hope it's something sensical to do and doesn't cause any issues.
      console.log("registering a www block for "+siteDomain);
      URLPatterns.push("*://www."+siteDomain+"/*");
    }
  }
  return URLPatterns;
}
async function updateRequestListener() {
  await browser.webRequest.onBeforeRequest.removeListener(handleSite);
  return browser.webRequest.onBeforeRequest.addListener(handleSite, {urls: await getBlocklistURLPatterns(), types: ["main_frame", "sub_frame"]}, ["blocking"]); // TODO: web_manifest type is not available on chrome, but is on firefox
}

async function handleMessage(request, sender, sendResponse) {
  let storage = await browser.storage.local.get("blockedSites_V1");
  // a better looking way to do this, rather than a switch statement, would be to create an object with a bunch of functions that can be ran from messages like "messageHandlers[request.type]();"
  switch(request.type) {
    case "updatedBlocklist": {
      updateRequestListener();
      resolve(true);
      break;
    }
    case "isEnabled": {
      resolve({response: enabled});
      break;
    }
    case "toggleEnabled": {
      enabled = !enabled;
      resolve({response: enabled});
      break;
    }
    case "setEnabled": {
      enabled = request.enabled;
      resolve({response: enabled});
      break;
    }
    case "addBlockingException": {
      blockExceptions.push(request.data);
      resolve({response: true});
      if (request.data.allowedLength > 60000) {
        setTimeout(() => {
          browser.tabs.get(request.data.tabId).then(tab => {
            console.log("tab: ", tab);
            if (!enabled) return removeException(request.data);
            createNotification("visit-anyways-reminder", "You have less than one minute remaining before you get locked out again.");
            browser.browserAction.setBadgeText({
              text: "1m",
              tabId: tab.id
            });
            setTimeout(() => {
              if (!enabled) return removeException(request.data);
              // TODO: Need to check if the site currently on should be blocked or not. Although i can't think of any good way of doing this with how the extension currently works
              browser.tabs.get(request.data.tabId).then(tab => {
                // browser.tabs.update(tab.id, {url: `/static/blocked/blocked.html?url=${tab.url}`});
                console.log("NEED TO CHECK URL ", tab.url);
              })
              .catch(err => {
                console.log("removing From tab from blocklist because the tab doesn't exist anymore.");
                return removeException(request.data);
              });
            }, 60000);
          })
          .catch(err => {
            console.log("removing From tab from blocklist because the tab doesn't exist anymore.");
            return removeException(request.data);
          });
          // if (request.data.tab)
        }, request.data.allowedLength-60000);
      }
    }
  }
}

async function handleSite(details) {
  console.log("hadnling a site, details: ", details);
  if (!enabled) return;
  for (exception of blockExceptions) {
    if (details.tabId == exception.tabId) {
      if (Date.now() > details.deathDate) {
        console.log("deleting old");
        removeException(exception);
        break;
      }
      return;
    }
  }
  console.log("site was actually blocked.");
  // browser.tabs.update(details.tabId, {url: `/static/blocked/blocked.html?url=${details.url}`});
  console.log("trying to redirect to "+browser.runtime.getURL(`/static/blocked/blocked.html?url=${details.url}`));
  return {
    redirectUrl: browser.runtime.getURL(`/static/blocked/blocked.html?url=${details.url}`)
  };
}

function createNotification(name, alertmessage) {
	browser.notifications.create(name, {
		type: "basic",
		iconUrl: "/assets/icon.png",
		title: "NoDistractions",
		message: alertmessage
	});
}

function removeException(item) {
  const itemIndex = blockExceptions.indexOf(item);
  if (itemIndex != -1) { // -1 is returend when an item is not present in an array
    blockExceptions.splice(itemIndex, 1);
  }
}