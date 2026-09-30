(function () {
  'use strict';

  function readPending() {
    try {
      return JSON.parse(sessionStorage.getItem('netpro_pending_reauth') || 'null');
    } catch (e) {
      return null;
    }
  }

  function clearPending() {
    try { sessionStorage.removeItem('netpro_pending_reauth'); } catch (e) {}
  }

  document.addEventListener('DOMContentLoaded', function () {
    var pending = readPending();
    if (!pending || !pending.auto || !pending.speed) return;

    if (pending.createdAt && Date.now() - pending.createdAt > 60000) {
      clearPending();
      return;
    }

    var context = window.HS_CONTEXT || {};
    var login = context.linkLoginOnly || context.linkLogin || 'login.html';
    var joiner = login.indexOf('?') >= 0 ? '&' : '?';

    location.replace(login + joiner + [
      'dst=status.html',
      'hs_relogin=1',
      'hs_speed=' + encodeURIComponent(pending.speed),
      'hs_username=' + encodeURIComponent(pending.username || '')
    ].join('&'));
  });
})();