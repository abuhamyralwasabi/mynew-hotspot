# NetPro dedicated HotSpot User Profile for portal-selected speeds
# RouterOS 6.49.x
#
# IMPORTANT:
# The profile must not have a fixed rate-limit, because speed2.rsc
# creates the per-user Simple Queue dynamically.

:if ([:len [/ip hotspot user profile find where name="NETPRO-SPEED"]] = 0) do={
  /ip hotspot user profile add \
    name="NETPRO-SPEED" \
    rate-limit="" \
    shared-users=2 \
    add-mac-cookie=no \
    mac-cookie-timeout=0s \
    idle-timeout=10m \
    keepalive-timeout=10m
}

# Then paste:
#   routeros/speed2.rsc
# into:
#   IP -> HotSpot -> User Profiles -> NETPRO-SPEED -> Scripts -> On Login
#
# Paste routeros/speed2-cleanup-on-logout.rsc into the same profile's
# On Logout field. The cleanup removes only the NETPRO queue for the
# logging-out client.
#
# Dual-auth behavior:
# - RADIUS/User Manager: selected speed is read from active.domain.
# - Local HotSpot user: domain is empty; speed2 uses the safe 2M fallback
#   only when that local user is assigned to NETPRO-SPEED.
#
# Package architecture
# Keep existing HotSpot user profiles untouched.
# For new User Manager packages, keep traffic quota and validity in the
# User Manager profile/limitation and avoid a fixed rate-limit here.
# All new NetPro selectable-speed accounts should use this dynamic-speed
# profile so the portal-selected speed remains authoritative.
