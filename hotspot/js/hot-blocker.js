(function () {
  'use strict';

  var BLOCKED_AT = 'netpro_blocked_at';
  var BLOCK_MINUTES = 'netpro_block_minutes';
  var FAIL_COUNT = 'netpro_fail_count';

  function cookie(name) {
    var parts = String(document.cookie || '').split(';');
    for (var i = 0; i < parts.length; i++) {
      var part = parts[i].trim();
      if (part.indexOf(name + '=') === 0) return part.substring(name.length + 1);
    }
    return '';
  }

  function setCookie(name, value, minutes) {
    document.cookie = name + '=' + encodeURIComponent(value) +
      '; Max-Age=' + Math.max(0, Math.floor(minutes * 60)) +
      '; Path=/; SameSite=Lax';
  }

  function clearFailures() {
    setCookie(BLOCKED_AT, '', 0);
    setCookie(BLOCK_MINUTES, '', 0);
    setCookie(FAIL_COUNT, '', 0);
  }

  function isTransientError(error) {
    var a = String(error || '').toLowerCase();
    return a.indexOf('already authorizing') >= 0 ||
      a.indexOf('retry later') >= 0 ||
      a.indexOf('already logged in') >= 0 ||
      a.indexOf('already logged') >= 0;
  }

  function isDualAuthFallback(error) {
    try {
      return !!(window.NETPRO_AUTH &&
        typeof window.NETPRO_AUTH.shouldFallback === 'function' &&
        window.NETPRO_AUTH.shouldFallback(error));
    } catch (e) {
      return false;
    }
  }

  function init() {
    var countdown = document.querySelector('[data-block-countdown]');
    if (countdown) {
      var started = parseInt(cookie(BLOCKED_AT), 10) || Date.now();
      var duration = (parseInt(cookie(BLOCK_MINUTES), 10) || 2) * 60000;
      var timer = setInterval(function () {
        var left = Math.max(0, started + duration - Date.now());
        countdown.textContent =
          'يتبقى ' + Math.floor(left / 60000) + ' دقيقة و ' +
          Math.floor((left % 60000) / 1000) + ' ثانية';
        if (!left) {
          clearInterval(timer);
          clearFailures();
          location.replace('login.html');
        }
      }, 1000);
      return;
    }

    var marker = document.querySelector('script[login-error]');
    if (!marker) return;

    if (document.querySelector('script[clear-hot-blocker]')) {
      clearFailures();
      return;
    }

    if (cookie(BLOCKED_AT)) {
      location.replace('block.html');
      return;
    }

    var error = marker.getAttribute('login-error') || '';

    // A dual-auth handoff is a deliberate second authentication attempt.
    // Do not count the first RADIUS/local source mismatch as a bad card.
    if (isDualAuthFallback(error)) return;

    if (!error || isTransientError(error)) return;

    var count = (parseInt(cookie(FAIL_COUNT), 10) || 0) + 1;
    var max = parseInt(marker.getAttribute('try-count') || 6, 10);
    var minutes = parseInt(marker.getAttribute('block-time') || 2, 10);

    setCookie(FAIL_COUNT, count, minutes);
    if (count > max) {
      setCookie(BLOCKED_AT, Date.now(), minutes);
      setCookie(BLOCK_MINUTES, minutes, minutes);
      location.replace('block.html');
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
