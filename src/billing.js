export const STRIPE_MONTHLY_PAYMENT_LINK = "";
export const STRIPE_LIFETIME_PAYMENT_LINK = "";

export function hasPaymentLink(url) {
  return url.startsWith("https://");
}
