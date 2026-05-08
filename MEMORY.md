# Focus Yield Project Memory

Use this file as the project handoff note for future Codex sessions.

## Product

- App name: Focus Yield.
- Repo/folder name: focusyield-extension.
- Purpose: Chrome extension that helps users run focus sessions, block distracting sites during active sessions, and track the estimated dollar value of focused work.
- Category for Chrome Web Store: Productivity. If Chrome shows newer subcategories, use Workflow & Planning.

## Current Status

- GitHub repo: https://github.com/ridhgrg-dev/focusyield-extension
- Public preview release: https://github.com/ridhgrg-dev/focusyield-extension/releases/tag/v0.1.3
- Current extension version in `manifest.json`: 0.1.7.
- Current Chrome Web Store upload zip: `dist/focusyield.zip`.
- Broad host permission was removed in v0.1.1 to avoid delayed review from `<all_urls>`.
- Extension icons were regenerated in v0.1.2 so the tab/favicon icon is centered and no longer appears as a tiny mark in a white square.
- Extension icons were regenerated again in v0.1.3 with transparent corners to remove white corners in Chrome tabs.

## MVP Behavior

- Free plan is the default.
- Free limits:
  - 5 blocked sites.
  - 60-minute maximum focus sessions.
- Pro surface is wired for Stripe Payment Links through `src/billing.js`.
- Pricing: Pro Monthly is $3/month; Lifetime launch deal is $29 one-time.
- Stripe purchase links are blocked by default with `enableStripeCheckoutLinks: false` in `src/feature-flags.js`. Turn that on only when ready to sell.
- Manual key activation is enabled by default and should not pre-fill or reveal saved keys in the input field.
- Pro activation currently uses a local early-access license key.
- Pro unlocks:
  - Longer sessions up to 240 minutes.
  - CSV export.
  - Unlimited blocked-site add flow.

## Chrome Web Store Notes

- Remote code: No. All JS, HTML, and CSS are packaged inside the extension.
- Data collection: none for the MVP, because data is stored locally and not sent to a server.
- Required privacy certifications: check all three boxes.
- Permission justifications:
  - `alarms`: Used to check when an active focus session should end and to save the completed session on schedule.
  - `notifications`: Used to show a local notification when a focus session is completed or saved.
  - `storage`: Used to store local settings, blocked-site list, focus sessions, hourly rate, daily goal, and license state in Chrome storage.
  - `tabs`: Used to detect the active tab URL during focus sessions so Focus Yield can redirect domains that match the user's local blocked-site list.
- Host permission justification should no longer be needed after uploading v0.1.1.
- Privacy policy URL: https://github.com/ridhgrg-dev/focusyield-extension/blob/main/store-listing/privacy-policy.md

## Store Assets

- Store assets are in `store-assets/`.
- Required screenshot: `store-assets/screenshot-focusyield-dashboard-1280x800.png`.
- Required small promo tile: `store-assets/small-promo-tile-440x280.png`.
- Optional marquee tile: `store-assets/marquee-promo-tile-1400x560.png`.
- The PNGs were visually accepted by the user for current Chrome Web Store upload.

## Development Commands

```bash
npm run check
npm run package
git status -sb
```

## Stripe Checkpoint

- Local rollback tag: `checkpoint-v0.1.3-before-stripe`.
- Local rollback branch: `rollback-v0.1.3-before-stripe`.
- Stripe work should happen on `stripe-payment-integration` until tested.
- Do not deploy/release a new Web Store package until billing links are tested.
- Stripe sandbox checkout does not auto-activate Pro yet; paid activation needs a webhook/license API.
- Billing state now tracks `billingPlan` (`free`, `monthly`, `lifetime`, or `early_access`) so the UI can show account status and keep lifetime upgrade available for monthly Pro users.
- Purchase links are gated by `src/feature-flags.js`; `enableStripeCheckoutLinks` is disabled by default, while `enableManualLicenseActivation` is enabled by default.
- Activation keys must include a hidden plan marker to choose the correct Pro plan.
- Popup, dashboard, and upgrade page set `body[data-plan]` and show visible account status/badge changes for Pro plans.

## Next Steps

- Finish Chrome Web Store submission.
- Create Stripe Payment Links for monthly and lifetime plans and paste them into `src/billing.js`.
- Replace local license activation with a small license API after paid validation.
- Consider adding real app screenshots from the installed extension after first store approval.
