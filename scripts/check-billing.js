import { readFile } from "node:fs/promises";

const source = await readFile("src/billing.js", "utf8");
const matches = [...source.matchAll(/export const (STRIPE_[A-Z_]+_PAYMENT_LINK) = "([^"]*)";/g)];

if (matches.length !== 2) {
  throw new Error("Expected monthly and lifetime Stripe payment link constants in src/billing.js.");
}

for (const [, name, value] of matches) {
  if (!value) continue;

  const url = new URL(value);
  const isStripePaymentLink = url.protocol === "https:" && url.hostname === "buy.stripe.com";
  if (!isStripePaymentLink) {
    throw new Error(`${name} must be a Stripe Payment Link URL starting with https://buy.stripe.com/`);
  }
}

console.log("Billing configuration checks passed.");
