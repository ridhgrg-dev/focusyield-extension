export const STRIPE_MONTHLY_PAYMENT_LINK = "https://buy.stripe.com/test_fZu6oJ8fB7fWczHeYx1Nu00";
export const STRIPE_LIFETIME_PAYMENT_LINK = "https://buy.stripe.com/test_00wfZj7bx43KeHP17H1Nu01";
export function hasPaymentLink(url) {
  return url.startsWith("https://");
}

export function isStripeSandbox() {
  return [STRIPE_MONTHLY_PAYMENT_LINK, STRIPE_LIFETIME_PAYMENT_LINK].some((url) => url.includes("buy.stripe.com/test_"));
}
