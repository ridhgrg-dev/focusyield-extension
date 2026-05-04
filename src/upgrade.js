import { BILLING_PLANS, currentBillingPlan, getState, isPro, planLabel, setState } from "./storage.js";
import {
  STRIPE_LIFETIME_PAYMENT_LINK,
  STRIPE_MONTHLY_PAYMENT_LINK,
  STRIPE_TEST_LICENSE_KEY,
  hasPaymentLink,
  isStripeSandbox
} from "./billing.js";

const form = document.querySelector("#licenseForm");
const input = document.querySelector("#licenseKey");
const licenseSubmit = document.querySelector("#licenseSubmit");
const status = document.querySelector("#licenseStatus");
const monthlyCheckout = document.querySelector("#monthlyCheckout");
const lifetimeCheckout = document.querySelector("#lifetimeCheckout");
const sandboxPanel = document.querySelector("#sandboxPanel");
const sandboxActivate = document.querySelector("#sandboxActivate");
const activateMonthlyTest = document.querySelector("#activateMonthlyTest");
const activateLifetimeTest = document.querySelector("#activateLifetimeTest");
const planBadge = document.querySelector("#upgradePlanBadge");
const cards = {
  free: document.querySelector("#freePlanCard"),
  monthly: document.querySelector("#monthlyPlanCard"),
  lifetime: document.querySelector("#lifetimePlanCard")
};

let state = await getState();

render();

chrome.storage.onChanged.addListener(async (_changes, areaName) => {
  if (areaName !== "local") return;
  state = await getState();
  render();
});

monthlyCheckout.addEventListener("click", (event) => {
  handleCheckout(event, BILLING_PLANS.MONTHLY, STRIPE_MONTHLY_PAYMENT_LINK);
});

lifetimeCheckout.addEventListener("click", (event) => {
  handleCheckout(event, BILLING_PLANS.LIFETIME, STRIPE_LIFETIME_PAYMENT_LINK);
});

sandboxActivate.addEventListener("click", () => {
  activateTestPlan(state.pendingCheckoutPlan || BILLING_PLANS.MONTHLY);
});

activateMonthlyTest.addEventListener("click", () => {
  activateTestPlan(BILLING_PLANS.MONTHLY);
});

activateLifetimeTest.addEventListener("click", () => {
  activateTestPlan(BILLING_PLANS.LIFETIME);
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const key = input.value.trim();
  if (key.length < 8) {
    status.textContent = "Enter a valid license key.";
    return;
  }

  const billingPlan = key === STRIPE_TEST_LICENSE_KEY
    ? BILLING_PLANS.MONTHLY
    : state.pendingCheckoutPlan || BILLING_PLANS.EARLY_ACCESS;
  state = await setState({ ...state, plan: "pro", billingPlan, pendingCheckoutPlan: "", proLicense: key });
  render();
});

async function activateTestPlan(billingPlan) {
  state = await setState({
    ...state,
    plan: "pro",
    billingPlan,
    pendingCheckoutPlan: "",
    proLicense: `${STRIPE_TEST_LICENSE_KEY}-${billingPlan.toUpperCase()}`
  });
  render();
}

function render() {
  const pro = isPro(state);
  const billingPlan = currentBillingPlan(state);
  const monthlyActive = billingPlan === BILLING_PLANS.MONTHLY;
  const lifetimeActive = billingPlan === BILLING_PLANS.LIFETIME;
  const hasCheckout = hasPaymentLink(STRIPE_MONTHLY_PAYMENT_LINK) || hasPaymentLink(STRIPE_LIFETIME_PAYMENT_LINK);

  document.body.dataset.plan = billingPlan;
  input.value = state.proLicense || "";
  input.disabled = pro;
  licenseSubmit.disabled = pro;
  planBadge.textContent = planLabel(state);
  planBadge.dataset.plan = billingPlan;

  cards.free.classList.toggle("current", billingPlan === BILLING_PLANS.FREE);
  cards.monthly.classList.toggle("current", monthlyActive);
  cards.lifetime.classList.toggle("current", lifetimeActive);

  configureCheckout(monthlyCheckout, STRIPE_MONTHLY_PAYMENT_LINK, {
    enabled: !pro,
    enabledLabel: "Upgrade monthly",
    disabledLabel: monthlyActive ? "Current plan" : lifetimeActive ? "Included in Lifetime" : "Unavailable"
  });

  configureCheckout(lifetimeCheckout, STRIPE_LIFETIME_PAYMENT_LINK, {
    enabled: !lifetimeActive,
    enabledLabel: monthlyActive ? "Upgrade to lifetime" : "Get lifetime deal",
    disabledLabel: "Current plan"
  });

  sandboxPanel.classList.toggle("hidden", !isStripeSandbox());
  sandboxActivate.textContent = state.pendingCheckoutPlan === BILLING_PLANS.LIFETIME
    ? "I completed checkout - unlock Lifetime Pro"
    : "I completed checkout - unlock Pro Monthly";

  status.textContent = pro
    ? monthlyActive
      ? "Pro Monthly is active. Monthly checkout is disabled and Lifetime upgrade is available."
      : lifetimeActive
        ? "Lifetime Pro is active. Both paid checkout buttons are disabled."
        : "Pro is active. Lifetime upgrade is available."
    : hasCheckout
      ? "Free plan is active. Use Stripe checkout or the test buttons above."
      : "Free plan is active. Paid checkout is coming soon.";
}

function configureCheckout(element, url, options) {
  const enabled = options.enabled && hasPaymentLink(url);
  element.textContent = enabled ? options.enabledLabel : options.disabledLabel;
  element.classList.toggle("disabled", !enabled);
  element.setAttribute("aria-disabled", String(!enabled));

  if (enabled) {
    element.href = url;
    element.target = "_blank";
    element.rel = "noreferrer";
    return;
  }

  element.removeAttribute("href");
  element.removeAttribute("target");
  element.removeAttribute("rel");
}

function handleCheckout(event, billingPlan, url) {
  const link = event.currentTarget;
  if (!hasPaymentLink(url) || link.getAttribute("aria-disabled") === "true") {
    event.preventDefault();
    status.textContent = link.textContent === "Current plan" ? "That plan is already active." : "Paid checkout is not available for this plan.";
    return;
  }

  state = { ...state, pendingCheckoutPlan: billingPlan };
  setState(state);
  render();
}
