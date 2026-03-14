chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'destacaai-capture',
    title: 'Use as job description in DestacaAI',
    contexts: ['selection'],
  })
})

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === 'destacaai-capture' && info.selectionText) {
    chrome.storage.local.set({ pendingDescription: info.selectionText }, () => {
      chrome.action.openPopup()
    })
  }
})
