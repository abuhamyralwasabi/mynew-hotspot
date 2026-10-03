# NetPro RouterOS 6 local-test account
# Use only on a TEST router without RADIUS.
# The card code is the username and the password is intentionally empty.
# This validates local HotSpot authentication and Arabic error handling.
# It does not validate RADIUS/domain-based dynamic speed transport.

:if ([:len [/ip hotspot user find where name="20262026"]] > 0) do={
  /ip hotspot user remove [find where name="20262026"];
}

/ip hotspot user add name="20262026" password="" profile="NETPRO-SPEED" comment="NetPro local test - blank password"
