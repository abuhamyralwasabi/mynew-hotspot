(function () {
  'use strict';

  var STATE_KEY = 'netpro_auth_state_v2';
  var LEGACY_CARD_KEY = 'netpro_last_card';
  var LEGACY_HISTORY_KEY = 'netpro_card_history';
  var COOKIE_KEY = 'netpro_last_username';
  var COOKIE_SPEED = 'netpro_last_speed';
  var ATTEMPT_KEY = 'netpro_auth_attempt_v2';
  var AUTO_ATTEMPT_KEY = 'netpro_auto_login_attempt_v2';
  var PENDING_KEY = 'netpro_pending_reauth';
  var COOKIE_MAX_AGE = 31536000;

  function parse(value, fallback) {
    try {
      return JSON.parse(value) || fallback;
    } catch (e) {
      return fallback;
    }
  }

  function normalizeSource(value) {
    value = String(value || '').toLowerCase();
    return value === 'local' || value === 'radius' ? value : '';
  }

  function validState(state) {
    if (!state || typeof state !== 'object' || !state.username) return null;
    return {
      username: String(state.username),
      speed: state.speed ? String(state.speed) : '',
      source: normalizeSource(state.source),
      lastSuccess: parseInt(state.lastSuccess, 10) || 0,
      autoLogin: state.autoLogin !== false
    };
  }

  function validAttempt(attempt) {
    if (!attempt || typeof attempt !== 'object' || !attempt.username) return null;

    var mode = normalizeSource(attempt.mode);
    var fallbackMode = normalizeSource(attempt.fallbackMode);

    return {
      username: String(attempt.username),
      speed: attempt.speed ? String(attempt.speed) : '',
      mode: mode || 'radius',
      fallbackMode: fallbackMode,
      auto: attempt.auto === true,
      allowFallback: attempt.allowFallback !== false,
      createdAt: parseInt(attempt.createdAt, 10) || Date.now()
    };
  }

  function getCookie(name) {
    var parts = String(document.cookie || '').split(';');
    for (var i = 0; i < parts.length; i++) {
      var item = parts[i].trim();
      if (item.indexOf(name + '=') === 0) {
        try {
          return decodeURIComponent(item.substring(name.length + 1));
        } catch (e) {
          return item.substring(name.length + 1);
        }
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

  function clearCookie(name) {
    try {
      document.cookie = name + '=; Max-Age=0; Path=/; SameSite=Lax';
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
            source: '',
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
          source: '',
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
      } else {
        localStorage.removeItem('netpro_status_speed:' + state.username);
        localStorage.removeItem('netpro_status_speed');
      }
    } catch (e) {}

    setCookie(COOKIE_KEY, state.username, COOKIE_MAX_AGE);

    if (state.speed) setCookie(COOKIE_SPEED, state.speed, COOKIE_MAX_AGE);
    else clearCookie(COOKIE_SPEED);
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

  function rememberSuccess(username, speed, source) {
    if (!username) return;

    var normalizedSource = normalizeSource(source);
    var rememberedSpeed = normalizedSource === 'local' ? '' : (speed ? String(speed) : '');

    var state = {
      username: String(username),
      speed: rememberedSpeed,
      source: normalizedSource,
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
      source: state.source,
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

  function saveAttempt(attempt) {
    var value = validAttempt(attempt);
    if (!value) return false;

    try {
      sessionStorage.setItem(ATTEMPT_KEY, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  function readAttempt() {
    try {
      return validAttempt(parse(sessionStorage.getItem(ATTEMPT_KEY) || 'null', null));
    } catch (e) {
      return null;
    }
  }

  function clearAttempt() {
    try { sessionStorage.removeItem(ATTEMPT_KEY); } catch (e) {}
  }

  function markAutoAttempt() {
    try {
      sessionStorage.setItem(AUTO_ATTEMPT_KEY, String(Date.now()));
      return true;
    } catch (e) {
      return true;
    }
  }

  function autoAttempted() {
    try {
      return !!sessionStorage.getItem(AUTO_ATTEMPT_KEY);
    } catch (e) {
      return false;
    }
  }

  function clearAutoAttempt() {
    try { sessionStorage.removeItem(AUTO_ATTEMPT_KEY); } catch (e) {}
  }

  function isFallbackError(error) {
    var a = String(error || '').trim().toLowerCase();

    if (!a) return false;

    return a.indexOf('invalid username or password') >= 0 ||
      a.indexOf('invalid password') >= 0 ||
      a.indexOf('wrong password') >= 0 ||
      a.indexOf('user not found') >= 0 ||
      a.indexOf('no such user') >= 0 ||
      a.indexOf('access-reject') >= 0 ||
      (a.indexOf('radius') >= 0 &&
        (a.indexOf('timeout') >= 0 ||
         a.indexOf('not responding') >= 0 ||
         a.indexOf('unreachable') >= 0));
  }

  function shouldFallback(error) {
    var attempt = readAttempt();

    if (!attempt || !attempt.allowFallback || !attempt.fallbackMode) return false;
    if (Date.now() - attempt.createdAt > 60000) return false;
    if (!isFallbackError(error)) return false;

    return true;
  }

  function prepareFallback() {
    var attempt = readAttempt();
    if (!attempt || !attempt.fallbackMode) return null;

    return {
      username: attempt.username,
      speed: attempt.speed,
      mode: attempt.fallbackMode,
      fallbackMode: '',
      auto: attempt.auto,
      allowFallback: false,
      createdAt: Date.now()
    };
  }

  function finalLogout(usernameHint) {
    var state = read();
    var username = state ? state.username : (usernameHint ? String(usernameHint) : '');

    try {
      localStorage.removeItem(STATE_KEY);
      localStorage.removeItem(LEGACY_CARD_KEY);
      localStorage.removeItem('netpro_status_speed');

      if (username) {
        localStorage.removeItem('netpro_status_speed:' + username);

        var h = history();
        h.cards = h.cards.filter(function (item) {
          return item && item.card !== username;
        });

        localStorage.setItem(LEGACY_HISTORY_KEY, JSON.stringify(h));
      }
    } catch (e) {}

    clearCookie(COOKIE_KEY);
    clearCookie(COOKIE_SPEED);

    clearAutoAttempt();
    clearAttempt();

    try { sessionStorage.removeItem(PENDING_KEY); } catch (e) {}
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
    getSource: function () {
      var state = read();
      return state ? state.source : '';
    },
    isAutoLoginEnabled: function () {
      var state = read();
      return !!(state && state.autoLogin);
    },
    rememberSuccess: rememberSuccess,
    setAutoLogin: setAutoLogin,
    saveAttempt: saveAttempt,
    readAttempt: readAttempt,
    clearAttempt: clearAttempt,
    shouldFallback: shouldFallback,
    prepareFallback: prepareFallback,
    isFallbackError: isFallbackError,
    finalLogout: finalLogout,
    clearAutoAttempt: clearAutoAttempt,
    markAutoAttempt: markAutoAttempt,
    autoAttempted: autoAttempted,
    history: history
  };
})();
