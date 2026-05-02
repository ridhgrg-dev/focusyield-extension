# FocusYield

FocusYield is a production-minded Chrome Extension MVP that helps users turn focus time into a money metric. It includes a free tier, Pro upgrade surface, local session history, focus blocking, and packaging scripts.

## MVP Features

- Manifest V3 Chrome Extension.
- Popup timer with focus sessions.
- Distracting-site blocker while a session is active.
- Daily goal and estimated earnings dashboard.
- Free tier limits: 3 blocked sites and 60-minute sessions.
- Pro tier surface: unlimited sites, longer sessions, CSV export, advanced schedules.
- Local license activation placeholder for MVP validation.
- Store listing draft and privacy policy starter.

## Install Preview Build

1. Download `focusyield.zip` from the latest GitHub Release.
2. Unzip it on your computer.
3. Open `chrome://extensions`.
4. Enable Developer mode.
5. Choose **Load unpacked**.
6. Select the unzipped `focusyield` folder.

## Run Locally

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Choose **Load unpacked**.
4. Select this project folder.

## Package

```bash
npm run package
```

The extension zip will be created in `dist/focusyield.zip`.

## Monetization Path

This MVP is prepared for paid validation without needing a backend on day one:

1. Replace the checkout-coming-soon button in `src/upgrade.html` with a Stripe Payment Link, Lemon Squeezy checkout, or Paddle checkout.
2. Send a license key in the payment receipt.
3. After validation, replace local license activation with a small license API.
4. Add Chrome Web Store screenshots and submit for review.

## Chrome Web Store Checklist

- Connect the paid checkout URL.
- Replace the generated MVP icons with final branded PNG icons if you want a more polished store presence.
- Update `store-listing/privacy-policy.md` with your business/contact details.
- Create screenshots at 1280x800 or 640x400.
- Zip the extension with `npm run package`.
- Upload the zip in the Chrome Developer Dashboard.

## Privacy

FocusYield stores focus settings and history locally in Chrome storage. The MVP does not transmit browsing history, blocked sites, or session data to a server.
