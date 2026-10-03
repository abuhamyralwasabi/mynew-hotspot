(function () {
  'use strict';

  var c = window.NETPRO_CONFIG || {};
  var ctx = window.HS_CONTEXT || {};
  var form = document.getElementById('loginForm');
  var input = document.getElementById('username');
  var speed = document.getElementById('speed');
  var password = document.getElementById('password');
  var sendin = document.forms.sendin;
  var historyKey = 'netpro_card_history';
  var pendingKey = 'netpro_pending_reauth';
  var autoTimer = null;
  var manualInteraction = false;

  function parse(value, fallback) {
    try { return JSON.parse(value) || fallback; }
    catch (e) { return fallback; }
  }

  function queryValue(name) {
    try {
      return new URLSearchParams(location.search).get(name) || '';
    } catch (e) {
      return '';
    }
  }

  function getRawError() {
    return ctx.error || queryValue('hs_error') || '';
  }

  function renderLoginError() {
    var box = document.getElementById('loginError');
    var raw = getRawError();
    if (!box || !raw) return;

    var message = typeof window.toArabicError === 'function'
      ? window.toArabicError(raw)
      : 'تعذر تسجيل الدخول. يرجى المحاولة مرة أخرى.';

    box.textContent = message;
    box.hidden = false;

    var hint = document.getElementById('loginHint');
    if (hint) hint.textContent = '⚠️ يرجى التحقق من رمز الكرت والمحاولة مرة أخرى';
  }

  function credentialPassword(username) {
    var mode = c.auth && c.auth.passwordMode ? c.auth.passwordMode : 'username';
    return mode === 'blank' ? '' : username;
  }

  function validSpeed(value) {
    var list = c.speeds || [];
    for (var i = 0; i < list.length; i++) {
      if (String(list[i].value) === String(value)) return list[i].value;
    }
    if (c.defaultSpeed) return c.defaultSpeed;
    return ((list[0] || {}).value || '');
  }

  function lastState() {
    return window.NETPRO_AUTH ? window.NETPRO_AUTH.read() : null;
  }

  function history() {
    if (window.NETPRO_AUTH && typeof window.NETPRO_AUTH.history === 'function') {
      return window.NETPRO_AUTH.history();
    }
    return parse(localStorage.getItem(historyKey) || 'null', { cards: [] });
  }

  function clearPending() {
    try { sessionStorage.removeItem(pendingKey); } catch (e) {}
  }

  function pendingState() {
    try { return parse(sessionStorage.getItem(pendingKey) || 'null', null); }
    catch (e) { return null; }
  }

  function renderHistory() {
    var h = history();
    if (!Array.isArray(h.cards)) h.cards = [];

    var list = document.getElementById('cardHistoryList');
    var wrap = document.getElementById('cardHistoryDropdown');
    var last = document.getElementById('lastCardBtn');
    if (!list) return;

    list.innerHTML = '';

    h.cards.forEach(function (item) {
      if (!item || !item.card) return;

      var row = document.createElement('div');
      row.className = 'history-item';

      var select = document.createElement('button');
      select.type = 'button';
      select.className = 'history-card-select';
      select.textContent = item.card;
      select.addEventListener('click', function () {
        manualInteraction = true;
        cancelAutoLogin();
        input.value = item.card;
        if (speed && window.NETPRO_SPEED_PICKER) {
          window.NETPRO_SPEED_PICKER.setValue(speed, validSpeed(item.speed));
        } else if (speed) {
          speed.value = validSpeed(item.speed);
        }
        if (wrap) wrap.hidden = true;
      });

      var del = document.createElement('button');
      del.type = 'button';
      del.className = 'delete-card-btn';
      del.textContent = '×';
      del.setAttribute('aria-label', 'حذف الكرت');
      del.addEventListener('click', function () {
        var current = history();
        current.cards = current.cards.filter(function (x) {
          return x && x.card !== item.card;
        });
        try { localStorage.setItem(historyKey, JSON.stringify(current)); } catch (e) {}
        renderHistory();
      });

      row.appendChild(select);
      row.appendChild(del);
      list.appendChild(row);
    });

    var state = lastState();
    if (last) last.hidden = !(state && state.username);
  }

  function cancelAutoLogin() {
    if (autoTimer) {
      clearTimeout(autoTimer);
      autoTimer = null;
    }
  }

  function markManualInteraction() {
    if (!manualInteraction) {
      manualInteraction = true;
      cancelAutoLogin();
    }
  }

  function getDestination() {
    try {
      var query = new URLSearchParams(location.search);
      return query.get('dst') || '$(link-status)';
    } catch (e) {
      return '$(link-status)';
    }
  }

  function doLogin(options) {
    options = options || {};

    var username = (input.value || '').trim();
    var selectedSpeed = validSpeed(speed.value);
    var rawPassword = credentialPassword(username);

    if (!username || !selectedSpeed) {
      if (!username) input.focus();
      return false;
    }

    speed.value = selectedSpeed;
    if (password) password.value = rawPassword;

    if (window.NETPRO_SPEED_PICKER) {
      window.NETPRO_SPEED_PICKER.setValue(speed, selectedSpeed);
    }

    if (sendin && ctx.chapId) {
      sendin.username.value = username;
      sendin.password.value = hexMD5(ctx.chapId + rawPassword + ctx.chapChallenge);
      sendin.domain.value = selectedSpeed;
      sendin.dst.value = getDestination();
      if (options.autoAttempt && window.NETPRO_AUTH) {
        window.NETPRO_AUTH.markAutoAttempt();
      }
      sendin.submit();
      return false;
    }

    if (form) {
      form.querySelector('input[name="username"]').value = username;
      form.querySelector('input[name="password"]').value = rawPassword;
      form.querySelector('input[name="domain"]').value = selectedSpeed;
    }

    return true;
  }

  function startAutoLogin(username, selectedSpeed) {
    if (!username || manualInteraction || !ctx.chapId) return;
    if (window.NETPRO_AUTH && window.NETPRO_AUTH.autoAttempted()) return;

    if (input) input.value = username;
    if (speed) {
      speed.value = validSpeed(selectedSpeed);
      if (window.NETPRO_SPEED_PICKER) {
        window.NETPRO_SPEED_PICKER.setValue(speed, speed.value);
      }
    }

    var overlay = document.getElementById('reauthOverlay');
    if (overlay) overlay.hidden = false;

    setTimeout(function () {
      if (!manualInteraction) doLogin({ autoAttempt: true });
    }, 100);
  }

  function startPendingReauth(pending) {
    var selectedSpeed = validSpeed(pending && pending.speed);
    var username = pending && pending.username;

    if (!selectedSpeed || !username) {
      clearPending();
      return;
    }

    if (input) input.value = username;
    if (speed) {
      speed.value = selectedSpeed;
      if (window.NETPRO_SPEED_PICKER) {
        window.NETPRO_SPEED_PICKER.setValue(speed, selectedSpeed);
      }
    }

    var overlay = document.getElementById('reauthOverlay');
    if (overlay) overlay.hidden = false;

    setTimeout(function () {
      doLogin({ autoAttempt: true });
    }, 100);
  }

  function setupAutoLogin() {
    var query;
    try { query = new URLSearchParams(location.search); }
    catch (e) { query = null; }

    var isReauth = query && query.get('hs_relogin') === '1';
    var pending = pendingState();

    if (ctx.error || queryValue('hs_error')) {
      clearPending();
      if (window.NETPRO_AUTH) window.NETPRO_AUTH.clearAutoAttempt();
      manualInteraction = true;
      return;
    }

    if (isReauth || (pending && pending.auto)) {
      startPendingReauth(pending || {
        auto: true,
        speed: query.get('hs_speed') || validSpeed(''),
        username: query.get('hs_username') || ctx.username || ''
      });
      return;
    }

    if (!window.NETPRO_AUTH || !window.NETPRO_AUTH.isAutoLoginEnabled()) return;

    var state = window.NETPRO_AUTH.read();
    if (!state || !state.username || window.NETPRO_AUTH.autoAttempted()) return;

    autoTimer = setTimeout(function () {
      autoTimer = null;
      if (!manualInteraction) {
        startAutoLogin(state.username, state.speed || validSpeed(''));
      }
    }, 650);
  }

  document.addEventListener('DOMContentLoaded', function () {
    renderLoginError();

    if (!form || !input || !speed) return;

    renderHistory();

    input.addEventListener('input', function () {
      markManualInteraction();
      this.value = this.value
        .replace(/\s/g, '')
        .replace(/[٠-٩]/g, function (digit) {
          return String(digit.charCodeAt(0) - 1632);
        });
    });

    input.addEventListener('focus', function () {
      markManualInteraction();
      var wrap = document.getElementById('cardHistoryDropdown');
      if (wrap && history().cards.length) wrap.hidden = false;
    });

    var speedTrigger = document.querySelector('#loginSpeedPicker [data-speed-trigger]');
    if (speedTrigger) {
      speedTrigger.addEventListener('pointerdown', markManualInteraction, { passive: true });
      speedTrigger.addEventListener('focus', markManualInteraction);
    }

    var clearButton = document.getElementById('clearHistory');
    if (clearButton) {
      clearButton.addEventListener('click', function () {
        markManualInteraction();
        try {
          localStorage.removeItem(historyKey);
          localStorage.removeItem('netpro_last_card');
          localStorage.removeItem('netpro_auth_state_v2');
          localStorage.removeItem('netpro_last_username');
        } catch (e) {}
        try { document.cookie = 'netpro_last_username=; Max-Age=0; Path=/; SameSite=Lax'; } catch (e) {}
        try { document.cookie = 'netpro_last_speed=; Max-Age=0; Path=/; SameSite=Lax'; } catch (e) {}
        if (window.NETPRO_AUTH) window.NETPRO_AUTH.setAutoLogin(false);
        renderHistory();
      });
    }

    var lastButton = document.getElementById('lastCardBtn');
    if (lastButton) {
      lastButton.addEventListener('click', function () {
        var state = lastState();
        if (!state || !state.username) return;

        markManualInteraction();
        input.value = state.username;

        if (speed) {
          speed.value = validSpeed(state.speed || '');
          if (window.NETPRO_SPEED_PICKER) {
            window.NETPRO_SPEED_PICKER.setValue(speed, speed.value);
          }
        }

        if (window.NETPRO_AUTH) window.NETPRO_AUTH.clearAutoAttempt();

        doLogin({ autoAttempt: false });
      });
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      doLogin({ autoAttempt: false });

      // Without CHAP the browser must submit the form itself after the
      // hidden credentials have been populated.
      if (!ctx.chapId) form.submit();
    });

    document.addEventListener('click', function (event) {
      var wrap = document.getElementById('cardHistoryDropdown');
      if (!wrap || event.target === input || wrap.contains(event.target)) return;
      wrap.hidden = true;
    });

    setupAutoLogin();
  });
})();
