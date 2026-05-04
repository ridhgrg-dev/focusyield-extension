import { BILLING_PLANS, FREE_LIMITS, currentBillingPlan, dailyStats, getState, isPro, planLabel, sessionMinutes } from "./storage.js";

const elements = {
  title: document.querySelector("#sessionTitle"),
  planBadge: document.querySelector("#popupPlanBadge"),
  todayMinutes: document.querySelector("#todayMinutes"),
  todayEarned: document.querySelector("#todayEarned"),
  todayProgress: document.querySelector("#todayProgress"),
  timeRemaining: document.querySelector("#timeRemaining"),
  form: document.querySelector("#startForm"),
  label: document.querySelector("#sessionLabel"),
  minutes: document.querySelector("#sessionMinutes"),
  stop: document.querySelector("#stopAction"),
  sites: document.querySelector("#blockedSites"),
  upgrade: document.querySelector("#upgradeBanner")
};

let state = await getState();
render();
setInterval(async () => {
  state = await getState();
  render();
}, 1000);

chrome.storage.onChanged.addListener(async (_changes, areaName) => {
  if (areaName !== "local") return;
  state = await getState();
  render();
});

elements.form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const response = await chrome.runtime.sendMessage({
    type: "START_SESSION",
    payload: {
      label: elements.label.value.trim() || "Deep work",
      minutes: elements.minutes.value
    }
  });
  state = response.state;
  render();
});

elements.stop.addEventListener("click", async () => {
  const response = await chrome.runtime.sendMessage({ type: "STOP_SESSION" });
  state = response.state;
  render();
});

function render() {
  const stats = dailyStats(state);
  const pro = isPro(state);
  elements.todayMinutes.textContent = `${stats.totalMinutes}m`;
  elements.todayEarned.textContent = money(stats.earned);
  elements.todayProgress.textContent = `${stats.progress}%`;
  const billingPlan = currentBillingPlan(state);
  document.body.dataset.plan = billingPlan;
  elements.planBadge.textContent = planLabel(state);
  elements.planBadge.dataset.plan = billingPlan;
  elements.upgrade.dataset.plan = billingPlan;
  elements.upgrade.classList.remove("hidden");
  elements.upgrade.textContent = getPlanActionText(billingPlan);
  elements.minutes.max = pro ? "240" : "60";

  elements.sites.innerHTML = "";
  state.blockedSites.slice(0, pro ? 8 : FREE_LIMITS.blockedSites).forEach((site) => {
    const item = document.createElement("li");
    item.textContent = site;
    elements.sites.append(item);
  });

  if (state.activeSession) {
    elements.title.textContent = state.activeSession.label;
    elements.form.classList.add("hidden");
    elements.stop.classList.remove("hidden");
    elements.timeRemaining.textContent = countdown(state.activeSession.endsAt);
  } else {
    elements.title.textContent = getIdleTitle(billingPlan);
    elements.form.classList.remove("hidden");
    elements.stop.classList.add("hidden");
    elements.timeRemaining.textContent = `${String(elements.minutes.value).padStart(2, "0")}:00`;
  }

  const activeMinutes = state.activeSession ? sessionMinutes(state.activeSession) : 0;
  document.documentElement.style.setProperty("--ring-progress", `${Math.min(360, activeMinutes * 6)}deg`);
}

function getIdleTitle(billingPlan) {
  if (billingPlan === BILLING_PLANS.MONTHLY) return "Pro focus mode";
  if (billingPlan === BILLING_PLANS.LIFETIME) return "Lifetime focus mode";
  if (billingPlan === BILLING_PLANS.EARLY_ACCESS) return "Pro focus mode";
  return "Earn with focus";
}

function getPlanActionText(billingPlan) {
  if (billingPlan === BILLING_PLANS.MONTHLY) return "Pro Monthly active. Lifetime deal is available.";
  if (billingPlan === BILLING_PLANS.LIFETIME) return "Lifetime Pro active.";
  if (billingPlan === BILLING_PLANS.EARLY_ACCESS) return "Pro active. Lifetime deal is available.";
  return "Free plan: 3 blocked sites and 60-minute sessions. Unlock Pro.";
}

function countdown(endsAt) {
  const remaining = Math.max(0, new Date(endsAt).getTime() - Date.now());
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function money(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}
