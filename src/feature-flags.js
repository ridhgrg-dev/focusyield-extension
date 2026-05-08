export const FEATURE_FLAGS = {
  // Public safety: keep Stripe purchase links disabled until we are ready to sell.
  enableStripeCheckoutLinks: false,
  // Dev-only: shows local Monthly/Lifetime Pro activation buttons on the upgrade page.
  enableLocalProActivationButtons: false,
  // Lets users activate Pro with a key while the backend license API is not live.
  enableManualLicenseActivation: true
};
