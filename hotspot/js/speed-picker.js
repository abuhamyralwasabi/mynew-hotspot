(function () {
  'use strict';

  var c = window.NETPRO_CONFIG || {};
  var instances = [];
  var portal = null;
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

  function ensurePortal() {
    if (portal) return portal;

    portal = document.createElement('div');
    portal.id = 'netproSpeedPortal';
    portal.className = 'speed-picker-menu speed-picker-portal';
    portal.setAttribute('role', 'listbox');
    portal.hidden = true;
    document.body.appendChild(portal);

    portal.onclick = function (event) {
      var option = event.target.closest ? event.target.closest('.speed-option') : null;
      if (!option || !activeInstance) return;

      event.preventDefault();
      event.stopPropagation();

      activeInstance.select.value = option.getAttribute('data-speed-value') || '';
      activeInstance.select.dispatchEvent(new Event('change', { bubbles: true }));
      activeInstance.sync();
      close(activeInstance);
    };

    return portal;
  }

  function renderOptions(instance) {
    var p = ensurePortal();

    p.innerHTML = (c.speeds || []).map(function (item) {
      return '<button type="button" class="speed-option" role="option" data-speed-value="' +
        esc(item.value) + '"><span>' + esc(item.label || item.value) +
        '</span><b dir="ltr">' + esc(item.value) + '</b></button>';
    }).join('');

    instance.sync();
  }

  function position(instance) {
    var p = ensurePortal();
    if (p.hidden) return;

    var rect = instance.trigger.getBoundingClientRect();
    var pad = 8;
    var gap = 6;
    var width = rect.width;
    var left = Math.max(pad, Math.min(rect.left, window.innerWidth - width - pad));

    p.style.width = width + 'px';
    p.style.left = left + 'px';
    p.style.visibility = 'hidden';
    p.style.display = 'grid';

    var height = p.offsetHeight;
    var top = rect.bottom + gap;

    if (top + height > window.innerHeight - pad && rect.top > height + gap) {
      top = rect.top - height - gap;
    }

    p.style.top = Math.max(pad, top) + 'px';
    p.style.visibility = 'visible';
  }

  function close(instance) {
    var p = ensurePortal();
    p.hidden = true;
    p.style.display = 'none';
    p.style.visibility = 'hidden';

    if (activeInstance === instance) activeInstance = null;

    instance.wrapper.classList.remove('open');
    instance.trigger.setAttribute('aria-expanded', 'false');
  }

  function open(instance) {
    var p = ensurePortal();

    if (activeInstance && activeInstance !== instance) {
      close(activeInstance);
    }

    activeInstance = instance;
    instance.sync();

    p.hidden = false;
    instance.wrapper.classList.add('open');
    instance.trigger.setAttribute('aria-expanded', 'true');
    position(instance);
  }

  function create(wrapper) {
    var select = wrapper.querySelector('select');
    var trigger = wrapper.querySelector('[data-speed-trigger]');

    if (!select || !trigger) return null;
    if (wrapper.__netproSpeedPicker) return wrapper.__netproSpeedPicker;

    select.innerHTML = (c.speeds || []).map(function (item) {
      return '<option value="' + esc(item.value) + '">' +
        esc(item.label || item.value) + '</option>';
    }).join('');

    select.hidden = true;
    select.setAttribute('aria-hidden', 'true');

    var instance = {
      wrapper: wrapper,
      select: select,
      trigger: trigger,
      sync: function () {
        var selected = valueExists(select.value) ? select.value : fallbackSpeed();
        select.value = selected;

        var labelNode = trigger.querySelector('[data-speed-label]');
        var label = selected;
        for (var i = 0; i < (c.speeds || []).length; i++) {
          if (String(c.speeds[i].value) === String(selected)) {
            label = c.speeds[i].label || c.speeds[i].value;
            break;
          }
        }

        if (labelNode) labelNode.textContent = label;

        if (portal) {
          portal.querySelectorAll('.speed-option').forEach(function (option) {
            var active = option.getAttribute('data-speed-value') === selected;
            option.classList.toggle('active', active);
            option.setAttribute('aria-selected', active ? 'true' : 'false');
          });
        }
      }
    };

    renderOptions(instance);

    trigger.onclick = function (event) {
      event.preventDefault();
      event.stopPropagation();
      if (wrapper.classList.contains('open')) close(instance);
      else open(instance);
    };

    wrapper.__netproSpeedPicker = instance;
    instances.push(instance);
    return instance;
  }

  function init() {
    document.querySelectorAll('.speed-picker').forEach(create);

    document.addEventListener('click', function (event) {
      if (activeInstance &&
          event.target !== activeInstance.trigger &&
          !activeInstance.trigger.contains(event.target) &&
          portal &&
          !portal.contains(event.target)) {
        close(activeInstance);
      }
    });

    window.addEventListener('resize', function () {
      if (activeInstance) position(activeInstance);
    });

    window.addEventListener('scroll', function () {
      if (activeInstance) position(activeInstance);
    }, true);
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
      instance.sync();
      return true;
    },
    getValue: function (select) {
      var instance = this.get(select);
      return instance ? instance.select.value : '';
    },
    close: function () {
      if (activeInstance) close(activeInstance);
    }
  };
})();