# Stripe Setup

FocusYield uses Stripe Payment Links for the first paid MVP. This keeps the Chrome extension simple: no remote code, no payment card storage in the extension, and no backend required on day one.

## Products

Create two Stripe products:

- `FocusYield Pro Monthly`
  - Price: `$3/month`
  - Type: recurring subscription
- `FocusYield Lifetime`
  - Price: `$29 one-time`
  - Type: one-time payment

## Payment Links

Create one Payment Link for each product. Then paste the live links into `src/billing.js`:

```js
export const STRIPE_MONTHLY_PAYMENT_LINK = "https://buy.stripe.com/...";
export const STRIPE_LIFETIME_PAYMENT_LINK = "https://buy.stripe.com/...";
```

Leave the values blank while checkout is not ready. The extension will keep showing the pricing cards with disabled checkout buttons.

## MVP License Flow

Until a license backend exists, send each paid user a license key manually after purchase. Any key with 8 or more characters activates Pro locally in the current MVP.

Example early key:

```text
FOCUS-PRO-2026
```

## Test Checklist

1. Paste Stripe test-mode Payment Links into `src/billing.js`.
2. Run `npm run check`.
3. Run `npm run package`.
4. Load the unpacked extension in Chrome.
5. Open the upgrade page.
6. Confirm the monthly button says `Upgrade monthly`.
7. Confirm the lifetime button says `Get lifetime deal`.
8. Click each button and confirm it opens the correct Stripe checkout page.
9. Return to the extension and activate Pro with a test license key.

Do not upload a new Chrome Web Store package until this checklist passes.
