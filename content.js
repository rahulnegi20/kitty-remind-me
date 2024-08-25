// content.js
console.log("LOADED2..............")

// content.js
console.log("Content script loaded.");

chrome.runtime.sendMessage({action: "checkAlive"}, function(response) {
  if (response && response.status === 'alive') {
    console.log("Background script is alive");
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received in content script:", message);
  if (message.action === 'playSound') {
    var audio = new Audio(message.fileName);
    console.log("Audio:", audio);
    audio.play().catch(error => console.error("Error playing sound:", error));
    sendResponse(true);
    // document.body.addEventListener('click', () => {
    //   console.log("Playing sound...");
    // }, { once: true });
  }
  else{
    console.log("Gotcha:");
  }
});
