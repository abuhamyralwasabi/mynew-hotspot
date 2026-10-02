# NetPro unified HotSpot Server Profile — RouterOS 6.49.x
# Target architecture:
#   one Server Profile -> all NetPro HotSpot servers/VLAN interfaces
#   one RADIUS/ User Manager source
#   one common portal hostname
#
# Existing hsprof1/hsprof2 and their current users are NOT modified by this file.
# Migrate only after the new profile has been tested.

# Create the unified profile once:
:if ([:len [/ip hotspot profile find where name="NETPRO-HOTSPOT"]] = 0) do={
  /ip hotspot profile add \
    name="NETPRO-HOTSPOT" \
    dns-name="p.net" \
    hotspot-address=192.168.100.101 \
    html-directory="netpro" \
    login-by=http-chap,http-pap \
    use-radius=yes \
    radius-interim-update=5m
}

# IMPORTANT:
# Use the same NETPRO-HOTSPOT profile for every NetPro HotSpot server that
# belongs to the same roaming domain.
#
# The hotspot-address above is only a template based on the supplied export.
# If the final unified HotSpot service is moved to another gateway address,
# replace it with the actual address used by your chosen HotSpot server.
#
# After the profile exists, assign it to the desired HotSpot servers in
# /ip hotspot servers. Do not change existing production servers until tested.
#
# Verify:
# /ip hotspot profile print detail where name="NETPRO-HOTSPOT"
# /ip hotspot server print detail