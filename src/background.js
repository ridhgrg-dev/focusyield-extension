import { getState, setState, isPro, sessionMinutes } from "./storage.js";

chrome.runtime.onInstalled.addListener(async () => {
  await getState();
  await chrome.alarms.create("focusyield-tick", { periodInMinutes: 1 });
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== "focusyield-tick") return;
  const state = await getState();
  if (state.activeSession && Date.now() >= new Date(state.activeSession.endsAt).getTime()) {
    await finishSession("completed");
  }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== "loading" || !tab.url) return;
  const state = await getState();
  if (!state.activeSession) return;

  const blocked = shouldBlock(tab.url, state);
  if (!blocked) return;

  const destination = state.settings.redirectUrl || chrome.runtime.getURL("src/blocked.html");
  const target = new URL(destination);
  target.searchParams.set("site", blocked);
  target.searchParams.set("session", state.activeSession.label || "Focus session");
  await chrome.tabs.update(tabId, { url: target.toString() });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  handleMessage(message).then(sendResponse);
  return true;
});

async function handleMessage(message) {
  if (message.type === "START_SESSION") {
    return startSession(message.payload);
  }

  if (message.type === "STOP_SESSION") {
    return finishSession("stopped");
  }

  if (message.type === "GET_STATE") {
    return { ok: true, state: await getState() };
  }

  return { ok: false, error: "Unknown message" };
}

async function startSession(payload) {
  const state = await getState();
  const minutes = Math.min(Math.max(Number(payload.minutes) || 25, 5), isPro(state) ? 240 : 60);
  const now = new Date();
  const activeSession = {
    id: crypto.randomUUID(),
    label: payload.label || "Deep work",
    startedAt: now.toISOString(),
    endsAt: new Date(now.getTime() + minutes * 60000).toISOString(),
    plannedMinutes: minutes
  };

  await setState({ ...state, activeSession });
  return { ok: true, state: await getState() };
}

async function finishSession(status) {
  const state = await getState();
  if (!state.activeSession) return { ok: true, state };

  const ended = {
    ...state.activeSession,
    endedAt: new Date().toISOString(),
    minutes: sessionMinutes(state.activeSession),
    status
  };

  const nextState = {
    ...state,
    activeSession: null,
    sessions: [...state.sessions, ended]
  };

  await setState(nextState);

  if (state.settings.notifications) {
    await chrome.notifications.create(`focusyield-${ended.id}`, {
      type: "basic",
      iconUrl: chrome.runtime.getURL("assets/icon-128.png"),
      title: status === "completed" ? "Focus session complete" : "Focus session saved",
      message: `${ended.minutes} minutes banked. Nice work.`
    });
  }

  return { ok: true, state: await getState() };
}

function shouldBlock(rawUrl, state) {
  let hostname;
  try {
    hostname = new URL(rawUrl).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }

  if (state.allowList.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`))) {
    return "";
  }

  return state.blockedSites.find((domain) => hostname === domain || hostname.endsWith(`.${domain}`)) || "";
}
