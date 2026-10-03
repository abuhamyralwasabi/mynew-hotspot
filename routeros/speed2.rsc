# NetPro HotSpot dynamic speed — RouterOS 6.49.x
# Use this as the complete On Login script of the dedicated NETPRO-SPEED profile.
#
# Prerequisite:
# - HotSpot server profile must use http-chap,http-pap for selectable-speed users.
# - RADIUS must be enabled (the supplied router export already uses use-radius=yes).
# - The portal sends the selected speed as domain=<speed> only when RADIUS is enabled.
# - Local-only HotSpot testing intentionally leaves domain empty.
#
# The script intentionally creates only ONE Simple Queue per active client.
# It uses max-limit only; it does not reserve limit-at bandwidth.

{
  :do {
    :local username $user;
    :local ip $address;
    :local speed "";
    :local upload "400K";
    :local download "2M";
    :local valid false;

    :for attempt from=1 to=12 do={
      :foreach active in=[/ip hotspot active find where address=$ip and user=$username] do={
        :set speed [/ip hotspot active get $active domain];
        :break;
      }

      :if ($speed != "") do={ :break; }
      :delay 250ms;
    }

    :if ($speed = "256K") do={ :set upload "128K"; :set download "256K"; :set valid true; }
    :if ($speed = "512K") do={ :set upload "200K"; :set download "512K"; :set valid true; }
    :if ($speed = "1M") do={ :set upload "400K"; :set download "1M"; :set valid true; }
    :if ($speed = "2M") do={ :set upload "400K"; :set download "2M"; :set valid true; }
    :if ($speed = "3M") do={ :set upload "400K"; :set download "3M"; :set valid true; }
    :if ($speed = "4M") do={ :set upload "400K"; :set download "4M"; :set valid true; }
    :if ($speed = "5M") do={ :set upload "400K"; :set download "5M"; :set valid true; }
    :if ($speed = "7M") do={ :set upload "1M"; :set download "7M"; :set valid true; }
    :if ($speed = "10M") do={ :set upload "1M"; :set download "10M"; :set valid true; }

    :if (!$valid) do={
      :set speed "2M";
      :set upload "400K";
      :set download "2M";
      :log warning ("NetPro speed: domain unavailable or invalid; fallback to 2M | user=" . $username);
    }

    :local target ($ip . "/32");

    :foreach q in=[/queue simple find where target=$target] do={
      :local qName [/queue simple get $q name];
      :local qComment [/queue simple get $q comment];
      :local isNetpro ([:len $qComment] >= 10 && [:pick $qComment 0 10] = "NetProSpeed");
      :if ($isNetpro || $qName = $ip || $qName = ("NETPRO-" . $ip)) do={
        /queue simple remove $q;
      }
    }

    :local limit ($upload . "/" . $download);
    :local queueComment ("NetProSpeed|" . $speed . "|" . $username);

    /queue simple add \
      name=("NETPRO-" . $ip) \
      target=$target \
      max-limit=$limit \
      comment=$queueComment;
  } on-error={
    :log warning ("NetPro speed2 failed | user=" . $user . " | ip=" . $address);
  };
}