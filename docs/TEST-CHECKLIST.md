# NetPro Hotspot QA Checklist

## Responsive / browser
- Android Chrome: 320 / 360 / 375 / 390 / 412 / 430px
- iPhone Safari and Samsung Internet
- Chrome / Edge / Firefox desktop
- Portrait and landscape
- No horizontal overflow
- Input/select remain at least 16px on iOS
- Reduced-motion behavior

## RouterOS 6
- HTTP-CHAP login
- HTTP-PAP login
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
- Login speed button opens the fixed portal menu above content.
- Status speed button opens the same shared menu.
- Selecting a speed updates the hidden domain field.
- Only one speed-picker portal exists in the document.
- No old duplicate renderer remains in app.js.
