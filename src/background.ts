console.log("[PassMan] Background service worker started");

//Helper to check if extension context is valid
function isContextValid() {
  return chrome.runtime?.id !== undefined;
}

//Listen for storage changes to detect new pending credentials
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (!isContextValid()) {
    return;
  }

  if (areaName === "local" && changes["_pending"]) {
    const newValue = changes["_pending"].newValue;

    if (newValue) {
      console.log("[PassMan] New pending credentials detected, opening popup");

      chrome.action
        .openPopup()
        .then(() => {
          // Popup opened successfully, clear any badge
          chrome.action.setBadgeText({ text: "" });
        })
        .catch((error) => {
          if (!isContextValid()) {
            console.log(
              "[PassMan] Extension context invalidated, skipping notification"
            );
            return;
          }

          console.error("[PassMan] Could not open popup automatically:", error);
          chrome.action.setBadgeText({ text: "1" });
          chrome.action.setBadgeBackgroundColor({ color: "#0369a1" });

          // Show notification as fallback
          chrome.notifications.create({
            type: "basic",
            iconUrl: chrome.runtime.getURL("icons/passman48.png"),
            title: "PassMan - Password Detected",
            message: "Click the extension icon to save your credentials",
            priority: 2,
          });
        });
    } else {
      //Credentials were cleared, remove badge
      chrome.action.setBadgeText({ text: "" });
    }
  }
});
