const API_URL = "https://5d87-189-63-160-67.ngrok-free.app";

const $ = (id) => document.getElementById(id);

// Views
const viewMain = $("view-main");
const viewSettings = $("view-settings");

// Header
const jobSelect = $("job-select");

// Main view
const noJobState = $("no-job-state");
const jobLoadedState = $("job-loaded-state");
const jobTitle = $("job-title");
const jobCompany = $("job-company");
const jobType = $("job-type");
const jobLogo = $("job-logo");
const reqTags = [$("req-1"), $("req-2"), $("req-3")];

// Chat banner
const chatBanner = $("chat-banner");
const chatBannerName = $("chat-banner-name");

// Output
const outputSkeleton = $("output-skeleton");
const outputText = $("output-text");
const copyBtn = $("copy-btn");
const retryBtn = $("retry-btn");
const charCount = $("char-count");
const charBarFill = $("char-bar-fill");

// CTA
const findBtn = $("find-recruiters-btn");
const findBtnLabel = $("find-btn-label");

// Footer
const creditsUsed = $("credits-used");
const cvStatus = $("cv-status");
const cvStatusLabel = cvStatus.querySelector(".cv-status-label");

// Settings
const openSettingsBtn = $("open-settings-btn");
const closeSettingsBtn = $("close-settings-btn");
const resumeFileInput = $("resume-file-input");
const cvEmptyState = $("cv-empty-state");
const cvSavedState = $("cv-saved-state");
const cvFileName = $("cv-file-name");
const cvFileMeta = $("cv-file-meta");
const clearResumeBtn = $("clear-resume-btn");
const clearAllBtn = $("clear-all-btn");

let currentJob = null;
let generatedMsg = "";
let isGenerating = false;

document.addEventListener("DOMContentLoaded", async () => {
  await Promise.all([
    loadCvStatus(),
    loadRecentJobs(),
  ]);

  detectChatTab();
  bindEvents();
  startJobPolling();
});

let knownJobIds = new Set();

function startJobPolling() {
  setInterval(async () => {
    try {
      const apiKey = await getStoredApiKey();
      if (!apiKey) return;

      const res = await fetch(`${API_URL}/api/jobs/recent`);
      if (!res.ok) return;

      const jobs = await res.json();
      if (!jobs?.length) return;

      const newJobs = jobs.filter(j => !knownJobIds.has(j.id));
      if (!newJobs.length) return;

      newJobs.forEach((job) => {
        const opt = document.createElement("option");
        opt.value = job.id;
        opt.textContent = `${job.company} — ${job.title}`;
        jobSelect.insertBefore(opt, jobSelect.options[1]);
        knownJobIds.add(job.id);
      });

      if (knownJobIds.size === newJobs.length) {
        jobSelect.value = newJobs[0].id;
        jobSelect.classList.add("has-value");
        await selectJob(newJobs[0]);
      } else {
        showNewJobToast(newJobs[0]);
      }

    } catch (_) {
    }
  }, 3000);
}

async function loadRecentJobs() {
  try {
    const apiKey = await getStoredApiKey();
    if (!apiKey) return showNoJob();

    const res = await fetch(`${API_URL}/api/jobs/recent`);

    if (!res.ok) return showNoJob();

    const jobs = await res.json();
    if (!jobs?.length) return showNoJob();

    jobs.forEach((job) => {
      const opt = document.createElement("option");
      opt.value = job.id;
      opt.textContent = `${job.company} — ${job.title}`;
      jobSelect.appendChild(opt);
      knownJobIds.add(job.id);
    });

    jobSelect.value = jobs[0].id;
    jobSelect.classList.add("has-value");
    await selectJob(jobs[0]);

  } catch (err) {
    console.error("Failed to load jobs:", err);
    showNoJob();
  }
}

function showNewJobToast(job) {
  document.querySelector(".new-job-toast")?.remove();

  const toast = document.createElement("div");
  toast.className = "new-job-toast";
  toast.innerHTML = `
    <span>📋 New job captured: <strong>${job.title}</strong></span>
    <button class="toast-switch-btn">Switch</button>
  `;

  toast.querySelector(".toast-switch-btn").addEventListener("click", async () => {
    toast.remove();
    jobSelect.value = job.id;
    jobSelect.classList.add("has-value");
    await selectJob(job);
  });

  const outputSection = outputSkeleton.closest(".section");
  outputSection.parentNode.insertBefore(toast, outputSection);

  setTimeout(() => toast.remove(), 8000);
}

async function handleJobChange() {
  const selectedId = jobSelect.value;
  if (!selectedId) return showNoJob();

  jobSelect.classList.add("has-value");

  try {
    const apiKey = await getStoredApiKey();
    const res = await fetch(`${API_URL}/api/jobs/${selectedId}`, {
      headers: { "Authorization": `Bearer ${apiKey}` }
    });

    if (!res.ok) return showNoJob();

    const job = await res.json();
    await selectJob(job);
  } catch (err) {
    console.error("Failed to load job:", err);
    showNoJob();
  }
}

async function selectJob(job) {
  currentJob = job;

  jobTitle.textContent = job.title || "—";
  jobCompany.textContent = job.company || "—";
  jobType.textContent = job.type || "Full-time";

  if (job.companyDomain) {
    jobLogo.innerHTML = `<img src="https://www.google.com/s2/favicons?domain=${job.companyDomain}&sz=32" width="20" height="20" style="border-radius:4px" onerror="this.parentElement.textContent='🏢'" />`;
  } else {
    jobLogo.textContent = "🏢";
  }

  const reqs = job.requirements?.slice(0, 3) || [];
  reqTags.forEach((el, i) => { el.textContent = reqs[i] || ""; });

  findBtnLabel.textContent = `Find Recruiters at ${job.company}`;

  showJobLoaded();
  await generateMessage();
}

function showNoJob() {
  noJobState.classList.remove("hidden");
  jobLoadedState.classList.add("hidden");
}

function showJobLoaded() {
  noJobState.classList.add("hidden");
  jobLoadedState.classList.remove("hidden");
}

async function generateMessage() {
  if (!currentJob || isGenerating) return;

  isGenerating = true;
  generatedMsg = "";

  outputSkeleton.classList.remove("hidden");
  outputText.classList.add("hidden");
  updateCharBar(0);

  try {
    const cvText = await getStoredCv();

    const res = await fetch(`${API_URL}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        job: currentJob,
        cv: cvText || null,
      }),
    });

    if (!res.ok) throw new Error(`API error ${res.status}`);

    const data = await res.json();
    generatedMsg = data.message || "";

    if (data.creditsRemaining !== undefined) {
      creditsUsed.textContent = 10 - data.creditsRemaining;
    }

    renderMessage(generatedMsg);
  } catch (err) {
    renderError(err.message);
  } finally {
    isGenerating = false;
  }
}

function renderMessage(text) {
  outputSkeleton.classList.add("hidden");
  outputText.classList.remove("hidden");
  outputText.innerHTML = "";

  let i = 0;
  function type() {
    if (i < text.length) {
      outputText.innerHTML = escapeHtml(text.slice(0, i + 4))
        .replace(/\n\n/g, "<br><br>")
        .replace(/\n/g, "<br>");
      i += 4;
      setTimeout(type, 10);
    } else {
      outputText.innerHTML = escapeHtml(text)
        .replace(/\n\n/g, "<br><br>")
        .replace(/\n/g, "<br>");
      updateCharBar(text.length);
    }
  }
  type();
}

function renderError(msg) {
  outputSkeleton.classList.add("hidden");
  outputText.classList.remove("hidden");
  outputText.innerHTML = `<span style="color:var(--danger)">⚠ ${escapeHtml(msg)}</span>`;
}

function detectChatTab() {
  chrome.tabs.query({ url: "https://www.linkedin.com/messaging/*" }, (tabs) => {
    if (!tabs?.length) return;

    chrome.storage.session.get("activeChatRecruiter", ({ activeChatRecruiter }) => {
      showChatBanner(activeChatRecruiter?.name || "Open chat");
    });
  });
}

function showChatBanner(name) {
  chatBannerName.textContent = name;
  chatBanner.classList.remove("hidden");
}

function openRecruiterSearch() {
  if (!currentJob?.companySlug) return;
  const url = `https://www.linkedin.com/company/${currentJob.companySlug}/people/?keywords=recruiter`;
  chrome.tabs.create({ url });
}

async function loadCvStatus() {
  const { cvData } = await chromeGet("cvData");
  cvData?.name ? setCvReady(cvData.name, cvData.size) : setCvMissing();
}

function setCvReady(name, size) {
  cvStatus.dataset.state = "ready";
  cvStatusLabel.textContent = "CV Ready";
  cvEmptyState.classList.add("hidden");
  cvSavedState.classList.remove("hidden");
  clearResumeBtn.classList.remove("hidden");
  cvFileName.textContent = name;
  cvFileMeta.textContent = size ? formatBytes(size) : "Loaded";
}

function setCvMissing() {
  cvStatus.dataset.state = "missing";
  cvStatusLabel.textContent = "No CV";
  cvEmptyState.classList.remove("hidden");
  cvSavedState.classList.add("hidden");
  clearResumeBtn.classList.add("hidden");
}

async function handleFileUpload(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  if (file.size > 2 * 1024 * 1024) {
    alert("File too large. Max 2MB.");
    return;
  }

  const text = await readFileAsText(file);
  await chromeSet("cvData", { name: file.name, size: file.size, content: text });
  setCvReady(file.name, file.size);
}

async function clearResume() {
  await chromeRemove("cvData");
  setCvMissing();
  resumeFileInput.value = "";
}

async function getStoredCv() {
  const { cvData } = await chromeGet("cvData");
  return cvData?.content || null;
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

async function clearAll() {
  if (!confirm("Clear all saved jobs and data?")) return;
  await chrome.storage.local.clear();
  await chrome.storage.session.clear();
  window.location.reload();
}

function showSettings() {
  viewMain.classList.add("hidden");
  viewSettings.classList.remove("hidden");
}

function showMain() {
  viewSettings.classList.add("hidden");
  viewMain.classList.remove("hidden");
}

async function copyMessage() {
  if (!generatedMsg) return;
  await navigator.clipboard.writeText(generatedMsg);
  copyBtn.textContent = "✓ Copied";
  copyBtn.classList.add("copied");
  setTimeout(() => {
    copyBtn.textContent = "Copy";
    copyBtn.classList.remove("copied");
  }, 2000);
}

function updateCharBar(count) {
  const pct = Math.min((count / 300) * 100, 100);
  charCount.textContent = `${count} chars`;
  charBarFill.style.width = pct + "%";
  charBarFill.style.background =
    pct > 90 ? "var(--danger)" :
      pct > 70 ? "var(--warn)" :
        "var(--accent)";
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatBytes(bytes) {
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
}

function chromeGet(key) {
  return new Promise((resolve) => chrome.storage.local.get(key, resolve));
}

function chromeSet(key, value) {
  return new Promise((resolve) => chrome.storage.local.set({ [key]: value }, resolve));
}

function chromeRemove(key) {
  return new Promise((resolve) => chrome.storage.local.remove(key, resolve));
}

function bindEvents() {
  jobSelect.addEventListener("change", handleJobChange);
  copyBtn.addEventListener("click", copyMessage);
  retryBtn.addEventListener("click", generateMessage);
  findBtn.addEventListener("click", openRecruiterSearch);
  openSettingsBtn.addEventListener("click", showSettings);
  closeSettingsBtn.addEventListener("click", showMain);
  resumeFileInput.addEventListener("change", handleFileUpload);
  clearResumeBtn.addEventListener("click", clearResume);
  clearAllBtn.addEventListener("click", clearAll);
}