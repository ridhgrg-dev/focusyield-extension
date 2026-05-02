export const FREE_LIMITS = {
  blockedSites: 3,
  dailyGoalMinutes: 120,
  schedules: 1,
  historyDays: 7
};

export const DEFAULT_STATE = {
  onboardingComplete: false,
  plan: "free",
  proLicense: "",
  hourlyRate: 50,
  dailyGoalMinutes: 90,
  blockedSites: ["twitter.com", "x.com", "youtube.com"],
  allowList: ["music.youtube.com"],
  activeSession: null,
  sessions: [],
  settings: {
    notifications: true,
    strictMode: false,
    redirectUrl: ""
  },
  schedules: [
    {
      id: "weekday-deep-work",
      name: "Weekday deep work",
      enabled: false,
      days: [1, 2, 3, 4, 5],
      start: "09:00",
      end: "11:00"
    }
  ]
};

const STORAGE_KEY = "focusYield";
const LEGACY_STORAGE_KEY = "focusLedger";

export function isPro(state) {
  return state.plan === "pro" && state.proLicense.trim().length >= 8;
}

export async function getState() {
  const stored = await chrome.storage.local.get([STORAGE_KEY, LEGACY_STORAGE_KEY]);
  return normalizeState({ ...DEFAULT_STATE, ...(stored[LEGACY_STORAGE_KEY] || {}), ...(stored[STORAGE_KEY] || {}) });
}

export async function setState(nextState) {
  const normalized = normalizeState(nextState);
  await chrome.storage.local.set({ [STORAGE_KEY]: normalized });
  return normalized;
}

export async function updateState(updater) {
  const state = await getState();
  const updated = typeof updater === "function" ? updater(state) : updater;
  return setState({ ...state, ...updated });
}

export function normalizeDomain(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0];
}

export function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function sessionMinutes(session) {
  const start = new Date(session.startedAt).getTime();
  const end = session.endedAt ? new Date(session.endedAt).getTime() : Date.now();
  return Math.max(0, Math.round((end - start) / 60000));
}

export function dailyStats(state, dateKey = todayKey()) {
  const sessions = state.sessions.filter((session) => session.startedAt.slice(0, 10) === dateKey);
  const completedMinutes = sessions.reduce((sum, session) => sum + sessionMinutes(session), 0);
  const activeMinutes = state.activeSession ? sessionMinutes(state.activeSession) : 0;
  const totalMinutes = completedMinutes + activeMinutes;
  const earned = (totalMinutes / 60) * Number(state.hourlyRate || 0);

  return {
    completedMinutes,
    activeMinutes,
    totalMinutes,
    earned,
    progress: Math.min(100, Math.round((totalMinutes / Math.max(1, state.dailyGoalMinutes)) * 100))
  };
}

function normalizeState(state) {
  const blockedSites = Array.from(new Set((state.blockedSites || []).map(normalizeDomain).filter(Boolean)));
  const allowList = Array.from(new Set((state.allowList || []).map(normalizeDomain).filter(Boolean)));

  return {
    ...DEFAULT_STATE,
    ...state,
    hourlyRate: clampNumber(state.hourlyRate, 0, 10000, DEFAULT_STATE.hourlyRate),
    dailyGoalMinutes: clampNumber(state.dailyGoalMinutes, 15, 1440, DEFAULT_STATE.dailyGoalMinutes),
    blockedSites,
    allowList,
    sessions: Array.isArray(state.sessions) ? state.sessions.slice(-500) : [],
    schedules: Array.isArray(state.schedules) ? state.schedules : DEFAULT_STATE.schedules,
    settings: {
      ...DEFAULT_STATE.settings,
      ...(state.settings || {})
    }
  };
}

function clampNumber(value, min, max, fallback) {
  const next = Number(value);
  if (!Number.isFinite(next)) return fallback;
  return Math.min(max, Math.max(min, next));
}
