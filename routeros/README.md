# NetPro RouterOS 6 speed control

Use `speed2.rsc` as the On Login body for the HotSpot User Profile used by the cards.

Confirm that `/ip hotspot active` shows the selected `domain` value and then verify the generated Simple Queue.

Test the re-login speed-change flow on one real RouterOS 6 router before broad deployment.

The official MikroTik HotSpot documentation documents the `domain` client variable and `alogin.html` as the post-login page.
## Domain prerequisite

`speed2.rsc` intentionally follows the mechanism supplied in `speed-analysis.md`: it reads the selected speed from `/ip hotspot active` `domain`. Current MikroTik documentation describes this field as the user domain when username/domain splitting is used and notes it is used with RADIUS authentication. Confirm on the actual RouterOS 6 router that the login request results in the expected `active.domain` value. If it stays empty, do not treat the speed mechanism as verified.
