# DestacaAI

Automate your LinkedIn recruiter outreach with personalized CV-consistent messages.

## The Problem

Premium LinkedIn users can send AI-generated messages 
directly to recruiters, giving them an enormous advantage over other 
candidates.

You can find recruiters without premium, but it's hard to know how to 
approach them. Should the message be friendly? Professional? About 
skills or experience? How do you show interest without looking anxious?

Even with tools like Claude, Gemini or ChatGPT available, it's easy to 
lose track of what you sent and whether it's consistent with your CV.

## The Solution

DestacaAI is a Chrome extension that automatically reads job descriptions, 
finds the company's recruiters on LinkedIn, and generates a personalized 
outreach message based on your CV - keeping your approach consistent 
across every application.

## Functional Requirements

- User can see all saved jobs when opening the extension
- User can be redirected to the company's recruiters page on LinkedIn
- User can delete a saved job from the dropdown
- Saving the same job twice is prevented by checking the job ID
- Free plan is limited to 50 saved jobs
- User can edit the generated message before copying
- If the API key is invalid or quota is exceeded, the user is notified
- User can clear all data
- If no jobs are saved, an empty state message is shown

## Non-Functional Requirements

- Only job title, company and message are loaded on popup open, details load on demand
- Jobs and messages are deleted after 30 days

## Initial UX Flow

![UX Flow](./public/ux-flow.png)

## Changes from initial UX flow

### Removed
- Message history / previous versions
- Dual pagination (1-20 list + 1/total counter)

### Changed
- Job description input moved to a dedicated "Add Job" screen
- Config auto-saves without a Save button
- Form state survives popup close/reopen
- Auto-navigation to Add Job on right-click or saved draft
- Language toggle (EN/PT) added to settings

## Pivot - CV Tailoring

### What changed
- Product pivot rationale
- New core feature: CV highlight generation
- Auto language detection from job description
- Removed: outreach message, recruiter redirect, message editing, regenerate

## Architecture

- No backend - all data stored in `chrome.storage.local`
- BYOK (bring your own key) - user provides their own LLM API key
- Message generation calls the LLM API directly from the extension
- No sync across devices (planned for future versions)

## How to Run

```bash
npm install
npm run build
```

Then in Chrome:
1. Go to `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `dist/` folder