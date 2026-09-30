# NetPro RouterOS 6 speed control

Use `speed2.rsc` as the On Login body for the HotSpot User Profile used by the cards.

Confirm that `/ip hotspot active` shows the selected `domain` value and then verify the generated Simple Queue.

Test the re-login speed-change flow on one real RouterOS 6 router before broad deployment.

The official MikroTik HotSpot documentation documents the `domain` client variable and `alogin.html` as the post-login page.