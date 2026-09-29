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
