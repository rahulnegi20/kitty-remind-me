const defaultInterval = 60; // in minutes
let reminderIntervalId;
let soundEnabled = false;

// Set default values when the extension is installed
chrome.runtime.onInstalled.addListener(() => {
  console.log('Service worker installed');
  chrome.storage.sync.set({ interval: defaultInterval, reminderActive: false, soundEnabled: false });
  chrome.alarms.create('reminderCheck', { periodInMinutes: 1 });
});

// Ensure the service worker starts up when Chrome starts
chrome.runtime.onStartup.addListener(() => {
  console.log('onStartup()');
  chrome.storage.sync.get(['interval', 'reminderActive', 'soundEnabled'], (result) => {
    soundEnabled = result.soundEnabled || false;
    if (result.reminderActive) {
      startReminder(result.interval || defaultInterval);
    }
  });
  chrome.alarms.create('reminderCheck', { periodInMinutes: 1 });
});

// Listen for alarm events
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'reminderCheck') {
    console.log('Alarm triggered: reminderCheck');
    chrome.storage.sync.get(['interval', 'reminderActive', 'soundEnabled'], (result) => {
      if (result.reminderActive) {
        startReminder(result.interval || defaultInterval);
      }
    });
  }
});

// Listen for changes in storage
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

// Function to start the reminder
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
            const audioFileUrl = chrome.runtime.getURL('final_meow.mp3');
            console.log("Sending message to tab id:", tabs[i].id, "with URL:", audioFileUrl);
            chrome.tabs.sendMessage(tabs[i].id, { action: 'playSound', fileName: audioFileUrl }, (response) => {
              if (chrome.runtime.lastError) {
                console.error("Error sending message:", chrome.runtime.lastError.message);
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

// Function to stop the reminder
function stopReminder() {
  if (reminderIntervalId) {
    clearInterval(reminderIntervalId);
    reminderIntervalId = null;
  }
}

// Listen for messages from other parts of the extension
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

// Get initial values from storage and start the reminder if needed
chrome.storage.sync.get(['interval', 'reminderActive', 'soundEnabled'], (result) => {
  soundEnabled = result.soundEnabled || false;
  if (result.reminderActive) {
    startReminder(result.interval || defaultInterval);
  }
});

// Listener for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    console.log('Tab updated:', tabId, tab.url);
  }
});
