# NetPro HotSpot Server Profile compatibility
# RouterOS 6.49.19
#
# IMPORTANT:
# Run these commands ONLY for HotSpot servers that are intended to use
# the selectable-speed portal and the NETPRO-SPEED user profile.
#
# The supplied configuration currently has hsprof1 and hsprof2 with:
# cookie,http-chap,http-pap,mac-cookie
#
# Cookie/mac-cookie can allow a client to authenticate without returning
# through the speed-selection page. For deterministic portal-selected speed,
# use only HTTP CHAP/PAP on the dedicated server profile.
#
# Option A (ONLY if hsprof1 and hsprof2 are exclusively for this portal):
#/ip hotspot profile
#set [find name="hsprof1"] login-by=http-chap,http-pap
#set [find name="hsprof2"] login-by=http-chap,http-pap
#
# Option B (recommended when existing users/services depend on cookies):
# Clone the server profile(s), set login-by=http-chap,http-pap on the clones,
# keep html-directory=netpro, then assign only the selectable-speed HotSpot
# servers to the clones.
#
# Verify:
#/ip hotspot profile print detail where name="hsprof1"
/ip hotspot profile print detail where name="hsprof2"