# NetPro On-Logout cleanup for the per-user queue created by speed2.rsc.
# It removes only the queue owned by NetPro for this exact client target.
{
  :do {
    :local ip $address;
    :local target ($ip . "/32");

    :foreach q in=[/queue simple find where target=$target] do={
      :local qName [/queue simple get $q name];
      :local qComment [/queue simple get $q comment];
      :local isNetproName ($qName = ("NETPRO-" . $ip));
      :local isNetproComment ([:len $qComment] >= 11 && [:pick $qComment 0 11] = "NetProSpeed");

      :if ($isNetproName || $isNetproComment) do={
        /queue simple remove $q;
      }
    }
  } on-error={
    :log warning ("NetPro queue cleanup failed for ip=" . $address);
  };
}
