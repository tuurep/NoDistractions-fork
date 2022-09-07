const defaultSettings = {
	enableOnStartup: false,
	visitAnywaysLength: 3
};

loadSettings();

document.querySelector("#settingsContainer").addEventListener("click", mouseEvent => saveSetting(mouseEvent.target));
document.querySelector("#resetSettings").addEventListener("click", resetSettings);
document.querySelector("#downloadBlocklist").addEventListener("click", downloadBlocklist);
document.querySelector("#importClipboardButton").addEventListener("click", importFromClipboard);
document.querySelector("#selectAll").addEventListener("click", selectAll);

async function loadSettings() {
	await checkMissingSettings(await getActiveSettings());
	activeSettings = await getActiveSettings();
	for (settingElement of document.querySelectorAll(".setting")) {
		if (settingElement.type == "checkbox") {
			settingElement.checked = activeSettings[settingElement.id];
		} else if (settingElement.type == "number") {
			settingElement.value = activeSettings[settingElement.id];
		}
	}
}

async function checkMissingSettings(settings) {
	
	for (settingKey in defaultSettings) {
		if (!settings[settingKey]) {
			settings[settingKey] = defaultSettings[settingKey];
		}
	}
	browser.storage.local.set({settings: settings});
	return settings;
}

async function getActiveSettings() {
	return (await browser.storage.local.get("settings")).settings;
}

async function saveSetting(element) {
	if (element.className == "setting") {
		let newSettings = await getActiveSettings();

		if (element.type == "checkbox") {
			newSettings[element.id] = element.checked;
		}  else if (settingElement.type == "number") {
			newSettings[element.id] = element.value;
		}

		console.log("setting new setting");
		console.log("new settings are: ", newSettings);
		browser.storage.local.set({settings: newSettings});
	}
}

async function resetSettings() {
	for (settingID in defaultSettings) {
		console.log("setting:", settingID);
		let settingElement = document.querySelector("#"+settingID);
		if (settingElement.type == "checkbox") {
			settingElement.checked = defaultSettings[settingID];
		}
		saveSetting(settingElement);
	}
	
}

async function downloadBlocklist() {
	const storage = await browser.storage.local.get("blockedSites_V1");
	let downloadElement = document.createElement("a");
	downloadElement.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(JSON.stringify(storage.blockedSites_V1)));
	downloadElement.setAttribute("download", "ND-SiteBlocklist");
  
	downloadElement.style.display = "none";
	document.body.appendChild(downloadElement);
  
	downloadElement.click();
  
	document.body.removeChild(downloadElement);
}

loadCopyTextarea();
async function loadCopyTextarea() {
	const storage = await browser.storage.local.get("blockedSites_V1");
	const copyTextarea = document.querySelector("#exportClipboard");
	copyTextarea.value = JSON.stringify(storage.blockedSites_V1);
}

async function selectAll() {
	document.querySelector("#exportClipboard").select();
}

function importFromClipboard() {
	const input = document.querySelector("#importClipboard").value;
	if (!input) {
		return displayImportAlert("Please input an array of sites.");
	}
	let newBlockedSites;
	try {
		newBlockedSites = JSON.parse(input);
	} catch {
		console.log("not json error");
		return displayImportAlert("Parsing input failed. Please input an array of sites.");
	}
	if (!Array.isArray(newBlockedSites)) {
		console.log("wrong input type error");
		return displayImportAlert("Incorrect type of data.");
	}


	browser.storage.local.set({blockedSites_V1: newBlockedSites});
	browser.runtime.sendMessage({type: "updatedBlocklist"});
	displayImportAlert("Imported list.", true);
}

function displayImportAlert(text, success) {
	console.log("improted alert func", text, success);
	const alertText = document.querySelector("#importAlertText");
	alertText.style.display = "block";
	if (success) {
		alertText.className = "success";
		alertText.innerText = text;
	} else {		
		alertText.className = "error";
		alertText.innerText = text+"\nCorrect usage: \n[\"example.org\", \"testsite.com\"]";
	}
}