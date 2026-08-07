/* ui.js — toolbar, status bar, toasts, modal, shortcuts panel */
(function (MM) {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var els = {};
  var toastTimer = null;
  var confirmResolver = null;

  var TOAST_ICONS = {
    success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/></svg>',
    info:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M12 11.5V16"/></svg>',
    warn:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5L22 20H2L12 3.5z"/><path d="M12 10v4M12 17h.01"/></svg>',
    error:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/></svg>'
  };

  function init(actions) {
    els.nodes = $('statNodes');
    els.selection = $('statSelection');
    els.saveState = $('saveState');
    els.saveText = $('saveText');
    els.zoomLevel = $('zoomLevel');
    els.overlay = $('modalOverlay');
    els.del = $('btnDelete');

    $('btnNew').addEventListener('click', actions.newMap);
    $('btnAdd').addEventListener('click', actions.addChild);
    els.del.addEventListener('click', actions.deleteSelected);
    $('btnSave').addEventListener('click', actions.save);
    $('btnLoad').addEventListener('click', actions.load);

    $('zoomIn').addEventListener('click', function () { MM.Canvas.zoomBy(1.2); });
    $('zoomOut').addEventListener('click', function () { MM.Canvas.zoomBy(1 / 1.2); });
    els.zoomLevel.addEventListener('click', function () { MM.Canvas.resetZoom(); });
    $('zoomFit').addEventListener('click', function () { MM.Canvas.fit(); });

    $('shortcutsBtn').addEventListener('click', function (e) {
      e.stopPropagation();
      $('shortcutsPanel').classList.toggle('open');
    });
    document.addEventListener('click', function (e) {
      var panel = $('shortcutsPanel');
      if (panel.classList.contains('open') && !panel.contains(e.target)) {
        panel.classList.remove('open');
      }
    });

    $('modalCancel').addEventListener('click', function () { closeModal(false); });
    $('modalConfirm').addEventListener('click', function () { closeModal(true); });
    els.overlay.addEventListener('click', function (e) {
      if (e.target === els.overlay) closeModal(false);
    });
  }

  /* ── status bar ── */
  function setNodeCount(n) {
    els.nodes.textContent = n + (n === 1 ? ' node' : ' nodes');
  }

  function setSelection(text) {
    if (text) {
      els.selection.textContent = text.length > 34 ? text.slice(0, 33) + '…' : text;
      els.selection.classList.remove('empty');
    } else {
      els.selection.textContent = 'Nothing selected';
      els.selection.classList.add('empty');
    }
  }

  function setSaveState(state) {
    els.saveState.classList.remove('dirty', 'saved', 'none');
    if (state.dirty) {
      els.saveState.classList.add('dirty');
      els.saveText.textContent = 'Unsaved changes';
    } else if (state.savedAt) {
      els.saveState.classList.add('saved');
      els.saveText.textContent = 'Saved ' + new Date(state.savedAt)
        .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      els.saveState.classList.add('none');
      els.saveText.textContent = 'Not saved yet';
    }
  }

  function setZoom(z) {
    els.zoomLevel.textContent = Math.round(z * 100) + '%';
  }

  function setDeleteEnabled(b) {
    els.del.disabled = !b;
  }

  /* ── toast ── */
  function toast(msg, kind) {
    kind = kind || 'info';
    var t = $('toast');
    $('toastIcon').innerHTML = TOAST_ICONS[kind] || TOAST_ICONS.info;
    $('toastMsg').textContent = msg;
    t.className = 'toast show ' + kind;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.className = 'toast'; }, 2400);
  }

  /* ── confirm modal ── */
  function confirmBox(opts) {
    return new Promise(function (resolve) {
      confirmResolver = resolve;
      $('modalTitle').textContent = opts.title;
      $('modalMsg').textContent = opts.message;
      $('modalConfirm').textContent = opts.confirmLabel || 'Confirm';
      els.overlay.classList.add('open');
      $('modalConfirm').focus();
    });
  }

  function closeModal(result) {
    if (!confirmResolver) return;
    var resolve = confirmResolver;
    confirmResolver = null;
    els.overlay.classList.remove('open');
    resolve(result);
  }

  /* ── panels ── */
  function isBlocking() {
    return !!confirmResolver;
  }

  /** Closes any open panel/modal. Returns true if something was closed. */
  function closePanels() {
    var closed = false;
    var panel = $('shortcutsPanel');
    if (panel.classList.contains('open')) { panel.classList.remove('open'); closed = true; }
    if (confirmResolver) { closeModal(false); closed = true; }
    return closed;
  }

  MM.UI = {
    init: init,
    setNodeCount: setNodeCount,
    setSelection: setSelection,
    setSaveState: setSaveState,
    setZoom: setZoom,
    setDeleteEnabled: setDeleteEnabled,
    toast: toast,
    confirm: confirmBox,
    closePanels: closePanels,
    isBlocking: isBlocking
  };
})(window.MM = window.MM || {});