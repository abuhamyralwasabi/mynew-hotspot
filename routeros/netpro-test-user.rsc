# NetPro RouterOS 6 test account
# The portal has one visible field, so the test account uses the card code as username and an empty password.
# Run this only on a TEST router, or replace the username/password values
# with a dedicated disposable test account before production.

:if ([:len [/ip hotspot user find where name="1234567890"]] > 0) do={
  /ip hotspot user remove [find where name="1234567890"];
}

/ip hotspot user add   name="1234567890"   password="1234567890"   profile="NETPRO-SPEED"   comment="NetPro test card - blank password"
