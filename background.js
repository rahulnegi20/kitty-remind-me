const defaultInterval = 60; // in minutes
let reminderIntervalId = null;
let soundEnabled = false;
let listenersAdded = false; // Flag to ensure listeners are only added once

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ interval: defaultInterval, reminderActive: false, soundEnabled: false });
});

chrome.runtime.onStartup.addListener(() => {
  initialize();
});

// Central initialization function
function initialize() {
  chrome.storage.sync.get(['interval', 'reminderActive', 'soundEnabled'], (result) => {
    soundEnabled = result.soundEnabled || false;
    console.log("Started");

    if (result.reminderActive) {
      startReminder(result.interval || defaultInterval);
      sendNotification();
    }

    if (!listenersAdded) {
      addListeners();
      listenersAdded = true; // Mark listeners as added
    }
  });
}

// Add event listeners This adds a listener that gets triggered whenever there's a change in Chrome's storage.
function addListeners() {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync') {
      if (changes.interval) {
        startReminder(changes.interval.newValue);
      }
      if (changes.reminderActive && !changes.reminderActive.newValue) {
        stopReminder();
      }
      if (changes.soundEnabled) {
        soundEnabled = changes.soundEnabled.newValue;
      }
    }
  });
}

function injectContentScript(tabId) {
  chrome.scripting.executeScript({
    target: { tabId: tabId },
    files: ['content.js']
  }).catch(error => console.error("Error injecting content script:", error));
}

function sendNotification() {
  chrome.windows.getLastFocused({ populate: true }, (window) => {
    const activeTab = window.tabs.find(tab => tab.active);
    if (activeTab) {
      const audioFileUrl = chrome.runtime.getURL('final_meow.mp3');
      chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        files: ['content.js']
      }, () => {
        chrome.tabs.sendMessage(activeTab.id, { action: 'playSound', fileName: audioFileUrl }, (response) => {
          if (chrome.runtime.lastError) {
            console.log("Error sending message to tab ID:", activeTab.id, chrome.runtime.lastError);
          } else {
            console.log("Message sent to tab ID:", activeTab.id, "Response:", response);
          }
        });
      });
    }
  });
}

function startReminder(interval) {
  if (reminderIntervalId) {
    clearInterval(reminderIntervalId); // Clear existing interval
  }

  reminderIntervalId = setInterval(() => {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/kitty.png',
      title: 'Time to Drink Water!',
      message: 'Stay hydrated! 🐱',
      priority: 0
    });

    if (soundEnabled) {
      sendNotification();
    }
  }, interval * 60 * 1000); // Convert minutes to milliseconds
}

function stopReminder() {
  if (reminderIntervalId) {
    clearInterval(reminderIntervalId);
    reminderIntervalId = null;
  }
}

// Initialize on startup or installation
chrome.runtime.onInstalled.addListener(initialize);
chrome.runtime.onStartup.addListener(initialize);
