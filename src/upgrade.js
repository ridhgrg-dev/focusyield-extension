import { FEATURE_FLAGS } from "./feature-flags.js";
import { BILLING_PLANS, currentBillingPlan, getState, isPro, planLabel, setState } from "./storage.js";
import {
  STRIPE_LIFETIME_PAYMENT_LINK,
  STRIPE_MONTHLY_PAYMENT_LINK,
  hasPaymentLink
} from "./billing.js";

const form = document.querySelector("#licenseForm");
const input = document.querySelector("#licenseKey");
const licenseSubmit = document.querySelector("#licenseSubmit");
const status = document.querySelector("#licenseStatus");
const monthlyCheckout = document.querySelector("#monthlyCheckout");
const lifetimeCheckout = document.querySelector("#lifetimeCheckout");
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

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!FEATURE_FLAGS.enableManualLicenseActivation) {
    status.textContent = "License activation is disabled until backend verification is connected.";
    return;
  }

  const key = input.value.trim();
  if (key.length < 8) {
    status.textContent = "Enter a valid activation key.";
    return;
  }

  const billingPlan = inferBillingPlanFromKey(key);
  if (!billingPlan) {
    status.textContent = "Use a monthly or lifetime activation key.";
    return;
  }

  state = await setState({
    ...state,
    plan: "pro",
    billingPlan,
    pendingCheckoutPlan: "",
    proLicense: key
  });
  input.value = "";
  render();
});

function render() {
  const pro = isPro(state);
  const billingPlan = currentBillingPlan(state);
  const monthlyActive = billingPlan === BILLING_PLANS.MONTHLY;
  const lifetimeActive = billingPlan === BILLING_PLANS.LIFETIME;
  const checkoutLinksConfigured = hasPaymentLink(STRIPE_MONTHLY_PAYMENT_LINK) || hasPaymentLink(STRIPE_LIFETIME_PAYMENT_LINK);
  const checkoutEnabled = FEATURE_FLAGS.enableStripeCheckoutLinks;
  const canUseLicenseForm = FEATURE_FLAGS.enableManualLicenseActivation;

  document.body.dataset.plan = billingPlan;
  input.value = "";
  input.disabled = !canUseLicenseForm;
  input.placeholder = canUseLicenseForm ? "Enter monthly or lifetime activation key" : "License verification coming soon";
  licenseSubmit.disabled = !canUseLicenseForm;
  licenseSubmit.textContent = canUseLicenseForm ? "Activate Pro" : "Activation disabled";
  planBadge.textContent = planLabel(state);
  planBadge.dataset.plan = billingPlan;

  cards.free.classList.toggle("current", billingPlan === BILLING_PLANS.FREE);
  cards.monthly.classList.toggle("current", monthlyActive);
  cards.lifetime.classList.toggle("current", lifetimeActive);

  configureCheckout(monthlyCheckout, STRIPE_MONTHLY_PAYMENT_LINK, {
    enabled: checkoutEnabled && !pro,
    enabledLabel: "Upgrade monthly",
    disabledLabel: monthlyActive ? "Current plan" : lifetimeActive ? "Included in Lifetime" : "Monthly purchase paused"
  });

  configureCheckout(lifetimeCheckout, STRIPE_LIFETIME_PAYMENT_LINK, {
    enabled: checkoutEnabled && !lifetimeActive,
    enabledLabel: monthlyActive ? "Upgrade to lifetime" : "Get lifetime deal",
    disabledLabel: lifetimeActive ? "Current plan" : "Lifetime purchase paused"
  });

  status.textContent = getStatusText({
    pro,
    monthlyActive,
    lifetimeActive,
    checkoutLinksConfigured,
    checkoutEnabled,
    canUseLicenseForm
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
  if (!FEATURE_FLAGS.enableStripeCheckoutLinks || !hasPaymentLink(url) || link.getAttribute("aria-disabled") === "true") {
    event.preventDefault();
    status.textContent = link.textContent === "Current plan" ? "That plan is already active." : "Purchases are paused for now. Enter an activation key if you have one.";
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
  return null;
}

function getStatusText({ pro, monthlyActive, lifetimeActive, checkoutLinksConfigured, checkoutEnabled, canUseLicenseForm }) {
  if (pro && monthlyActive) return "Pro Monthly is active. Lifetime activation can be entered by key.";
  if (pro && lifetimeActive) return "Lifetime Pro is active.";
  if (pro) return "Pro is active. Enter a Lifetime key here if you upgrade later.";
  if (canUseLicenseForm && checkoutLinksConfigured && !checkoutEnabled) return "Purchases are paused for now. Enter a monthly or lifetime activation key to unlock Pro.";
  if (canUseLicenseForm) return "Enter a monthly or lifetime activation key to unlock Pro.";
  return "Free plan is active. Paid checkout is coming soon.";
}
