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

  function parseJson(value, fallback) {
    try {
      return JSON.parse(value) || fallback;
    } catch (e) {
      return fallback;
    }
  }

  function history() {
    var value = parseJson(localStorage.getItem(historyKey) || 'null', { cards: [] });
    if (!Array.isArray(value.cards)) value.cards = [];
    return value;
  }

  function validSpeed(value) {
    var list = c.speeds || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].value === value) return value;
    }
    return validSpeed(c.defaultSpeed) || ((list[0] || {}).value || '');
  }

  function saveCard(card, selectedSpeed) {
    if (!card) return;
    var h = history();
    h.cards = h.cards.filter(function (item) { return item.card !== card; });
    h.cards.unshift({ card: card, speed: selectedSpeed, usedAt: Date.now() });
    h.cards = h.cards.slice(0, 5);

    try {
      localStorage.setItem(historyKey, JSON.stringify(h));
      localStorage.setItem('netpro_status_speed:' + card, selectedSpeed);
    } catch (e) {}
  }

  function clearPending() {
    try { sessionStorage.removeItem(pendingKey); } catch (e) {}
  }

  function pendingState() {
    try {
      return parseJson(sessionStorage.getItem(pendingKey) || 'null', null);
    } catch (e) {
      return null;
    }
  }

  function renderHistory() {
    var h = history();
    var list = document.getElementById('cardHistoryList');
    var wrap = document.getElementById('cardHistoryDropdown');
    var last = document.getElementById('lastCardBtn');
    if (!list) return;

    list.innerHTML = '';
    h.cards.forEach(function (item) {
      var row = document.createElement('div');
      row.className = 'history-item';

      var select = document.createElement('button');
      select.type = 'button';
      select.className = 'history-card-select';
      select.textContent = item.card;
      select.addEventListener('click', function () {
        input.value = item.card;
        speed.value = validSpeed(item.speed);
        wrap.hidden = true;
      });

      var del = document.createElement('button');
      del.type = 'button';
      del.className = 'delete-card-btn';
      del.textContent = '×';
      del.setAttribute('aria-label', 'حذف الكرت');
      del.addEventListener('click', function () {
        h.cards = h.cards.filter(function (x) { return x.card !== item.card; });
        try { localStorage.setItem(historyKey, JSON.stringify(h)); } catch (e) {}
        renderHistory();
      });

      row.appendChild(select);
      row.appendChild(del);
      list.appendChild(row);
    });

    if (last) last.hidden = !h.cards.length;
  }

  function doLogin() {
    var username = input.value.trim();
    var selectedSpeed = validSpeed(speed.value);
    var rawPassword = password ? (password.value || '') : '';

    if (!username || !selectedSpeed) {
      if (!username) input.focus();
      return false;
    }

    speed.value = selectedSpeed;

    if (sendin && ctx.chapId) {
      sendin.username.value = username;
      sendin.password.value = hexMD5(ctx.chapId + rawPassword + ctx.chapChallenge);
      sendin.domain.value = selectedSpeed;
      sendin.submit();
      return false;
    }

    return true;
  }

  window.doLogin = doLogin;

  document.addEventListener('DOMContentLoaded', function () {
    if (!form || !input || !speed) return;

    if (window.HS_RENDER && typeof window.HS_RENDER.renderSpeeds === 'function') {
      window.HS_RENDER.renderSpeeds(speed);
    } else {
      var retry = 0;
      var renderTimer = setInterval(function () {
        retry++;
        if (window.HS_RENDER && typeof window.HS_RENDER.renderSpeeds === 'function') {
          clearInterval(renderTimer);
          window.HS_RENDER.renderSpeeds(speed);
        } else if (retry > 20) {
          clearInterval(renderTimer);
        }
      }, 50);
    }

    renderHistory();

    input.addEventListener('input', function () {
      this.value = this.value
        .replace(/\s/g, '')
        .replace(/[٠-٩]/g, function (digit) {
          return String(digit.charCodeAt(0) - 1632);
        });
    });

    input.addEventListener('focus', function () {
      var wrap = document.getElementById('cardHistoryDropdown');
      if (wrap && history().cards.length) wrap.hidden = false;
    });

    document.addEventListener('click', function (event) {
      var wrap = document.getElementById('cardHistoryDropdown');
      if (!wrap || event.target === input || wrap.contains(event.target)) return;
      wrap.hidden = true;
    });

    var clearButton = document.getElementById('clearHistory');
    if (clearButton) {
      clearButton.addEventListener('click', function () {
        try { localStorage.removeItem(historyKey); } catch (e) {}
        renderHistory();
      });
    }

    var lastButton = document.getElementById('lastCardBtn');
    if (lastButton) {
      lastButton.addEventListener('click', function () {
        var h = history();
        if (!h.cards[0]) return;
        input.value = h.cards[0].card;
        speed.value = validSpeed(h.cards[0].speed);
        if (form.requestSubmit) form.requestSubmit();
        else doLogin();
      });
    }

    var perf = document.getElementById('performanceToggle');
    var perfEnabled = false;
    try { perfEnabled = localStorage.getItem('netpro_performance_mode') === '1'; } catch (e) {}
    document.documentElement.classList.toggle('performance-mode', perfEnabled);

    if (perf) {
      perf.textContent = perfEnabled ? '✅ تم تفعيل وضع التوفير' : '🚀 وضع التوفير الذكي';
      perf.addEventListener('click', function () {
        perfEnabled = !perfEnabled;
        document.documentElement.classList.toggle('performance-mode', perfEnabled);
        try { localStorage.setItem('netpro_performance_mode', perfEnabled ? '1' : '0'); } catch (e) {}
        perf.textContent = perfEnabled ? '✅ تم تفعيل وضع التوفير' : '🚀 وضع التوفير الذكي';
      });
    }

    var query = new URLSearchParams(location.search);
    var querySpeed = validSpeed(query.get('hs_speed') || '');
    var queryUsername = query.get('hs_username') || '';
    var isRelogin = query.get('hs_relogin') === '1';
    var pending = pendingState();

    if (ctx.error) {
      clearPending();
      return;
    }

    if (isRelogin || (pending && pending.auto)) {
      var reloginSpeed = querySpeed || validSpeed(pending && pending.speed);
      var reloginUser = queryUsername || ((pending || {}).username || ctx.username || '');

      if (!reloginSpeed || !reloginUser) {
        clearPending();
        return;
      }

      input.value = reloginUser;
      speed.value = reloginSpeed;
      try {
        sessionStorage.setItem(pendingKey, JSON.stringify({
          auto: true,
          speed: reloginSpeed,
          username: reloginUser,
          createdAt: Date.now()
        }));
      } catch (e) {}

      var overlay = document.getElementById('reauthOverlay');
      if (overlay) overlay.hidden = false;
      setTimeout(doLogin, 80);
    }

    form.addEventListener('submit', function (event) {
      var card = input.value.trim();
      var selectedSpeed = validSpeed(speed.value);
      saveCard(card, selectedSpeed);
      if (ctx.chapId) {
        event.preventDefault();
        doLogin();
      }
    });
  });
})();