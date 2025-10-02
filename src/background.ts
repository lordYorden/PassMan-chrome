console.log("[PassMan] Background service worker started");

//Listen for messages from content script
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "openPopup") {
    console.log("[PassMan] Received request to open popup");

    //Open the popup programmatically
    chrome.action.openPopup().catch((error) => {
      console.error("[PassMan] Could not open popup:", error);
      chrome.action.setBadgeText({ text: "!" });
      chrome.action.setBadgeBackgroundColor({ color: "#0369a1" });
    });

    sendResponse({ success: true });
  }

  return true;
});

//Listen for storage changes to detect new pending credentials
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local" && changes.pendingCredentials) {
    const newValue = changes.pendingCredentials.newValue;

    if (newValue) {
      console.log("[PassMan] New pending credentials detected, opening popup");

      //Try to open the popup
      chrome.action.openPopup().catch((error) => {
        console.error("[PassMan] Could not open popup automatically:", error);
        chrome.action.setBadgeText({ text: "1" });
        chrome.action.setBadgeBackgroundColor({ color: "#0369a1" });
      });
    } else {
      //Credentials were cleared, remove badge
      chrome.action.setBadgeText({ text: "" });
    }
  }
});

//Clear badge when popup is opened
chrome.action.onClicked.addListener(() => {
  chrome.action.setBadgeText({ text: "" });
});
