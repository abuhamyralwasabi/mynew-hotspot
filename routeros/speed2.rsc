# NetPro Hotspot speed2 - RouterOS 6
# Assign to /ip hotspot user profile -> Scripts -> On Login.
# The portal submits the selected speed as domain=<speed>.
{
  :do {
    :local username $user;
    :local ip $address;
    :local speed "";
    :for i from=1 to=10 do={
      :foreach active in=[/ip hotspot active find where address=$ip and user=$username] do={ :set speed [/ip hotspot active get $active domain]; :break; }
      :if ($speed != "") do={ :break; }
      :delay 200ms;
    }
    :local upload "400K";
    :local download "3M";
    :local valid false;
    :if ($speed = "256K") do={ :set upload "128K"; :set download "256K"; :set valid true; }
    :if ($speed = "512K") do={ :set upload "200K"; :set download "512K"; :set valid true; }
    :if ($speed = "1M") do={ :set upload "400K"; :set download "1M"; :set valid true; }
    :if ($speed = "2M") do={ :set upload "400K"; :set download "2M"; :set valid true; }
    :if ($speed = "3M") do={ :set upload "400K"; :set download "3M"; :set valid true; }
    :if ($speed = "4M") do={ :set upload "400K"; :set download "4M"; :set valid true; }
    :if ($speed = "5M") do={ :set upload "400K"; :set download "5M"; :set valid true; }
    :if ($speed = "7M") do={ :set upload "1M"; :set download "7M"; :set valid true; }
    :if ($speed = "10M") do={ :set upload "1M"; :set download "10M"; :set valid true; }
    :if (!$valid) do={ :set speed "3M"; }
    :local target ($ip . "/32");
    :foreach q in=[/queue simple find where name=$ip and target=$target] do={ /queue simple remove $q; }
    :local limit ($upload . "/" . $download);
    :local before [/queue simple find where name="queue1"];
    :if ([:len $before] > 0) do={ /queue simple add name=$ip target=$target limit-at=$limit max-limit=$limit place-before="queue1" comment=($speed . " | " . $username); } else={ /queue simple add name=$ip target=$target limit-at=$limit max-limit=$limit comment=($speed . " | " . $username); }
  } on-error={ :log warning ("NetPro speed2 failed for user=" . $user . " ip=" . $address); };
}