(function () {
  'use strict';

  var c = window.NETPRO_CONFIG || {};
  var ctx = window.HS_CONTEXT || {};
  var pendingKey = 'netpro_pending_reauth';

  function validSpeed(value) {
    var list = c.speeds || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].value === value) return value;
    }
    return '';
  }

  function getStoredSpeed() {
    try {
      var scoped = ctx.username ? localStorage.getItem('netpro_status_speed:' + ctx.username) : '';
      var legacy = localStorage.getItem('netpro_status_speed');
      return validSpeed(scoped) || validSpeed(legacy);
    } catch (e) {
      return '';
    }
  }

  function currentSpeed() {
    return validSpeed(ctx.domain) || getStoredSpeed() || validSpeed(c.defaultSpeed) || ((c.speeds || [])[0] || {}).value || '';
  }

  function setText(id, value) {
    var element = document.getElementById(id);
    if (element) element.textContent = value;
  }

  function formatNumber(value) {
    var rounded = Math.round(value * 100) / 100;
    return String(rounded);
  }

  function formatBytes(value) {
    var bytes = parseFloat(value);
    if (!isFinite(bytes) || bytes < 0) return 'غير محدد';

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

    var matches = [];
    var pattern = /(\\d+)\\s*(w|d|h|m|s)/gi;
    var match;

    while ((match = pattern.exec(raw))) {
      matches.push({
        value: parseInt(match[1], 10),
        unit: match[2].toLowerCase()
      });
    }

    if (!matches.length) return raw;

    var labels = {
      w: 'أسبوع',
      d: 'يوم',
      h: 'ساعة',
      m: 'دقيقة',
      s: 'ثانية'
    };

    return matches.map(function (item) {
      var label = labels[item.unit];
      if ((item.unit === 'w' || item.unit === 'd') && item.value !== 1) {
        label = item.unit === 'w' ? 'أسابيع' : 'أيام';
      } else if (item.unit === 'h' && item.value !== 1) {
        label = 'ساعات';
      } else if (item.unit === 'm' && item.value !== 1) {
        label = 'دقائق';
      } else if (item.unit === 's' && item.value !== 1) {
        label = 'ثوانٍ';
      }

      return String(item.value) + ' ' + label;
    }).join(' ');
  }

  function updateUsage() {
    var total = parseInt(ctx.limitBytesTotal, 10);
    var routerRemain = parseInt(ctx.remainBytesTotal, 10);
    var hasRouterRemain = isFinite(routerRemain) && routerRemain >= 0;
    var sessionUsed = (parseInt(ctx.bytesIn, 10) || 0) + (parseInt(ctx.bytesOut, 10) || 0);
    var used = hasRouterRemain && total > 0 ? Math.max(0, total - routerRemain) : sessionUsed;
    var remain = hasRouterRemain ? routerRemain : (total > 0 ? Math.max(0, total - used) : null);
    var percent = total > 0 ? Math.max(0, Math.min(100, Math.floor((used / total) * 100))) : null;
    var percentEl = document.getElementById('percent');
    var bar = document.getElementById('bar');
    var circle = document.getElementById('circle');
    var msg = document.getElementById('msg');

    if (percent === null) {
      if (percentEl) percentEl.textContent = '—';
      setText('used', formatBytes(used));
      setText('remain', 'غير محدد');
      if (bar) bar.style.width = '0%';
      if (circle) circle.style.strokeDashoffset = '440';
      if (msg) msg.textContent = used > 0
        ? '✅ الاستهلاك محسوب حسب البيانات المستخدمة'
        : '✅ لا يوجد حد بيانات مُعرّف لهذا الكرت';
      return;
    }

    if (percentEl) percentEl.textContent = percent + '%';
    setText('used', formatBytes(used));
    setText('remain', formatBytes(remain));
    if (bar) bar.style.width = percent + '%';
    if (circle) circle.style.strokeDashoffset = 440 - (440 * percent / 100);
    if (msg) msg.textContent = percent >= 90
      ? '🚨 الكرت اقترب من استهلاك الحد المسموح'
      : percent >= 50
        ? '⚠️ تم استهلاك جزء متوسط من الرصيد'
        : '✅ الكرت بحالة جيدة';
  }

  function updateTrafficAndTime() {
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
    if (!select || !window.HS_RENDER) return;

    window.HS_RENDER.renderSpeeds(select);
    if (speed) select.value = speed;
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
    renderCurrentSpeed();
    updateUsage();
    updateTrafficAndTime();

    var button = document.getElementById('applySpeed');
    if (button) button.addEventListener('click', beginSpeedChange);

    startRefresh();
  });
})();