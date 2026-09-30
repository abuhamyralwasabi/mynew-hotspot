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
    shared-users=1 \
    add-mac-cookie=no \
    mac-cookie-timeout=0s \
    idle-timeout=10m \
    keepalive-timeout=10m
}

# Then paste routeros/speed2.rsc into:
# IP -> HotSpot -> User Profiles -> NETPRO-SPEED -> Scripts -> On Login