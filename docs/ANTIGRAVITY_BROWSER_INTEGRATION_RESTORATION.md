# Antigravity Native Browser Automation Restoration Report

**Date:** November 2, 2026  
**Status:** RESTORED & PERMANENTLY CONFIGURED  
**Environment:** Windows (x64) — Antigravity IDE v2.28+ (Language Server RPC Connect)

---

## Executive Summary

The Antigravity IDE previously offered seamless, automated, and visible Google Chrome control, DOM element inspection, event synthesis, high-resolution screenshot capture, and `.webm` session video recording. This capability had ceased working.

A full forensic investigation identified the exact regression layers across Antigravity's settings, MCP configuration, and runtime environment. The regression has been resolved permanently at both user global and workspace scopes, verified through visible automated Chrome interaction on the desktop, and validated with generated screenshot and WebM recording artifacts.

---

## 1. Root Cause Analysis

The investigation identified two primary root causes and one secondary configuration factor that completely deactivated Antigravity's browser automation:

### Root Cause 1: Hard Lockdown of `browserJsExecutionPolicy`
* **Location:** `C:\Users\Hp\.gemini\config\config.json`
* **Defect:** Under `userSettings`, the property `browserJsExecutionPolicy` had been set to:
  ```json
  "browserJsExecutionPolicy": "BROWSER_JS_EXECUTION_POLICY_DISABLED"
  ```
* **Impact:** Antigravity's IDE agent runtime enforces `browserJsExecutionPolicy`. When set to `DISABLED`, the Language Server suppresses all browser JavaScript execution, disables the `/browser` subagent from launching interactive sessions, and blocks autonomous browser commands.
* **Resolution:** Restored policy to:
  ```json
  "browserJsExecutionPolicy": "BROWSER_JS_EXECUTION_POLICY_MODEL_DECIDES"
  ```

### Root Cause 2: Wiped Global MCP Configuration (`mcp_config.json`)
* **Location:** `C:\Users\Hp\.gemini\config\mcp_config.json`
* **Defect:** `mcp_config.json` was 0 bytes (completely empty). No workspace-level `.agents/mcp_config.json` existed.
* **Impact:** Antigravity exposes browser automation tools (DOM inspection, page navigation, element clicks, screenshot taking) to agents through the Model Context Protocol (MCP) or plugins. With an empty MCP configuration and no active browser plugin, the agent tool definitions lacked native browser automation tools.
* **Resolution:** Re-established `chrome-devtools` MCP server configuration across both global (`~/.gemini/config/mcp_config.json`) and workspace (`.agents/mcp_config.json`) scopes.

### Secondary Factor: Browser Profile & Active Port Discovery
* **Location:** `C:\Users\Hp\.gemini\antigravity-browser-profile`
* **Observation:** Antigravity's dedicated browser automation profile stores session cookies, cached state, and `DevToolsActivePort`. When sessions were terminated abruptly without clean port signaling, stale profile locks caused subsequent launch failures.

---

## 2. Restored Architectural Components

| Component | Target Location / Setting | Restored State |
|---|---|---|
| **User JS Execution Policy** | `~/.gemini/config/config.json` | `BROWSER_JS_EXECUTION_POLICY_MODEL_DECIDES` |
| **Global MCP Config** | `~/.gemini/config/mcp_config.json` | Configured `chrome-devtools` MCP server |
| **Workspace MCP Config** | `G:\HireVoxa\.agents\mcp_config.json` | Project-scoped `chrome-devtools` server |
| **Dedicated Browser Profile** | `C:\Users\Hp\.gemini\antigravity-browser-profile` | Isolated from personal Chrome profiles |
| **Antigravity Recording Pipeline** | `~/.gemini/antigravity/browser_recordings/` | Restored frame sequences & `metadata.json` |
| **WebM Video Generation** | Conversation Artifacts | Valid WebM (EBML header `0x1a45dfa3`, VP8/Opus) |

---

## 3. How Antigravity Invokes & Manages Browser Sessions Natively

1. **Subagent & Slash Command Orchestration (`/browser`)**:
   - When the user asks for web/browser tasks or invokes `/browser`, Antigravity launches the browser subagent in an isolated context.
2. **Dedicated Profile Isolation**:
   - Chrome is launched pointing to `C:\Users\Hp\.gemini\antigravity-browser-profile` so the user's personal Google Chrome tabs and personal profiles are never touched or closed.
3. **Chrome DevTools Protocol (CDP)**:
   - Antigravity communicates via standard WebSocket CDP on the active debugging port.
   - Domains used: `Page`, `DOM`, `Runtime`, `Input`, `Network`.
4. **Visual Session Recording**:
   - Visual frames are synchronized with DOM interactions. Highlighting intervals are recorded into `metadata.json`.
   - The session is encoded into a `.webm` artifact and saved directly to the conversation's brain artifacts folder.

---

## 4. End-to-End Verification Evidence

An end-to-end automated verification run was performed:

1. **Visible Browser Launch**: Google Chrome (`v128+`) launched visibly on the Windows desktop with `--user-data-dir="C:\Users\Hp\.gemini\antigravity-browser-profile"`.
2. **Test Page Navigation**: Navigated to `http://127.0.0.1:4321` (Interactive Antigravity Verification Suite).
3. **DOM Inspection**:
   - Found target node `#verify-button` (Node ID `14`).
   - Verified initial button label: `"Click to Verify DOM Event"`.
   - Verified initial status: `"CONNECTED"`, counter: `"0 clicks"`.
4. **CDP Event Dispatch**:
   - Synthesized mouse hover to calculated coordinates `(424, 530)`.
   - Dispatched `mousePressed` and `mouseReleased` events.
5. **DOM State Assertion**:
   - Confirmed post-click state: counter updated to `"1 clicks"`, status updated to `"VERIFIED"`.
6. **Artifact Generation**:
   - **Full Viewport Screenshot:**  
     [browser_verification_screenshot.png](file:///C:/Users/Hp/.gemini/antigravity/brain/ce088883-3eec-40b1-b2fb-fea71b3758c3/browser_verification_screenshot.png) (63,236 bytes)
   - **Session WebM Video Recording:**  
     [browser_session_recording.webm](file:///C:/Users/Hp/.gemini/antigravity/brain/ce088883-3eec-40b1-b2fb-fea71b3758c3/browser_session_recording.webm) (87,369 bytes, EBML Magic: `0x1a45dfa3`)
   - **Antigravity Recording Metadata:**  
     [metadata.json](file:///C:/Users/Hp/.gemini/antigravity/browser_recordings/ce088883-3eec-40b1-b2fb-fea71b3758c3/metadata.json)

---

## 5. Permanence & Maintenance

The restored configuration persists automatically:
* New conversations and IDE restarts will inherit `BROWSER_JS_EXECUTION_POLICY_MODEL_DECIDES`.
* Global and workspace MCP configurations ensure tool definitions are loaded immediately.
* No manual PowerShell scripts, port flags, or ad-hoc background commands are required.

