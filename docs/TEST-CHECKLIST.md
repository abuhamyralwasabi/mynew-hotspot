# NetPro Hotspot QA Checklist

## Responsive / browser
- Android Chrome: 320 / 360 / 375 / 390 / 412 / 430px
- iPhone Safari and Samsung Internet
- Chrome / Edge / Firefox desktop
- Portrait and landscape
- No horizontal overflow
- Input/select remain at least 16px on iOS
- Reduced-motion behavior

## Card-only authentication
- Test card account has the same value in username and password (the portal has no visible password field).
- Verify HTTP-PAP sends the card code as the hidden password.
- Verify HTTP-CHAP hashes the card code with the current CHAP challenge.
- Verify a wrong/nonexistent card shows an Arabic error on the failure login page.
- Verify `already authorizing, retry later` is shown as a transient Arabic message and does not increase the login-block counter.

## RouterOS 6
- HTTP-CHAP login
- HTTP-PAP login
- `split-user-domain=yes` on the unified Server Profile
- Verify `domain=256K ... 10M` reaches the active session
- Verify `speed2` creates one queue per IP
- Verify upload/download limits
- Verify invalid/empty domain falls back safely
- Verify `queue1` ordering
- Verify On-Logout cleanup
- Verify cookie/MAC-cookie behavior

## Re-login speed change
- 2M -> 5M
- 5M -> 1M
- 1M -> 10M
- Selecting current speed does not re-login
- Failed re-login does not create a loop
- Successful re-login lands on status.html
- Pending re-auth state is cleared
- Normal logout does not accidentally re-login

## Usage
- With `limit-bytes-total`, percentage is correct
- Without byte quota, UI does not fabricate a 1-byte limit
- Download uses `bytes-out`, upload uses `bytes-in`
- Status refresh only while visible


## Browser roaming / shared authentication
- Successful login saves only username and selected speed; password is never saved.
- AP01/VLAN101 -> AP02/VLAN102: login page performs one automatic re-login.
- AP02/VLAN102 -> AP01/VLAN101: same behavior.
- Different VLANs use the same HotSpot Server Profile and DNS origin.
- Manual logout disables automatic roaming while retaining the last username.
- "دخول بآخر كرت" authenticates using the same engine as automatic roaming.
- Auto-login failure does not loop or repeatedly submit.
- A manual username/speed interaction cancels a pending automatic attempt.

## Shared speed picker
- Login speed button opens the local dropdown menu without clipping.
- Status speed button opens the local dropdown menu without clipping.
- Selecting a speed updates the hidden domain field.
- No detached speed-picker portal exists.
- No old duplicate renderer remains in app.js.

## Final logout
- From status, "تسجيل الخروج" preserves the current username for manual re-entry but does not auto-login.
- From status, "تسجيل الخروج نهائيًا من الكرت الحالي" sends `erase-cookie=on`.
- Final logout clears the current browser authentication state and current-card history entry.
- After final logout, opening login does not auto-submit the previous card.
- Final logout does not affect saved history entries for other cards.

## Status RouterOS accuracy
- IP, MAC, login method, interface, and VLAN match the active HotSpot session.
- Download uses RouterOS `bytes-out`; upload uses RouterOS `bytes-in`.
- Total quota uses `limit-bytes-total`; remaining quota uses `remain-bytes-total`.
- Session uptime uses `uptime`; session remaining time uses `session-time-left`.
- When RouterOS supplies no byte quota, the UI shows "غير محدد" rather than fabricating a quota.

## Responsive services
- Services remain two cards per row at 280 / 320 / 360 / 390 / 430px widths.
- Service card text wraps without horizontal scrolling or overflow.
- Top navigation labels remain prominent and readable on small screens.
