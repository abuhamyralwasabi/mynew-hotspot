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
      var value = localStorage.getItem('netpro_status_speed');
      return validSpeed(value);
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

  function updateUsage() {
    var total = parseInt(ctx.limitBytesTotal, 10);
    var used = (parseInt(ctx.bytesIn, 10) || 0) + (parseInt(ctx.bytesOut, 10) || 0);
    var percent = total > 0 ? Math.max(0, Math.min(100, Math.floor((used / total) * 100))) : null;
    var percentEl = document.getElementById('percent');
    var bar = document.getElementById('bar');
    var circle = document.getElementById('circle');
    var msg = document.getElementById('msg');

    if (percent === null) {
      if (percentEl) percentEl.textContent = '—';
      setText('used', 'غير محدد');
      setText('remain', 'غير محدد');
      if (bar) bar.style.width = '0%';
      if (msg) msg.textContent = '✅ لا يوجد حد بيانات مُعرّف لهذا الكرت';
      return;
    }

    if (percentEl) percentEl.textContent = percent + '%';
    setText('used', percent + '%');
    setText('remain', (100 - percent) + '%');
    if (bar) bar.style.width = percent + '%';
    if (circle) circle.style.strokeDashoffset = 440 - (440 * percent / 100);
    if (msg) msg.textContent = percent >= 90
      ? '🚨 الكرت اقترب من استهلاك الحد المسموح'
      : percent >= 50
        ? '⚠️ تم استهلاك جزء متوسط من الرصيد'
        : '✅ الكرت بحالة جيدة';
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

    var button = document.getElementById('applySpeed');
    if (button) button.addEventListener('click', beginSpeedChange);

    startRefresh();
  });
})();