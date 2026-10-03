(function () {
  'use strict';

  var STATE_KEY = 'netpro_auth_state_v2';
  var LEGACY_CARD_KEY = 'netpro_last_card';
  var LEGACY_HISTORY_KEY = 'netpro_card_history';
  var COOKIE_KEY = 'netpro_last_username';
  var COOKIE_SPEED = 'netpro_last_speed';
  var COOKIE_MAX_AGE = 31536000;

  function parse(value, fallback) {
    try {
      return JSON.parse(value) || fallback;
    } catch (e) {
      return fallback;
    }
  }

  function validState(state) {
    if (!state || typeof state !== 'object' || !state.username) return null;
    return {
      username: String(state.username),
      speed: state.speed ? String(state.speed) : '',
      lastSuccess: parseInt(state.lastSuccess, 10) || 0,
      autoLogin: state.autoLogin !== false
    };
  }

  function getCookie(name) {
    var parts = String(document.cookie || '').split(';');
    for (var i = 0; i < parts.length; i++) {
      var item = parts[i].trim();
      if (item.indexOf(name + '=') === 0) {
        return decodeURIComponent(item.substring(name.length + 1));
      }
    }
    return '';
  }

  function setCookie(name, value, maxAge) {
    try {
      document.cookie = name + '=' + encodeURIComponent(value) +
        '; Max-Age=' + maxAge + '; Path=/; SameSite=Lax';
    } catch (e) {}
  }

  function read() {
    var state = null;

    try {
      state = validState(parse(localStorage.getItem(STATE_KEY) || 'null', null));
    } catch (e) {}

    if (!state) {
      try {
        var legacy = parse(localStorage.getItem(LEGACY_CARD_KEY) || 'null', null);
        if (legacy && legacy.card) {
          state = {
            username: String(legacy.card),
            speed: legacy.speed ? String(legacy.speed) : '',
            lastSuccess: parseInt(legacy.usedAt, 10) || 0,
            autoLogin: true
          };
        }
      } catch (e) {}
    }

    if (!state) {
      var cookieUsername = getCookie(COOKIE_KEY);
      if (cookieUsername) {
        state = {
          username: cookieUsername,
          speed: getCookie(COOKIE_SPEED),
          lastSuccess: 0,
          autoLogin: true
        };
      }
    }

    return state;
  }

  function write(state) {
    state = validState(state);
    if (!state) return;

    try {
      localStorage.setItem(STATE_KEY, JSON.stringify(state));
      localStorage.setItem(LEGACY_CARD_KEY, JSON.stringify({
        card: state.username,
        speed: state.speed,
        usedAt: state.lastSuccess
      }));
      if (state.speed) {
        localStorage.setItem('netpro_status_speed:' + state.username, state.speed);
        localStorage.setItem('netpro_status_speed', state.speed);
      }
    } catch (e) {}

    setCookie(COOKIE_KEY, state.username, COOKIE_MAX_AGE);
    if (state.speed) setCookie(COOKIE_SPEED, state.speed, COOKIE_MAX_AGE);
  }

  function history() {
    var data;
    try {
      data = parse(localStorage.getItem(LEGACY_HISTORY_KEY) || 'null', { cards: [] });
    } catch (e) {
      data = { cards: [] };
    }
    if (!data || !Array.isArray(data.cards)) data = { cards: [] };
    return data;
  }

  function rememberSuccess(username, speed) {
    if (!username) return;

    var state = {
      username: String(username),
      speed: speed ? String(speed) : '',
      lastSuccess: Date.now(),
      autoLogin: true
    };

    write(state);

    var h = history();
    h.cards = h.cards.filter(function (item) {
      return item && item.card !== state.username;
    });
    h.cards.unshift({
      card: state.username,
      speed: state.speed,
      usedAt: state.lastSuccess
    });
    h.cards = h.cards.slice(0, 5);

    try {
      localStorage.setItem(LEGACY_HISTORY_KEY, JSON.stringify(h));
    } catch (e) {}
  }

  function setAutoLogin(enabled) {
    var state = read();
    if (!state) return;

    state.autoLogin = enabled !== false;
    write(state);
  }

  function clearCookie(name) {
    try {
      document.cookie = name + '=; Max-Age=0; Path=/; SameSite=Lax';
    } catch (e) {}
  }

  function finalLogout() {
    var state = read();
    var username = state ? state.username : '';

    try {
      localStorage.removeItem(STATE_KEY);
      localStorage.removeItem(LEGACY_CARD_KEY);
      localStorage.removeItem('netpro_status_speed');
      if (username) localStorage.removeItem('netpro_status_speed:' + username);
      if (username) {
        var h = history();
        h.cards = h.cards.filter(function (item) {
          return item && item.card !== username;
        });
        localStorage.setItem(LEGACY_HISTORY_KEY, JSON.stringify(h));
      }
    } catch (e) {}

    clearCookie(COOKIE_KEY);
    clearCookie(COOKIE_SPEED);

    try {
      sessionStorage.removeItem('netpro_auto_login_attempt_v2');
      sessionStorage.removeItem('netpro_pending_reauth');
    } catch (e) {}
  }

  function clearAutoAttempt() {
    try { sessionStorage.removeItem('netpro_auto_login_attempt_v2'); } catch (e) {}
  }

  function markAutoAttempt() {
    try {
      sessionStorage.setItem('netpro_auto_login_attempt_v2', String(Date.now()));
      return true;
    } catch (e) {
      return true;
    }
  }

  function autoAttempted() {
    try {
      return !!sessionStorage.getItem('netpro_auto_login_attempt_v2');
    } catch (e) {
      return false;
    }
  }

  window.NETPRO_AUTH = {
    read: read,
    getLastUsername: function () {
      var state = read();
      return state ? state.username : '';
    },
    getLastSpeed: function () {
      var state = read();
      return state ? state.speed : '';
    },
    isAutoLoginEnabled: function () {
      var state = read();
      return !!(state && state.autoLogin);
    },
    rememberSuccess: rememberSuccess,
    setAutoLogin: setAutoLogin,
    finalLogout: finalLogout,
    clearAutoAttempt: clearAutoAttempt,
    markAutoAttempt: markAutoAttempt,
    autoAttempted: autoAttempted,
    history: history
  };
})();