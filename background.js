const API_URL = "https://5d87-189-63-160-67.ngrok-free.app";

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete") return;
  if (!tab.url?.includes("linkedin.com")) return;

  chrome.scripting.executeScript({
    target: { tabId },
    files: ["content.js"],
  }).catch(() => {
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "JOB_TEXT_CAPTURED") {
    handleJobText(message.payload, sender.tab?.id)
      .then(() => sendResponse({ ok: true }))
      .catch((err) => sendResponse({ ok: false, error: err.message }));
    return true;
  }

  if (message.type === "REQUEST_SCREENSHOT") {
    handleScreenshot(sender.tab?.id)
      .then(() => sendResponse({ ok: true }))
      .catch((err) => sendResponse({ ok: false, error: err.message }));
    return true;
  }
});

async function handleJobText(payload, tabId) {
  if (!payload?.rawText) return;

  if (payload.linkedinJobId) {
    const alreadySaved = await wasAlreadySaved(payload.linkedinJobId);
    if (alreadySaved) {
      console.log("[AbordaAI] Job already saved, skipping:", payload.linkedinJobId);
      return;
    }
  }

  const res = await fetch(`${API_URL}/api/jobs/extract`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      rawText: payload.rawText,
      method: "text",
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `API error ${res.status}`);
  }

  if (payload.linkedinJobId) {
    await markAsSaved(payload.linkedinJobId);
  }

  if (tabId) setBadge(tabId, "✓");

  console.log("[AbordaAI] Job text sent to API for extraction.");
}

async function handleScreenshot(tabId) {
  if (!tabId) throw new Error("No tab ID for screenshot");

  console.log("[AbordaAI] Taking screenshot of tab:", tabId);

  const dataUrl = await chrome.tabs.captureVisibleTab(null, {
    format: "png",
    quality: 85,
  });

  const base64Image = dataUrl.replace(/^data:image\/png;base64,/, "");

  const tab = await chrome.tabs.get(tabId);
  const jobIdMatch = tab.url?.match(/\/jobs\/view\/(\d+)/);
  const linkedinJobId = jobIdMatch?.[1] || "";

  if (linkedinJobId) {
    const alreadySaved = await wasAlreadySaved(linkedinJobId);
    if (alreadySaved) {
      console.log("[AbordaAI] Job already saved (screenshot dedup), skipping.");
      return;
    }
  }

  const res = await fetch(`${API_URL}/api/jobs/extract`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      screenshot: base64Image,
      method: "screenshot",
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `API error ${res.status}`);
  }

  if (linkedinJobId) await markAsSaved(linkedinJobId);

  if (tabId) setBadge(tabId, "✓");

  console.log("[AbordaAI] Screenshot sent to API for vision extraction.");
}

function setBadge(tabId, text) {
  chrome.action.setBadgeText({ text, tabId });
  chrome.action.setBadgeBackgroundColor({ color: "#f0c94a", tabId });
  setTimeout(() => {
    chrome.action.setBadgeText({ text: "", tabId });
  }, 4000);
}

async function wasAlreadySaved(jobId) {
  return new Promise((resolve) => {
    chrome.storage.session.get("savedJobIds", ({ savedJobIds }) => {
      resolve((savedJobIds || []).includes(jobId));
    });
  });
}

async function markAsSaved(jobId) {
  return new Promise((resolve) => {
    chrome.storage.session.get("savedJobIds", ({ savedJobIds }) => {
      const ids = savedJobIds || [];
      if (!ids.includes(jobId)) ids.push(jobId);
      chrome.storage.session.set({ savedJobIds: ids.slice(-20) }, resolve);
    });
  });
}