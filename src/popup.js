import { FREE_LIMITS, dailyStats, getState, isPro, sessionMinutes } from "./storage.js";

const elements = {
  title: document.querySelector("#sessionTitle"),
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
  elements.upgrade.classList.toggle("hidden", pro);

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
    elements.title.textContent = "Earn with focus";
    elements.form.classList.remove("hidden");
    elements.stop.classList.add("hidden");
    elements.timeRemaining.textContent = `${String(elements.minutes.value).padStart(2, "0")}:00`;
  }

  const activeMinutes = state.activeSession ? sessionMinutes(state.activeSession) : 0;
  document.documentElement.style.setProperty("--ring-progress", `${Math.min(360, activeMinutes * 6)}deg`);
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
