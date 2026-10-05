(function () {
  'use strict';

  var c = window.NETPRO_CONFIG || {};
  var instances = [];
  var activeInstance = null;

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function valueExists(value) {
    var list = c.speeds || [];
    for (var i = 0; i < list.length; i++) {
      if (String(list[i].value) === String(value)) return true;
    }
    return false;
  }

  function fallbackSpeed() {
    if (valueExists(c.defaultSpeed)) return c.defaultSpeed;
    return ((c.speeds || [])[0] || {}).value || '';
  }

  function findLabel(value) {
    var list = c.speeds || [];
    for (var i = 0; i < list.length; i++) {
      if (String(list[i].value) === String(value)) {
        return list[i].label || list[i].value;
      }
    }
    return value || '';
  }

  function syncOptions(instance) {
    var menu = instance.menu;
    if (!menu) return;

    var selected = String(instance.select.value || '');
    menu.querySelectorAll('.speed-option').forEach(function (option) {
      var active = String(option.getAttribute('data-speed-value') || '') === selected;
      option.classList.toggle('active', active);
      option.setAttribute('aria-selected', active ? 'true' : 'false');
    });
  }

  function sync(instance) {
    var selected = valueExists(instance.select.value) ? instance.select.value : fallbackSpeed();
    instance.select.value = selected;

    var labelNode = instance.trigger.querySelector('[data-speed-label]');
    if (labelNode) labelNode.textContent = findLabel(selected);

    syncOptions(instance);
  }

  function close(instance) {
    if (!instance) return;

    instance.wrapper.classList.remove('open', 'open-up');
    instance.trigger.setAttribute('aria-expanded', 'false');
    instance.menu.hidden = true;

    if (activeInstance === instance) activeInstance = null;
  }

  function closeActive(except) {
    if (activeInstance && activeInstance !== except) close(activeInstance);
  }

  function chooseDirection(instance) {
    var rect = instance.trigger.getBoundingClientRect();
    var availableBelow = window.innerHeight - rect.bottom - 12;
    var availableAbove = rect.top - 12;
    var menuHeight = Math.min(
      320,
      Math.max(140, Math.floor(window.innerHeight * 0.55))
    );

    instance.wrapper.classList.toggle(
      'open-up',
      availableBelow < Math.min(menuHeight, 260) && availableAbove > availableBelow
    );
  }

  function open(instance) {
    closeActive(instance);
    activeInstance = instance;

    sync(instance);
    chooseDirection(instance);

    instance.menu.hidden = false;
    instance.wrapper.classList.add('open');
    instance.trigger.setAttribute('aria-expanded', 'true');
  }

  function render(instance) {
    instance.menu.innerHTML = (c.speeds || []).map(function (item) {
      return '<button type="button" class="speed-option" role="option" data-speed-value="' +
        esc(item.value) + '"><span>' + esc(item.label || item.value) +
        '</span></button>';
    }).join('');

    sync(instance);
  }

  function create(wrapper) {
    var select = wrapper.querySelector('select');
    var trigger = wrapper.querySelector('[data-speed-trigger]');
    var menu = wrapper.querySelector('[data-speed-menu]');

    if (!select || !trigger || !menu) return null;
    if (wrapper.__netproSpeedPicker) return wrapper.__netproSpeedPicker;

    select.innerHTML = (c.speeds || []).map(function (item) {
      return '<option value="' + esc(item.value) + '">' +
        esc(item.label || item.value) + '</option>';
    }).join('');
    select.hidden = true;
    select.setAttribute('aria-hidden', 'true');

    menu.hidden = true;
    menu.setAttribute('aria-label', menu.getAttribute('aria-label') || 'سرعات الاتصال');

    var instance = {
      wrapper: wrapper,
      select: select,
      trigger: trigger,
      menu: menu
    };

    render(instance);

    trigger.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();

      if (wrapper.classList.contains('open')) close(instance);
      else open(instance);
    });

    trigger.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
        event.preventDefault();
        open(instance);
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        close(instance);
      }
    });

    menu.addEventListener('click', function (event) {
      var option = event.target.closest ? event.target.closest('.speed-option') : null;
      if (!option) return;

      event.preventDefault();
      event.stopPropagation();

      var value = option.getAttribute('data-speed-value') || '';
      if (!valueExists(value)) return;

      instance.select.value = value;
      instance.select.dispatchEvent(new Event('change', { bubbles: true }));
      sync(instance);
      close(instance);
      instance.trigger.focus();
    });

    wrapper.__netproSpeedPicker = instance;
    instances.push(instance);
    return instance;
  }

  function init() {
    document.querySelectorAll('.speed-picker').forEach(create);

    document.addEventListener('click', function (event) {
      if (!activeInstance) return;
      if (!activeInstance.wrapper.contains(event.target)) close(activeInstance);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && activeInstance) close(activeInstance);
    });

    window.addEventListener('resize', function () {
      if (activeInstance) chooseDirection(activeInstance);
    });
  }

  document.addEventListener('DOMContentLoaded', init);

  window.NETPRO_SPEED_PICKER = {
    get: function (select) {
      for (var i = 0; i < instances.length; i++) {
        if (instances[i].select === select) return instances[i];
      }
      return null;
    },
    setValue: function (select, value) {
      var instance = this.get(select);
      if (!instance) return false;

      if (valueExists(value)) select.value = value;
      sync(instance);
      return true;
    },
    getValue: function (select) {
      var instance = this.get(select);
      return instance ? instance.select.value : '';
    },
    close: function () {
      closeActive(null);
    }
  };
})();
