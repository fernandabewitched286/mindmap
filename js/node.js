/* node.js — mind map data model (tree of { id, text, children }) */
(function (MM) {
  'use strict';

  function uid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'n-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  function createNode(text) {
    return { id: uid(), text: String(text == null ? '' : text), children: [] };
  }

  function createNodeWithId(id, text) {
    return { id: id, text: String(text == null ? '' : text), children: [] };
  }

  /** Serialize tree → flat list (DFS pre-order, root first). */
  function toFlat(root) {
    var out = [];
    (function walk(n, parentId) {
      out.push({ id: n.id, text: n.text, parent: parentId });
      for (var i = 0; i < n.children.length; i++) walk(n.children[i], n.id);
    })(root, null);
    return out;
  }

  /** Rebuild tree from flat list. Throws on invalid data. */
  function fromFlat(nodes) {
    var map = new Map();
    nodes.forEach(function (n) {
      if (!n || !n.id) throw new Error('Invalid node entry');
      map.set(n.id, createNodeWithId(n.id, n.text));
    });
    var root = null;
    nodes.forEach(function (n) {
      var node = map.get(n.id);
      if (n.parent == null) {
        if (!root) root = node;
      } else {
        var parent = map.get(n.parent);
        if (!parent) throw new Error('Orphan node: ' + n.id);
        parent.children.push(node);
      }
    });
    if (!root) throw new Error('No root node found');
    return root;
  }

  function find(root, id) {
    if (root.id === id) return root;
    for (var i = 0; i < root.children.length; i++) {
      var hit = find(root.children[i], id);
      if (hit) return hit;
    }
    return null;
  }

  function findParent(root, id) {
    for (var i = 0; i < root.children.length; i++) {
      if (root.children[i].id === id) return root;
      var hit = findParent(root.children[i], id);
      if (hit) return hit;
    }
    return null;
  }

  function count(node) {
    var total = 1;
    for (var i = 0; i < node.children.length; i++) total += count(node.children[i]);
    return total;
  }

  function collectIds(node, out) {
    out = out || [];
    out.push(node.id);
    node.children.forEach(function (c) { collectIds(c, out); });
    return out;
  }

  MM.Nodes = {
    createNode: createNode,
    toFlat: toFlat,
    fromFlat: fromFlat,
    find: find,
    findParent: findParent,
    count: count,
    collectIds: collectIds
  };
})(window.MM = window.MM || {});