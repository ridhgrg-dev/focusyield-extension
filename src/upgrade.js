import { getState, isPro, setState } from "./storage.js";
import { STRIPE_LIFETIME_PAYMENT_LINK, STRIPE_MONTHLY_PAYMENT_LINK, hasPaymentLink } from "./billing.js";

const form = document.querySelector("#licenseForm");
const input = document.querySelector("#licenseKey");
const status = document.querySelector("#licenseStatus");
const monthlyCheckout = document.querySelector("#monthlyCheckout");
const lifetimeCheckout = document.querySelector("#lifetimeCheckout");
let state = await getState();

setupCheckout(monthlyCheckout, STRIPE_MONTHLY_PAYMENT_LINK, "Upgrade monthly");
setupCheckout(lifetimeCheckout, STRIPE_LIFETIME_PAYMENT_LINK, "Get lifetime deal");
render();

monthlyCheckout.addEventListener("click", handleMissingCheckout);
lifetimeCheckout.addEventListener("click", handleMissingCheckout);

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const key = input.value.trim();
  if (key.length < 8) {
    status.textContent = "Enter a valid license key.";
    return;
  }

  state = await setState({ ...state, plan: "pro", proLicense: key });
  render();
});

function render() {
  input.value = state.proLicense || "";
  const hasCheckout = hasPaymentLink(STRIPE_MONTHLY_PAYMENT_LINK) || hasPaymentLink(STRIPE_LIFETIME_PAYMENT_LINK);
  status.textContent = isPro(state)
    ? "Pro is active on this browser."
    : hasCheckout
      ? "Free plan is active. Upgrade with Stripe, then paste your license key from the receipt."
      : "Free plan is active. Paid checkout is coming soon.";
}

function setupCheckout(element, url, label) {
  if (!hasPaymentLink(url)) return;
  element.href = url;
  element.target = "_blank";
  element.rel = "noreferrer";
  element.textContent = label;
  element.classList.remove("disabled");
  element.removeAttribute("aria-disabled");
}

function handleMissingCheckout(event) {
  const link = event.currentTarget;
  if (link.href) return;
  event.preventDefault();
  status.textContent = "Paid checkout is coming soon.";
}
