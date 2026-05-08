import { FEATURE_FLAGS } from "./feature-flags.js";
import { BILLING_PLANS, currentBillingPlan, getState, isPro, planLabel, setState } from "./storage.js";
import {
  STRIPE_LIFETIME_PAYMENT_LINK,
  STRIPE_MONTHLY_PAYMENT_LINK,
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

  if (!FEATURE_FLAGS.enableManualLicenseActivation) {
    status.textContent = "License activation is disabled until backend verification is connected.";
    return;
  }

  const key = input.value.trim();
  if (key.length < 8) {
    status.textContent = "Enter a valid license key.";
    return;
  }

  state = await setState({
    ...state,
    plan: "pro",
    billingPlan: state.pendingCheckoutPlan || inferBillingPlanFromKey(key),
    pendingCheckoutPlan: "",
    proLicense: key
  });
  render();
});

async function activateTestPlan(billingPlan) {
  if (!FEATURE_FLAGS.enableLocalProActivationButtons) {
    status.textContent = "Local Pro test activation is disabled by feature flag.";
    return;
  }

  state = await setState({
    ...state,
    plan: "pro",
    billingPlan,
    pendingCheckoutPlan: "",
    proLicense: createLocalActivationKey(billingPlan)
  });
  render();
}

function render() {
  const pro = isPro(state);
  const billingPlan = currentBillingPlan(state);
  const monthlyActive = billingPlan === BILLING_PLANS.MONTHLY;
  const lifetimeActive = billingPlan === BILLING_PLANS.LIFETIME;
  const hasCheckout = hasPaymentLink(STRIPE_MONTHLY_PAYMENT_LINK) || hasPaymentLink(STRIPE_LIFETIME_PAYMENT_LINK);
  const showLocalTestControls = FEATURE_FLAGS.enableLocalProActivationButtons && isStripeSandbox();
  const canUseLicenseForm = FEATURE_FLAGS.enableManualLicenseActivation && !pro;

  document.body.dataset.plan = billingPlan;
  input.value = state.proLicense || "";
  input.disabled = !canUseLicenseForm;
  input.placeholder = FEATURE_FLAGS.enableManualLicenseActivation
    ? "Paste a private license key"
    : "License verification coming soon";
  licenseSubmit.disabled = !canUseLicenseForm;
  licenseSubmit.textContent = FEATURE_FLAGS.enableManualLicenseActivation ? "Activate Pro" : "Activation disabled";
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

  sandboxPanel.classList.toggle("hidden", !showLocalTestControls);
  sandboxActivate.textContent = state.pendingCheckoutPlan === BILLING_PLANS.LIFETIME
    ? "I completed checkout - unlock Lifetime Pro"
    : "I completed checkout - unlock Pro Monthly";

  status.textContent = getStatusText({
    pro,
    monthlyActive,
    lifetimeActive,
    hasCheckout,
    showLocalTestControls
  });
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

function inferBillingPlanFromKey(key) {
  const normalized = key.toLowerCase();
  if (normalized.includes("lifetime")) return BILLING_PLANS.LIFETIME;
  if (normalized.includes("monthly")) return BILLING_PLANS.MONTHLY;
  return BILLING_PLANS.EARLY_ACCESS;
}

function createLocalActivationKey(billingPlan) {
  const suffix = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `local-test-${billingPlan}-${suffix}`;
}

function getStatusText({ pro, monthlyActive, lifetimeActive, hasCheckout, showLocalTestControls }) {
  if (pro && monthlyActive) return "Pro Monthly is active. Monthly checkout is disabled and Lifetime upgrade is available.";
  if (pro && lifetimeActive) return "Lifetime Pro is active. Both paid checkout buttons are disabled.";
  if (pro) return "Pro is active. Lifetime upgrade is available.";
  if (hasCheckout && showLocalTestControls) return "Free plan is active. Use Stripe checkout or the local test controls above.";
  if (hasCheckout) return "Free plan is active. Stripe checkout is connected; Pro unlock waits for backend license verification.";
  return "Free plan is active. Paid checkout is coming soon.";
}
