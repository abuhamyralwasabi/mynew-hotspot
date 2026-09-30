# NetPro Starlink + YemenNet ECMP
# RouterOS 6.49.19
#
# Run only AFTER routeros/dual-wan-yemennet.rsc has been applied and
# YEMENNET-WAN shows status=bound with a valid gateway.
#
# This is per-connection load distribution in the MAIN routing table.
# It does not combine both links into one TCP download.
#
# Stage 1: enable equal-cost default routes.
/ip dhcp-client
set [find where interface="WAN"] \
    add-default-route=yes \
    default-route-distance=1 \
    use-peer-dns=no \
    use-peer-ntp=no \
    disabled=no

set [find where interface="YEMENNET-WAN"] \
    add-default-route=yes \
    default-route-distance=1 \
    use-peer-dns=no \
    use-peer-ntp=no \
    disabled=no

# Verify that two active default routes exist:
/ip route print detail where dst-address="0.0.0.0/0"

# Verify the DHCP gateways:
/ip dhcp-client print detail where interface="WAN"
/ip dhcp-client print detail where interface="YEMENNET-WAN"

# IMPORTANT:
# Before enabling ECMP, verify/disable the old rth13 routing-mark rule
# if it has no matching route:
/ip firewall mangle print detail where new-routing-mark="rth13"
#/ip firewall mangle disable [find where new-routing-mark="rth13"]

# Existing HotSpot masquerade rules in the supplied configuration are
# source-subnet based, so this stage does not replace them wholesale.
#
# Stage 2 (optional failover instead of balancing):
# Set YemenNet distance to 2:
#/ip dhcp-client set [find where interface="YEMENNET-WAN"] default-route-distance=2
