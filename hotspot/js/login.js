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
  var lastCardKey = 'netpro_last_card';
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
    var fallback = c.defaultSpeed || ((list[0] || {}).value || '');
    for (var i = 0; i < list.length; i++) {
      if (list[i].value === value) return value;
    }
    for (var j = 0; j < list.length; j++) {
      if (list[j].value === fallback) return fallback;
    }
    return (list[0] || {}).value || '';
  }

  function saveCard(card, selectedSpeed) {
    if (!card) return;
    var h = history();
    var record = { card: card, speed: validSpeed(selectedSpeed), usedAt: Date.now() };

    h.cards = h.cards.filter(function (item) { return item.card !== card; });
    h.cards.unshift(record);
    h.cards = h.cards.slice(0, 5);

    try {
      localStorage.setItem(historyKey, JSON.stringify(h));
      localStorage.setItem(lastCardKey, JSON.stringify(record));
      localStorage.setItem('netpro_status_speed:' + card, record.speed);
      localStorage.setItem('netpro_status_speed', record.speed);
    } catch (e) {}
  }

  function getLastCard() {
    try {
      var saved = parseJson(localStorage.getItem(lastCardKey) || 'null', null);
      if (saved && saved.card) return saved;
    } catch (e) {}

    var h = history();
    return h.cards[0] || null;
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

    var lastRecord = getLastCard();
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

    if (last) last.hidden = !(lastRecord && lastRecord.card);
  }

  function renderLoginSpeedPicker() {
    var picker = document.getElementById('loginSpeedPicker');
    if (!picker || !speed) return;

    var trigger = picker.querySelector('[data-speed-trigger]');
    var sourceMenu = picker.querySelector('[data-speed-menu]');
    if (!trigger || !sourceMenu) return;

    var oldPortal = document.getElementById('loginSpeedPortal');
    if (oldPortal) oldPortal.remove();

    sourceMenu.style.display = 'none';
    sourceMenu.setAttribute('aria-hidden', 'true');

    var portal = document.createElement('div');
    portal.id = 'loginSpeedPortal';
    portal.className = 'speed-picker-menu login-speed-portal';
    portal.setAttribute('role', 'listbox');
    portal.setAttribute('aria-label', 'سرعات الاتصال');
    portal.hidden = true;

    portal.innerHTML = (c.speeds || []).map(function (item) {
      return '<button type="button" class="speed-option" role="option" data-speed-value="' +
        String(item.value || '').replace(/"/g, '&quot;') +
        '"><span>' + String(item.label || item.value || '') +
        '</span><b dir="ltr">' + String(item.value || '') + '</b></button>';
    }).join('');

    document.body.appendChild(portal);

    function sync() {
      var selected = validSpeed(speed.value);
      speed.value = selected;

      var chosen = (c.speeds || []).find(function (item) { return item.value === selected; });
      var label = trigger.querySelector('[data-speed-label]');
      if (label) label.textContent = chosen ? (chosen.label || chosen.value) : selected;

      portal.querySelectorAll('.speed-option').forEach(function (option) {
        var active = option.getAttribute('data-speed-value') === selected;
        option.classList.toggle('active', active);
        option.setAttribute('aria-selected', active ? 'true' : 'false');
      });
    }

    function position() {
      if (portal.hidden) return;

      var rect = trigger.getBoundingClientRect();
      var viewportPad = 8;
      var gap = 6;
      var width = rect.width;
      var left = Math.max(viewportPad, Math.min(rect.left, window.innerWidth - width - viewportPad));

      portal.style.width = width + 'px';
      portal.style.left = left + 'px';
      portal.style.visibility = 'hidden';
      portal.style.display = 'grid';

      var height = portal.offsetHeight;
      var top = rect.bottom + gap;

      if (top + height > window.innerHeight - viewportPad && rect.top > height + gap) {
        top = rect.top - height - gap;
      }

      portal.style.top = Math.max(viewportPad, top) + 'px';
      portal.style.visibility = 'visible';
    }

    function close() {
      portal.hidden = true;
      portal.style.display = 'none';
      portal.style.visibility = 'hidden';
      picker.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
    }

    function open() {
      sync();
      portal.hidden = false;
      picker.classList.add('open');
      trigger.setAttribute('aria-expanded', 'true');
      position();
    }

    trigger.onclick = function (event) {
      event.preventDefault();
      event.stopPropagation();
      if (portal.hidden) open();
      else close();
    };

    portal.onclick = function (event) {
      var option = event.target.closest ? event.target.closest('.speed-option') : null;
      if (!option) return;

      event.preventDefault();
      event.stopPropagation();

      speed.value = validSpeed(option.getAttribute('data-speed-value') || '');
      speed.dispatchEvent(new Event('change', { bubbles: true }));
      sync();
      close();
    };

    document.addEventListener('click', function (event) {
      if (event.target === trigger || trigger.contains(event.target) || portal.contains(event.target)) return;
      close();
    });

    window.addEventListener('resize', position);
    window.addEventListener('scroll', position, true);

    sync();
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

    function afterSpeedRender() {
      renderLoginSpeedPicker();
      renderHistory();
    }

    if (window.HS_RENDER && typeof window.HS_RENDER.renderSpeeds === 'function') {
      window.HS_RENDER.renderSpeeds(speed);
      afterSpeedRender();
    } else {
      var retry = 0;
      var renderTimer = setInterval(function () {
        retry++;
        if (window.HS_RENDER && typeof window.HS_RENDER.renderSpeeds === 'function') {
          clearInterval(renderTimer);
          window.HS_RENDER.renderSpeeds(speed);
          afterSpeedRender();
        } else if (retry > 20) {
          clearInterval(renderTimer);
          afterSpeedRender();
        }
      }, 50);
    }

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
        var lastRecord = getLastCard();
        if (!lastRecord || !lastRecord.card) return;

        input.value = lastRecord.card;
        speed.value = validSpeed(lastRecord.speed);
        saveCard(input.value, speed.value);

        if (ctx.chapId) {
          doLogin();
        } else {
          form.submit();
        }
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
      setTimeout(function () {
        doLogin();
      }, 80);
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