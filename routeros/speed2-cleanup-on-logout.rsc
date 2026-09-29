# Optional On-Logout cleanup for NetPro per-user queues.
{
  :do {
    :local ip $address;
    :local target ($ip . "/32");
    :foreach q in=[/queue simple find where name=$ip and target=$target] do={ /queue simple remove $q; }
  } on-error={ :log warning ("NetPro queue cleanup failed for ip=" . $address); };
}