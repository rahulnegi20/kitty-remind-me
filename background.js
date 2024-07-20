const defaultInterval = 60; // in minutes

let reminderIntervalId;

// Initialize settings and start the reminder when the extension is installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ interval: defaultInterval, reminderActive: false });
});

// Listen for changes in storage and update the reminder interval accordingly
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.interval) {
    startReminder(changes.interval.newValue);
  }
  if (area === 'sync' && changes.reminderActive && !changes.reminderActive.newValue) {
    stopReminder();
  }
});

// Start or restart the reminder based on the interval
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
  }, interval * 60 * 1000);
}

// Stop the reminder
function stopReminder() {
  if (reminderIntervalId) {
    clearInterval(reminderIntervalId);
    reminderIntervalId = null;
  }
}

// Handle messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startReminder') {
    startReminder(message.interval);
    sendResponse({status: 'started'});
  } else if (message.action === 'stopReminder') {
    stopReminder();
    sendResponse({status: 'stopped'});
  }
  return true; // Indicate that you want to send a response asynchronously
});

// Ensure the reminder is started with the default or previously saved interval on extension start
chrome.storage.sync.get(['interval', 'reminderActive'], (result) => {
  if (result.reminderActive) {
    startReminder(result.interval || defaultInterval);
  }
});
