# NetPro dual-WAN preparation for RouterOS 6.49.x
# Target hardware: RB1100Dx4
#
# Current export reviewed:
#   ether1 = WAN (Starlink modem) and already uses DHCP client
#   ether2 = currently a bridge member of OUT
#
# IMPORTANT:
# This file only prepares ether2 as WAN2. It does not guess the YemenNet
# modem subnet/gateway or install load-balancing rules before that is verified.
#
# The supplied plan says the YemenNet modem already terminates PPPoE.
# Therefore, if the modem remains in router/NAT mode, the MikroTik should
# receive an Ethernet IP by DHCP on ether2.
#
# If the modem is changed to bridge/PPPoE-passthrough mode, do NOT use the
# DHCP section below; create a PPPoE client on ether2 instead.

:local oldPort [/interface ethernet find where name="ether2"];
:if ([:len $oldPort] > 0) do={
  /interface bridge port remove [find where interface="ether2"];
  /interface ethernet set $oldPort name="YEMENNET-WAN" comment="YemenNet ADSL 2M";
}

:if ([:len [/interface list find where name="WAN"]] = 0) do={
  /interface list add name="WAN" comment="NetPro Internet uplinks";
}

:if ([:len [/interface list member find where list="WAN" interface="WAN"]] = 0) do={
  /interface list member add list="WAN" interface="WAN";
}

:if ([:len [/interface list member find where list="WAN" interface="YEMENNET-WAN"]] = 0) do={
  /interface list member add list="WAN" interface="YEMENNET-WAN";
}

:if ([:len [/ip dhcp-client find where interface="YEMENNET-WAN"]] = 0) do={
  /ip dhcp-client add \
    interface="YEMENNET-WAN" \
    add-default-route=no \
    use-peer-dns=no \
    use-peer-ntp=no \
    disabled=no \
    comment="NetPro WAN2 YemenNet DHCP";
}

# The current export incorrectly places the existing Starlink WAN interface
# inside the LAN interface list. Remove that membership now that a real WAN
# list is being used.
/interface list member
remove [find where list="LAN" and interface="WAN"]

# The export also contains an old DHCP-server alert referring to the former
# ether2 MAC. Disable that stale alert after ether2 becomes WAN2.
/ip dhcp-server alert
disable [find where interface="OUT" and valid-server="F4:1E:57:99:5C:97"]

# Verify after insertion:
# /ip dhcp-client print detail where interface=YEMENNET-WAN
#
# Record the assigned address and gateway before enabling routing.
#
# IMPORTANT:
# The export contains an existing mangle rule using routing-mark=rth13 for
# part of 192.168.101.0/24. Verify its intended route before adding any
# new multi-WAN mangle policy.