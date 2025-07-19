// AI Paraphraser - Background Script
console.log('AI Paraphraser background script loaded');

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('AI Paraphraser installed');
});

// Add your background logic here