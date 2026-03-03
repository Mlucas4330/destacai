(function () {
  "use strict";

  const url = window.location.href;

  if (isJobPage(url)) handleJobPage();
  else if (isChatPage(url)) handleChatPage();

  function isJobPage(u) { return /linkedin\.com\/jobs\//.test(u); }
  function isChatPage(u) { return /linkedin\.com\/messaging\//.test(u); }

  function handleJobPage() {
    console.log("[AbordaAI] Job page detected, waiting for page to stabilize…");

    waitForPageStable((pageText) => {
      if (pageText.length < 300) {
        console.warn("[AbordaAI] Page text too short even after stabilization:", pageText.length, "chars");
        return;
      }

      console.log("[AbordaAI] Page stable. Captured", pageText.length, "chars.");

      chrome.runtime.sendMessage({
        type: "JOB_TEXT_CAPTURED",
        payload: {
          rawText: pageText,
          linkedinJobId: getLinkedInJobId(),
          pageUrl: window.location.href,
          scrapedAt: Date.now(),
        },
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.warn("[AbordaAI] Message error:", chrome.runtime.lastError.message);
          return;
        }
        console.log("[AbordaAI] Background response:", response);
      });
    });
  }

  function waitForPageStable(callback) {
    let lastLength = 0;
    let stableCount = 0;
    let elapsed = 0;
    const INTERVAL = 500;
    const STABLE = 3;
    const TIMEOUT = 15000;

    const interval = setInterval(() => {
      elapsed += INTERVAL;

      const current = document.body.innerText?.length || 0;

      if (current > 0 && current === lastLength) {
        stableCount++;
        console.log(`[AbordaAI] Stable check ${stableCount}/${STABLE} — ${current} chars`);

        if (stableCount >= STABLE) {
          clearInterval(interval);
          callback(document.body.innerText.trim());
        }
      } else {
        stableCount = 0;
        lastLength = current;
      }

      if (elapsed >= TIMEOUT) {
        clearInterval(interval);
        console.warn("[AbordaAI] Timeout waiting for page stability. Sending what we have…");
        const text = document.body.innerText?.trim() || "";
        if (text.length > 300) callback(text);
      }
    }, INTERVAL);
  }

  function getLinkedInJobId() {
    const match = window.location.pathname.match(/\/jobs\/view\/(\d+)/);
    return match?.[1] || "";
  }

  function handleChatPage() {
    waitForPageStable(() => {
      chrome.storage.session.set({
        activeChatRecruiter: true
      });

      console.log("[AbordaAI] Chat recruiter detected:");
    });
  }
})();