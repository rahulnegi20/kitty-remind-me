var background = chrome.extension.getBackgroundPage (); 
document.addEventListener('DOMContentLoaded', () => {
  const intervalInput = document.getElementById('interval');
  const saveButton = document.getElementById('save');
  const stopButton = document.getElementById('stop');
  const soundCheckbox = document.getElementById('sound');

  // Load the current settings from storage
  chrome.storage.sync.get(['interval', 'reminderActive', 'soundEnabled'], (result) => {
    intervalInput.value = result.interval || 60;
    if (result.reminderActive) {
      stopButton.style.display = 'inline-block';
    }
    soundCheckbox.checked = result.soundEnabled || false;
  });

  // Save the new interval and start the reminder
  saveButton.addEventListener('click', () => {
    const interval = parseInt(intervalInput.value, 10);
    const soundEnabled = soundCheckbox.checked;
    chrome.storage.sync.set({ interval, reminderActive: true, soundEnabled }, () => {
      chrome.runtime.sendMessage({ action: 'startReminder', interval, soundEnabled }, (response) => {
        if (chrome.runtime.lastError) {
          console.error("Error sending message:", chrome.runtime.lastError);
        } else {
          stopButton.style.display = 'inline-block';
        }
      });
    });
  });

  // Stop the reminders
  stopButton.addEventListener('click', () => {
    chrome.storage.sync.set({ reminderActive: false }, () => {
      chrome.runtime.sendMessage({ action: 'stopReminder' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error("Error sending message:", chrome.runtime.lastError);
        } else {
          stopButton.style.display = 'none';
        }
      });
    });
  });
});
