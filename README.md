# NetPro MikroTik Hotspot Portal

Lightweight RouterOS 6 HotSpot portal with centralized static configuration, speed selection through the HotSpot `domain` field, and speed changes through logout -> re-login -> On Login -> `alogin.html` -> status.

## Project layout

- `hotspot/` — files copied to the MikroTik HotSpot HTML directory.
- `hotspot/config.js` — single static source for editable network content.
- `hotspot/js/` — small page-specific scripts.
- `routeros/speed2.rsc` — On Login script body.
- `admin/config.html` — local configuration editor; no database.
- `docs/` — deployment and QA notes.
- `tests/validate.js` — local/CI static validation.

## Speed flow

1. The login form sends `domain=<speed>`.
2. RouterOS HotSpot exposes the `domain` client value to the session/pages.
3. The User Profile On Login script reads it and creates the Simple Queue.
4. Status displays the current `$(domain)`.
5. Speed change stores a short-lived state in `sessionStorage`, logs out, then redirects to login with the selected speed.
6. Login auto-submits the card and selected `domain`.
7. `alogin.html` detects the pending re-login and returns to status.

## Admin config

The admin tool edits a plain JavaScript file. It has no database and does not make router API calls.

## Testing

Run: `node tests/validate.js`

Then follow `docs/TEST-CHECKLIST.md` and `docs/DEPLOYMENT.md` on a real RouterOS 6 test router before production.

The official MikroTik HotSpot documentation describes `domain` as a client variable and `alogin.html` as the page shown after successful login.
## Speed transport prerequisite

The current `speed2` implementation reads `/ip hotspot active` -> `domain`. MikroTik documents that `active.domain` represents a user domain when username/domain splitting is used and notes that this property is used with RADIUS authentication. Therefore, this speed transport must be verified on the target RouterOS 6 setup (especially when local HotSpot users are used) before production deployment. If the router does not populate `active.domain`, the portal must switch to a different transport rather than silently relying on it.


## Unified portal architecture

- One shared Speed Picker component is used by login and status.
- Last successfully authenticated username/speed are stored in a shared browser-auth state.
- Passwords are never stored.
- Login automatically attempts the last successful username after roaming to another
  VLAN/AP under the same HotSpot DNS origin.
- The same authentication engine powers both automatic roaming and the "last card"
  button.
- Manual logout disables automatic roaming but keeps the saved username for the button.
- Existing printed-card HotSpot user profiles are intentionally left untouched.
- New selectable-speed accounts use the dedicated NETPRO-SPEED profile; package
  quota/validity remains a separate User Manager concern.
    
## Card-only credential model

The portal intentionally exposes one credential field: the card code. NetPro
card accounts use the card code as the username and an empty password. The
password field remains hidden in the HTML form and is submitted as an empty
value. No password is stored in browser storage.

The unified HotSpot Server Profile should use `split-user-domain=yes` so the
speed carried in the HotSpot `domain` field stays separate from the card
username.
