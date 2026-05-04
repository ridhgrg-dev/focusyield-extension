# FocusYield Project Memory

Use this file as the project handoff note for future Codex sessions.

## Product

- App name: FocusYield.
- Repo/folder name: focusyield-extension.
- Purpose: Chrome extension that helps users run focus sessions, block distracting sites during active sessions, and track the estimated dollar value of focused work.
- Category for Chrome Web Store: Productivity. If Chrome shows newer subcategories, use Workflow & Planning.

## Current Status

- GitHub repo: https://github.com/ridhgrg-dev/focusyield-extension
- Public preview release: https://github.com/ridhgrg-dev/focusyield-extension/releases/tag/v0.1.1
- Current extension version in `manifest.json`: 0.1.1.
- Current Chrome Web Store upload zip: `dist/focusyield.zip`.
- Broad host permission was removed in v0.1.1 to avoid delayed review from `<all_urls>`.

## MVP Behavior

- Free plan is the default.
- Free limits:
  - 3 blocked sites.
  - 60-minute maximum focus sessions.
- Pro surface exists, but paid checkout is intentionally not connected yet.
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
  - `tabs`: Used to detect the active tab URL during focus sessions so FocusYield can redirect domains that match the user's local blocked-site list.
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

## Next Steps

- Finish Chrome Web Store submission.
- After Chrome approval, connect Stripe, Lemon Squeezy, or Paddle checkout.
- Replace the disabled checkout button in `src/upgrade.html`.
- Replace local license activation with a small license API after paid validation.
- Consider adding real app screenshots from the installed extension after first store approval.
