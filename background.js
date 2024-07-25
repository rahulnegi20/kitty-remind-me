const defaultInterval = 60; // in minutes
let reminderIntervalId;
let soundEnabled = false;

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ interval: defaultInterval, reminderActive: false, soundEnabled: false });
});

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

function startReminder(interval) {
  if (reminderIntervalId) {
    clearInterval(reminderIntervalId);
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
      chrome.tabs.query({}, (tabs) => {
        for (let i = 0; i < tabs.length; i++) {
          chrome.scripting.executeScript({
            target: { tabId: tabs[i].id },
            files: ['content.js']
          }, () => {
            const audioFileUrl = chrome.runtime.getURL('meow1.mp3');
            console.log("Sending message to tab id:", tabs[i].id);
            chrome.tabs.sendMessage(tabs[i].id, { action: 'playSound', fileName: audioFileUrl }, (response) => {
              if (chrome.runtime.lastError) {
                console.error("Error sending message:", chrome.runtime.lastError);
              } else {
                console.log("Message sent, response:", response);
              }
            });
          });
        }
      });
    }
  }, interval * 60 * 1000);
}

function stopReminder() {
  if (reminderIntervalId) {
    clearInterval(reminderIntervalId);
    reminderIntervalId = null;
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startReminder') {
    startReminder(message.interval);
    soundEnabled = message.soundEnabled;
    sendResponse({ status: 'started' });
  } else if (message.action === 'stopReminder') {
    stopReminder();
    sendResponse({ status: 'stopped' });
  }
  return true;
});

chrome.storage.sync.get(['interval', 'reminderActive', 'soundEnabled'], (result) => {
  soundEnabled = result.soundEnabled || false;
  if (result.reminderActive) {
    startReminder(result.interval || defaultInterval);
  }
});
