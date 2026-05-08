import { BILLING_PLANS, FREE_LIMITS, currentBillingPlan, dailyStats, getState, isPro, normalizeDomain, planLabel, setState } from "./storage.js";

let state = await getState();

const ui = {
  minutes: document.querySelector("#dashMinutes"),
  earned: document.querySelector("#dashEarned"),
  goal: document.querySelector("#dashGoal"),
  planBadge: document.querySelector("#dashboardPlanBadge"),
  upgradeLink: document.querySelector("#dashboardUpgradeLink"),
  accountPanel: document.querySelector("#accountPanel"),
  accountTitle: document.querySelector("#accountStatusTitle"),
  accountCopy: document.querySelector("#accountStatusCopy"),
  accountLimit: document.querySelector("#accountLimitCopy"),
  moneyForm: document.querySelector("#moneyForm"),
  hourlyRate: document.querySelector("#hourlyRate"),
  dailyGoal: document.querySelector("#dailyGoal"),
  siteForm: document.querySelector("#siteForm"),
  newSite: document.querySelector("#newSite"),
  siteList: document.querySelector("#siteList"),
  settingsForm: document.querySelector("#settingsForm"),
  notifications: document.querySelector("#notifications"),
  strictMode: document.querySelector("#strictMode"),
  redirectUrl: document.querySelector("#redirectUrl"),
  sessionHistory: document.querySelector("#sessionHistory"),
  exportCsv: document.querySelector("#exportCsv")
};

render();

chrome.storage.onChanged.addListener(async (_changes, areaName) => {
  if (areaName !== "local") return;
  state = await getState();
  render();
});

ui.moneyForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  state = await setState({
    ...state,
    hourlyRate: ui.hourlyRate.value,
    dailyGoalMinutes: ui.dailyGoal.value
  });
  render();
});

ui.siteForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const domain = normalizeDomain(ui.newSite.value);
  if (!domain) return;

  const pro = isPro(state);
  if (!pro && state.blockedSites.length >= FREE_LIMITS.blockedSites) {
    location.href = "upgrade.html";
    return;
  }

  state = await setState({ ...state, blockedSites: [...state.blockedSites, domain] });
  ui.newSite.value = "";
  render();
});

ui.settingsForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  state = await setState({
    ...state,
    settings: {
      notifications: ui.notifications.checked,
      strictMode: ui.strictMode.checked,
      redirectUrl: ui.redirectUrl.value.trim()
    }
  });
  render();
});

ui.siteList.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-site]");
  if (!button) return;
  state = await setState({
    ...state,
    blockedSites: state.blockedSites.filter((site) => site !== button.dataset.site)
  });
  render();
});

ui.exportCsv.addEventListener("click", () => {
  if (!isPro(state)) {
    location.href = "upgrade.html";
    return;
  }

  const header = "started_at,ended_at,label,minutes,status";
  const rows = state.sessions.map((session) => [
    session.startedAt,
    session.endedAt || "",
    csvValue(session.label),
    session.minutes || 0,
    session.status || ""
  ].join(","));
  const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "focusyield-sessions.csv";
  link.click();
  URL.revokeObjectURL(url);
});

function render() {
  const stats = dailyStats(state);
  ui.minutes.textContent = `${stats.totalMinutes}m`;
  ui.earned.textContent = money(stats.earned);
  ui.goal.textContent = `${stats.progress}%`;
  ui.hourlyRate.value = state.hourlyRate;
  ui.dailyGoal.value = state.dailyGoalMinutes;
  ui.notifications.checked = state.settings.notifications;
  ui.strictMode.checked = state.settings.strictMode;
  ui.redirectUrl.value = state.settings.redirectUrl;

  const billingPlan = currentBillingPlan(state);
  const pro = isPro(state);
  document.body.dataset.plan = billingPlan;
  ui.planBadge.textContent = planLabel(state);
  ui.planBadge.dataset.plan = billingPlan;
  ui.accountPanel.dataset.plan = billingPlan;
  ui.upgradeLink.textContent = billingPlan === BILLING_PLANS.MONTHLY ? "Lifetime deal" : pro ? "Plan details" : "Upgrade";
  ui.accountTitle.textContent = getAccountTitle(billingPlan);
  ui.accountCopy.textContent = getAccountCopy(billingPlan);
  ui.accountLimit.textContent = pro ? "Unlimited sites / 4-hour sessions / CSV export" : "5 blocked sites / 60-minute sessions";

  ui.siteList.innerHTML = "";
  state.blockedSites.forEach((site) => {
    const item = document.createElement("li");
    const label = document.createElement("span");
    const button = document.createElement("button");
    label.textContent = site;
    button.type = "button";
    button.dataset.site = site;
    button.setAttribute("aria-label", `Remove ${site}`);
    button.textContent = "Remove";
    item.append(label, button);
    ui.siteList.append(item);
  });

  ui.sessionHistory.innerHTML = "";
  state.sessions.slice(-10).reverse().forEach((session) => {
    const item = document.createElement("li");
    item.textContent = `${new Date(session.startedAt).toLocaleString()} · ${session.label} · ${session.minutes || 0}m`;
    ui.sessionHistory.append(item);
  });

  if (!state.sessions.length) {
    const item = document.createElement("li");
    item.textContent = "No sessions yet.";
    ui.sessionHistory.append(item);
  }
}

function getAccountTitle(billingPlan) {
  if (billingPlan === BILLING_PLANS.MONTHLY) return "Pro Monthly active";
  if (billingPlan === BILLING_PLANS.LIFETIME) return "Lifetime Pro active";
  if (billingPlan === BILLING_PLANS.EARLY_ACCESS) return "Pro active";
  return "Free plan active";
}

function getAccountCopy(billingPlan) {
  if (billingPlan === BILLING_PLANS.MONTHLY) return "You have Pro features. Lifetime upgrade remains available.";
  if (billingPlan === BILLING_PLANS.LIFETIME) return "You have all Pro features permanently on this browser.";
  if (billingPlan === BILLING_PLANS.EARLY_ACCESS) return "You have Pro features from an early-access license.";
  return "Upgrade to remove limits and export sessions.";
}

function money(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function csvValue(value) {
  return `"${String(value || "").replaceAll('"', '""')}"`;
}
