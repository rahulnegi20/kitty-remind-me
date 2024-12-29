const defaultInterval = 1; // in minutes
let reminderIntervalId = null;
let soundEnabled = false;

// Keep-alive logic
function keepAlive() {
  setInterval(() => {
    chrome.runtime.getPlatformInfo(function(info) {
      console.log('Keeping service worker alive. Platform: ' + info.os);
    });
  }, 20000); // Every 20 seconds
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ interval: defaultInterval, reminderActive: false, soundEnabled: false });
  initialize();
  keepAlive(); // Start keep-alive on install
});

chrome.runtime.onStartup.addListener(() => {
  initialize();
  keepAlive(); // Restart keep-alive on startup
});

function initialize() {
  chrome.tabs.query({}, (tabs) => {
    for (let tab of tabs) {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      }).catch(error => console.log('Error injecting content script:', error));
    }
  });
  chrome.storage.sync.get(['interval', 'reminderActive', 'soundEnabled'], (result) => {
    soundEnabled = result.soundEnabled || false;
    console.log("Started");
    if (result.reminderActive) {
      startReminder(result.interval || defaultInterval);
    }
    addListeners();
  });
}

chrome.tabs.onCreated.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['content.js']
  }).catch(error => console.log('Error injecting content script:', error));
});

function addListeners() {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync') {
      try {
        if (changes.interval && changes.interval.newValue) {
          console.log('Interval changed to:', changes.interval.newValue);
          startReminder(changes.interval.newValue);
        }
        if (changes.reminderActive) {
          if (changes.reminderActive.newValue) {
            chrome.storage.sync.get(['interval'], (result) => {
              startReminder(result.interval || defaultInterval);
            });
          } else {
            console.log('Reminder deactivated');
            stopReminder();
          }
        }
        if (changes.soundEnabled) {
          soundEnabled = changes.soundEnabled.newValue;
          console.log('Sound enabled:', soundEnabled);
        }
      } catch (error) {
        console.log('Error in storage change listener:', error);
      }
    }
  });

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    try {
      console.log('Received message:', message);
      if (message.type === 'keepAlive') {
        console.log('Keeping service worker alive');
        sendResponse({status: 'alive'});
      } else if (message.action === 'startReminder') {
        startReminder(message.interval);
        sendResponse({success: true});
      } else if (message.action === 'stopReminder') {
        stopReminder();
        sendResponse({success: true});
      } else if (message.action === 'checkAlive') {
        sendResponse({status: 'alive'});
      } else {
        sendResponse({success: false, error: 'Unknown action'});
      }
    } catch (error) {
      console.log('Error processing message:', error);
      sendResponse({success: false, error: error.message});
    }
    return true; // Keeps the message channel open for asynchronous responses
  });
}

function sendNotification() {
  chrome.windows.getLastFocused({ populate: true }, (window) => {
    const activeTab = window.tabs.find(tab => tab.active);
    if (activeTab) {
      const audioFileUrl = chrome.runtime.getURL('final_meow.mp3');
      chrome.tabs.sendMessage(activeTab.id, { action: 'playSound', fileName: audioFileUrl }, (response) => {
        if (chrome.runtime.lastError) {
          console.log("Error sending message to tab ID:", activeTab.id, chrome.runtime.lastError);
        } else {
          console.log("Message sent to tab ID:", activeTab.id, "Response:", response);
        }
      });
    }
  });
}

function startReminder(interval) {
  console.log(`Starting reminder with interval: ${interval} minutes`);
  stopReminder(); // Clear existing interval if any
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
  console.log('Stopping reminder');
  if (reminderIntervalId) {
    clearInterval(reminderIntervalId);
    reminderIntervalId = null;
  }
}