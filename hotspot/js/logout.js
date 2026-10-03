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

  function query(name) {
    try {
      return new URLSearchParams(location.search).get(name) || '';
    } catch (e) {
      return '';
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var pending = readPending();
    var isFinal = query('netpro-final') === '1';

    if (pending && pending.auto && pending.speed && !isFinal) {
      if (pending.createdAt && Date.now() - pending.createdAt > 60000) {
        clearPending();
      } else {
        var context = window.HS_CONTEXT || {};
        var login = context.linkLoginOnly || context.linkLogin || 'login.html';
        var joiner = login.indexOf('?') >= 0 ? '&' : '';

        location.replace(login + joiner + [
          'dst=status.html',
          'hs_relogin=1',
          'hs_speed=' + encodeURIComponent(pending.speed),
          'hs_username=' + encodeURIComponent(pending.username || '')
        ].join('&'));

        return;
      }
    }

    clearPending();

    if (isFinal) {
      if (window.NETPRO_AUTH && typeof window.NETPRO_AUTH.finalLogout === 'function') {
        window.NETPRO_AUTH.finalLogout();
      }
      if (window.NETPRO_AUTH) window.NETPRO_AUTH.clearAutoAttempt();

      var contextFinal = window.HS_CONTEXT || {};
      var finalLogin = contextFinal.linkLoginOnly || contextFinal.linkLogin || 'login.html';
      setTimeout(function () {
        location.replace(finalLogin);
      }, 120);
      return;
    }

    // Normal logout: keep the last username, but disable automatic roaming.
    if (window.NETPRO_AUTH) {
      window.NETPRO_AUTH.setAutoLogin(false);
      window.NETPRO_AUTH.clearAutoAttempt();
    }
  });
})();
