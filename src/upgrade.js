import { getState, isPro, setState } from "./storage.js";

const form = document.querySelector("#licenseForm");
const input = document.querySelector("#licenseKey");
const status = document.querySelector("#licenseStatus");
let state = await getState();

render();

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
  status.textContent = isPro(state)
    ? "Pro is active on this browser. Replace the test Stripe URL before selling publicly."
    : "Free plan is active.";
}
