/* app.js — orchestration: state, actions, editing, keyboard shortcuts */
(function (MM) {
  'use strict';

  /* Single source of truth for the release version */
  MM.VERSION = 'v0.0.1a';

  var Nodes = MM.Nodes, Canvas = MM.Canvas, UI = MM.UI, Storage = MM.Storage; 

  var Nodes = MM.Nodes, Canvas = MM.Canvas, UI = MM.UI, Storage = MM.Storage;

  var App = {
    root: null,
    selectedId: null,
    editing: false,
    dirty: false,
    lastSavedAt: null
  };

  function selected() {
    return App.selectedId ? Nodes.find(App.root, App.selectedId) : null;
  }

  function markDirty() {
    App.dirty = true;
    updateStatus();
  }

  function select(id) {
    App.selectedId = id;
    Canvas.select(id);
    updateStatus();
  }

  function updateStatus() {
    UI.setNodeCount(Nodes.count(App.root));
    var sel = selected();
    UI.setSelection(sel ? sel.text : null);
    UI.setDeleteEnabled(!!sel && sel !== App.root);
    UI.setSaveState({ dirty: App.dirty, savedAt: App.lastSavedAt });
    var hint = document.getElementById('mapHint');
    if (hint) hint.classList.toggle('hidden', Nodes.count(App.root) > 1);
  }

  /* ── actions ── */
  function addChild() {
    var parent = selected() || App.root;
    var node = Nodes.createNode('New idea');
    parent.children.push(node);
    markDirty();
    Canvas.sync(App.root);
    select(node.id);
    startEdit(node.id);
  }

  function deleteSelected() {
    var node = selected();
    if (!node) { UI.toast('Select a node to delete', 'warn'); return; }
    if (node === App.root) { UI.toast('The root node can\u2019t be deleted', 'warn'); return; }

    var parent = Nodes.findParent(App.root, node.id);
    var n = Nodes.count(node);
    parent.children = parent.children.filter(function (c) { return c.id !== node.id; });

    markDirty();
    Canvas.sync(App.root);
    select(parent.id);
    var name = node.text.length > 24 ? node.text.slice(0, 23) + '…' : node.text;
    UI.toast(n > 1
      ? 'Deleted \u201C' + name + '\u201D and ' + (n - 1) + ' child node' + (n > 2 ? 's' : '')
      : 'Deleted \u201C' + name + '\u201D', 'info');
  }

  function newMap() {
    var proceed = Promise.resolve(true);
    if (App.dirty) {
      proceed = UI.confirm({
        title: 'Start a new mind map?',
        message: 'Your current map has unsaved changes that will be lost.',
        confirmLabel: 'Create new map'
      });
    }
    proceed.then(function (ok) {
      if (!ok) return;
      App.root = Nodes.createNode('Central topic');
      App.dirty = false;
      App.lastSavedAt = null;
      Canvas.clear();
      Canvas.sync(App.root, { animate: false });
      select(App.root.id);
      Canvas.centerOn(App.root.id);
      updateStatus();
      startEdit(App.root.id);
    });
  }

  function save() {
    var res = Storage.save(Nodes.toFlat(App.root));
    if (!res.ok) { UI.toast('Could not save — storage unavailable', 'error'); return; }
    App.dirty = false;
    App.lastSavedAt = res.savedAt;
    updateStatus();
    UI.toast('Mind map saved', 'success');
  }

  function load() {
    var data = Storage.load();
    if (!data) { UI.toast('No saved mind map found', 'warn'); return; }
    var root;
    try { root = Nodes.fromFlat(data.nodes); }
    catch (err) { UI.toast('Saved map is corrupted', 'error'); return; }

    App.root = root;
    App.dirty = false;
    App.lastSavedAt = data.savedAt || null;
    Canvas.clear();
    Canvas.sync(App.root, { animate: false });
    select(App.root.id);
    Canvas.fit();
    updateStatus();
    UI.toast('Mind map loaded', 'success');
  }

  /* ── inline text editing ── */
  function startEdit(id) {
    if (App.editing) return;
    var rec = Canvas.getRecord(id);
    if (!rec) return;

    App.editing = true;
    var label = rec.label;

    label.contentEditable = 'plaintext-only';
    if (label.contentEditable !== 'plaintext-only') label.contentEditable = 'true';
    rec.card.classList.add('is-editing');
    label.focus();

    var range = document.createRange();
    range.selectNodeContents(label);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    function finish(commit) {
      if (!App.editing) return;
      App.editing = false;
      label.contentEditable = 'false';
      rec.card.classList.remove('is-editing');
      label.removeEventListener('keydown', onKeyEdit);
      label.removeEventListener('blur', onBlur);
      label.removeEventListener('input', onInput);
      label.removeEventListener('paste', onPaste);

      if (commit) {
        var text = label.textContent.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
        if (text) {
          if (rec.node.text !== text) { rec.node.text = text; markDirty(); }
        } else {
          label.textContent = rec.node.text;
        }
      } else {
        label.textContent = rec.node.text;
      }
      Canvas.sync(App.root, { quick: true });
      Canvas.select(App.selectedId);
      updateStatus();
      label.blur();
    }

    function onKeyEdit(e) {
      e.stopPropagation();
      if (e.key === 'Enter') { e.preventDefault(); finish(true); }
      else if (e.key === 'Escape') { e.preventDefault(); finish(false); }
    }
    function onBlur() { finish(true); }
    function onInput() {
      rec.node.text = label.textContent.replace(/\n/g, ' ');
      Canvas.sync(App.root, { quick: true });
    }
    function onPaste(e) {
      e.preventDefault();
      var text = (e.clipboardData || window.clipboardData).getData('text/plain').replace(/\s+/g, ' ');
      document.execCommand('insertText', false, text);
    }

    label.addEventListener('keydown', onKeyEdit);
    label.addEventListener('blur', onBlur);
    label.addEventListener('input', onInput);
    label.addEventListener('paste', onPaste);
  }

  /* ── keyboard shortcuts ── */
  function onKey(e) {
    if (App.editing) return;
    if (UI.isBlocking()) return;
    var ae = document.activeElement;
    if (ae && (ae.isContentEditable || /^(INPUT|TEXTAREA)$/.test(ae.tagName))) return;

    var k = e.key;

    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
      if (k === 's' || k === 'S') { e.preventDefault(); save(); return; }
      if (k === 'o' || k === 'O') { e.preventDefault(); load(); return; }
    }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.repeat) return;

    if (k === 'Enter') { e.preventDefault(); addChild(); }
    else if (k === 'Delete' || k === 'Backspace') { e.preventDefault(); deleteSelected(); }
    else if (k === 'F2') { e.preventDefault(); if (App.selectedId) startEdit(App.selectedId); }
    else if (k === 'Escape') { if (!UI.closePanels()) select(null); }
  }

  /* ── boot ── */
  function boot() {
    UI.init({
      newMap: newMap,
      addChild: addChild,
      deleteSelected: deleteSelected,
      save: save,
      load: load
    });

    Canvas.init({
      viewport: document.getElementById('viewport'),
      world: document.getElementById('world'),
      grid: document.getElementById('grid'),
      edges: document.getElementById('edges'),
      onBackgroundTap: function () { select(null); },
      onNodeTap: function (id) { select(id); },
      onNodeDblTap: function (id) { startEdit(id); }
    });

    // Initial mind map
    App.root = Nodes.createNode('JavaScript');
    App.selectedId = App.root.id;
    App.dirty = false;

    Canvas.sync(App.root, { animate: false });
    Canvas.select(App.selectedId);
    Canvas.centerOn(App.root.id);
    updateStatus();

    window.addEventListener('keydown', onKey);

    if (Storage.load()) {
      UI.toast('A saved mind map is available — press Ctrl+O to load it', 'info');
    }
  }

  document.addEventListener('DOMContentLoaded', boot);
  MM.App = App;
})(window.MM = window.MM || {});