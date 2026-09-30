# NetPro Hotspot speed2 — RouterOS 6.x
# Paste this body into the target HotSpot User Profile -> Scripts -> On Login.
# The portal sends the selected value as domain=<speed>.
# Safety fallback: 2M, matching hotspot/config.js defaultSpeed.
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
    }

    :local target ($ip . "/32");
    :foreach q in=[/queue simple find where name=$ip] do={
      /queue simple remove $q;
    }

    :local limit ($upload . "/" . $download);
    :local queueComment ("NetProSpeed|" . $speed . "|" . $username);
    :local anchor [/queue simple find where name="queue1"];

    :if ([:len $anchor] > 0) do={
      /queue simple add name=$ip target=$target limit-at=$limit max-limit=$limit comment=$queueComment place-before=$anchor;
    } else={
      /queue simple add name=$ip target=$target limit-at=$limit max-limit=$limit comment=$queueComment;
    }
  } on-error={
    :log warning ("NetPro speed2 failed | user=" . $user . " | ip=" . $address);
  };
}