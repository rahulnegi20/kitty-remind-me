const defaultInterval = 60; // in minutes
let reminderIntervalId;
let soundEnabled = false;

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ interval: defaultInterval, reminderActive: false, soundEnabled: false });
});

chrome.runtime.onStartup.addListener(() => {
  console.log('onStartup()');
  chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    console.log('Tab updated:', tabId, tab.url);
    if (changeInfo.status === 'complete') {
      // Check if the tab URL is a new tab or about:blank
      if (tab.url === 'chrome://newtab/' || tab.url === 'about:blank') {
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['content.js']
        });
      }
    }
  });
  // chrome.storage.sync.get(['interval', 'reminderActive', 'soundEnabled'], (result) => {
  //   soundEnabled = result.soundEnabled || true;
  //   chrome.tabs.query({currentWindow: true}, (tabs) => {
  //     // for (let i = 0; i < tabs.length; i++) {
  //       console.log(tabs[0].url);
  //       chrome.scripting.executeScript({
  //         target: { tabId: tabs[0].id },
  //         files: ['content.js']
  //       }, () => {
  //         console.log("Sending message to tab id:", tabs[0].id);
  //         chrome.tabs.sendMessage(tabs[0].id, { action: 'as', fileName: "" }, (response) => {
  //           if (chrome.runtime.lastError) {
  //             console.log("Error sending message:", chrome.runtime.lastError);
  //           } else {
  //             console.log("Message sent, response:", response);
  //           }
  //         });
  //       });
  //     // }
  //   });
  //   if (result.reminderActive) {
  //     startReminder(result.interval || defaultInterval);
  //   }
  // });
});

// chrome.storage.onChanged.addListener((changes, area) => {
//   if (area === 'sync') {
//     if (changes.interval) {
//       startReminder(changes.interval.newValue);
//     }
//     if (changes.reminderActive && !changes.reminderActive.newValue) {
//       stopReminder();
//     }
//     if (changes.soundEnabled) {
//       soundEnabled = changes.soundEnabled.newValue;
//     }
//   }
// });

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
    } 
  )};
  });
  // chrome.tabs.query({}, (tabs) => {
  //   // for (let i = 0; i < tabs.length; i++) {
  //     const activeTab = window.tabs.find(tab => tab.active);
      
  //     chrome.scripting.executeScript({
  //       target: { tabId: tabs[0].id },
  //       files: ['content.js']
  //     }, () => {
  //       const audioFileUrl = chrome.runtime.getURL('final_meow.mp3');
  //       console.log("Sending message to tab id:", tabs[0].id);
  //       chrome.tabs.sendMessage(tabs[0].id, { action: 'playSound', fileName: audioFileUrl }, (response) => {
  //         if (chrome.runtime.lastError) {
  //           console.log("Error sending message:", chrome.runtime.lastError);
  //         } else {
  //           console.log("Message sent, response:", response);
  //         }
  //       });
  //     });
  //   // }
  // });
}

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
      sendNotification();
    }
  }, interval * 60 * 1000);
}

function stopReminder() {
  if (reminderIntervalId) {
    clearInterval(reminderIntervalId);
    reminderIntervalId = null;
  }
}

// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   if (message.action === 'startReminder') {
//     startReminder(message.interval);
//     soundEnabled = message.soundEnabled;
//     sendResponse({ status: 'started' });
//   } else if (message.action === 'stopReminder') {
//     stopReminder();
//     sendResponse({ status: 'stopped' });
//   }
//   return true;
// });

chrome.storage.sync.get(['interval', 'reminderActive', 'soundEnabled'], (result) => {
  soundEnabled = result.soundEnabled || false;
  if (result.reminderActive) {
    startReminder(result.interval || defaultInterval);
    // sendNotification();
  }
});

chrome.tabs.onCreated.addListener((tab) => {
  // Check if the new tab has finished loading
  chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    console.log('Tab updated:', tabId, tab.url);
    if (changeInfo.status === 'complete') {
      // Check if the tab URL is a new tab or about:blank
      if (tab.url === 'chrome://newtab/' || tab.url === 'about:blank') {
        console.log("SENTTTTT");
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['content.js']
        }).catch(error => console.error("Error playing sound:", error));
      }
    }
  });
});
