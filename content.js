// content.js
console.log("LOADED2..............")

// content.js
console.log("Content script loaded.");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Message received in content script:", message);
  if (message.action === 'playSound') {
    var audio = new Audio(message.fileName);
    console.log("Audio:", audio);
    audio.play().catch(error => console.error("Error playing sound:", error));

    // document.body.addEventListener('click', () => {
    //   console.log("Playing sound...");
    // }, { once: true });
  }
});
