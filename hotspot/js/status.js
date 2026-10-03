(function () {
  'use strict';

  var c = window.NETPRO_CONFIG || {};
  var ctx = window.HS_CONTEXT || {};
  var pendingKey = 'netpro_pending_reauth';

  function validSpeed(value) {
    var list = c.speeds || [];
    for (var i = 0; i < list.length; i++) {
      if (String(list[i].value) === String(value)) return list[i].value;
    }
    return '';
  }

  function getStoredSpeed() {
    try {
      var scoped = ctx.username ? localStorage.getItem('netpro_status_speed:' + ctx.username) : '';
      var legacy = localStorage.getItem('netpro_status_speed');
      return validSpeed(scoped) || validSpeed(legacy);
    } catch (e) { return ''; }
  }

  function currentSpeed() {
    return validSpeed(ctx.domain) || getStoredSpeed() || validSpeed(c.defaultSpeed) ||
      ((c.speeds || [])[0] || {}).value || '';
  }

  function setText(id, value) {
    var element = document.getElementById(id);
    if (element) element.textContent = value;
  }

  function numberValue(value) {
    var n = parseFloat(String(value == null ? '' : value).replace(/,/g, ''));
    return isFinite(n) && n >= 0 ? n : null;
  }

  function formatNumber(value) {
    var rounded = Math.round(value * 100) / 100;
    return String(rounded);
  }

  function formatBytes(value) {
    var bytes = numberValue(value);
    if (bytes === null) return 'غير محدد';

    var units = [
      { size: 1099511627776, label: 'تيرابايت' },
      { size: 1073741824, label: 'جيجابايت' },
      { size: 1048576, label: 'ميجابايت' },
      { size: 1024, label: 'كيلوبايت' }
    ];

    for (var i = 0; i < units.length; i++) {
      if (bytes >= units[i].size) {
        return formatNumber(bytes / units[i].size) + ' ' + units[i].label;
      }
    }

    return formatNumber(bytes) + ' بايت';
  }

  function formatDuration(value) {
    var raw = String(value == null ? '' : value).trim();
    if (!raw || raw === 'none' || raw === 'unlimited' || raw === '—') return 'غير محدد';
    if (raw === '0' || raw === '0s') return '0 ثانية';

    var parts = [];
    var pattern = /(\d+)\s*(w|d|h|m|s)/gi;
    var match;

    while ((match = pattern.exec(raw))) {
      parts.push({
        value: parseInt(match[1], 10),
        unit: match[2].toLowerCase()
      });
    }

    if (!parts.length) return raw;

    return parts.map(function (item) {
      var labels = {
        w: item.value === 1 ? 'أسبوع' : 'أسابيع',
        d: item.value === 1 ? 'يوم' : 'أيام',
        h: item.value === 1 ? 'ساعة' : 'ساعات',
        m: item.value === 1 ? 'دقيقة' : 'دقائق',
        s: item.value === 1 ? 'ثانية' : 'ثوانٍ'
      };
      return item.value + ' ' + labels[item.unit];
    }).join(' ');
  }

  function formatLoginBy(value) {
    var raw = String(value || '').trim().toLowerCase();
    var labels = {
      'http-chap': 'HTTP-CHAP',
      'http-pap': 'HTTP-PAP',
      'https': 'HTTPS',
      'cookie': 'Cookie',
      'mac': 'MAC',
      'mac-cookie': 'MAC Cookie',
      'trial': 'تجربة'
    };
    return labels[raw] || (value || 'غير محدد');
  }

  function updateIdentity() {
    setText('clientIp', ctx.ip || 'غير محدد');
    setText('clientMac', ctx.mac || 'غير محدد');
    setText('loginBy', formatLoginBy(ctx.loginBy));
    setText('interfaceName', ctx.interfaceName || 'غير محدد');
    setText('vlanId', ctx.vlanId || 'غير محدد');
    setText('idleTime', formatDuration(ctx.idleTime));
  }

  function updateUsage() {
    var total = numberValue(ctx.limitBytesTotal);
    var routerRemain = numberValue(ctx.remainBytesTotal);
    var sessionUsed = (numberValue(ctx.bytesIn) || 0) + (numberValue(ctx.bytesOut) || 0);

    // When RouterOS supplies remain-bytes-total, it is the authoritative
    // remaining quota value. Otherwise only the measured traffic counters
    // are shown and no artificial quota is created.
    var used = routerRemain !== null && total !== null
      ? Math.max(0, total - routerRemain)
      : sessionUsed;

    var remain = routerRemain !== null
      ? routerRemain
      : (total !== null ? Math.max(0, total - used) : null);

    var percent = total !== null && total > 0
      ? Math.max(0, Math.min(100, Math.floor((used / total) * 100)))
      : null;

    var percentEl = document.getElementById('percent');
    var bar = document.getElementById('bar');
    var circle = document.getElementById('circle');
    var msg = document.getElementById('msg');

    setText('used', formatBytes(used));
    setText('total', total !== null ? formatBytes(total) : 'غير محدد');
    setText('remain', remain !== null ? formatBytes(remain) : 'غير محدد');

    if (percent === null) {
      if (percentEl) percentEl.textContent = '—';
      if (bar) bar.style.width = '0%';
      if (circle) circle.style.strokeDashoffset = '440';
      if (msg) msg.textContent = sessionUsed > 0
        ? '✅ الاستهلاك المعروض من عدادات RouterOS الحالية'
        : '✅ لا يوجد حد بيانات مُعرّف لهذا الكرت';
      return;
    }

    if (percentEl) percentEl.textContent = percent + '%';
    if (bar) bar.style.width = percent + '%';
    if (circle) circle.style.strokeDashoffset = 440 - (440 * percent / 100);
    if (msg) msg.textContent = percent >= 90
      ? '🚨 الكرت اقترب من استهلاك الحد المسموح'
      : percent >= 50
        ? '⚠️ تم استهلاك جزء متوسط من الرصيد'
        : '✅ الكرت بحالة جيدة';
  }

  function updateTrafficAndTime() {
    // MikroTik semantics: bytes-out = bytes sent to the client (download),
    // bytes-in = bytes received from the client (upload).
    setText('download', formatBytes(ctx.bytesOut));
    setText('upload', formatBytes(ctx.bytesIn));
    setText('uptime', formatDuration(ctx.uptime));
    setText('timeLeft', formatDuration(ctx.sessionTimeLeft));
  }

  function renderCurrentSpeed() {
    var speed = currentSpeed();
    setText('currentSpeed', speed || '—');
    setText('currentSpeedDuplicate', speed || '—');

    var select = document.getElementById('speedChange');
    if (!select) return;

    select.value = speed;
    if (window.NETPRO_SPEED_PICKER) {
      window.NETPRO_SPEED_PICKER.setValue(select, speed);
    }
  }

  function beginSpeedChange() {
    var select = document.getElementById('speedChange');
    var next = select ? validSpeed(select.value) : '';
    var current = currentSpeed();
    var button = document.getElementById('applySpeed');
    var overlay = document.getElementById('reauthOverlay');

    if (!next || !current || next === current || !ctx.linkLogout) return;

    try {
      sessionStorage.setItem(pendingKey, JSON.stringify({
        auto: true,
        speed: next,
        username: ctx.username || '',
        createdAt: Date.now()
      }));
    } catch (e) {}

    try {
      localStorage.setItem('netpro_status_speed:' + (ctx.username || ''), next);
      localStorage.setItem('netpro_status_speed', next);
    } catch (e) {}

    if (button) button.disabled = true;
    if (overlay) overlay.hidden = false;

    var joiner = ctx.linkLogout.indexOf('?') >= 0 ? '&' : '?';
    var query = [
      'var=speed-change',
      'hs_relogin=1',
      'hs_speed=' + encodeURIComponent(next),
      'hs_username=' + encodeURIComponent(ctx.username || '')
    ].join('&');

    location.replace(ctx.linkLogout + joiner + query);
  }

  function startRefresh() {
    var timeout = parseInt(ctx.refreshTimeoutSecs, 10);
    if (timeout > 0) {
      setInterval(function () {
        if (document.visibilityState === 'visible') location.reload();
      }, Math.max(30, timeout) * 1000);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    updateIdentity();
    renderCurrentSpeed();
    updateUsage();
    updateTrafficAndTime();

    var button = document.getElementById('applySpeed');
    if (button) button.addEventListener('click', beginSpeedChange);

    startRefresh();
  });
})();
