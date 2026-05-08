export const FEATURE_FLAGS = {
  // Public safety: keep Stripe purchase links disabled until we are ready to sell.
  enableStripeCheckoutLinks: false,
  // Lets users activate Pro with a monthly or lifetime key while the backend license API is not live.
  enableManualLicenseActivation: true
};
