/* canvas.js — infinite viewport: pan, zoom, auto tree layout, SVG edges, tweening */
(function (MM) {
  'use strict';

  var CFG = {
    gapX: 56, gapY: 20,
    minZoom: 0.5, maxZoom: 2,
    grid: 26, gridMajor: 5,
    tweenMs: 340, tweenMsQuick: 140,
    maxFitZoom: 1.15
  };

  var viewport, world, gridEl, edgeSvg;
  var panX = 0, panY = 0, zoom = 1;
  var records = new Map();   // id -> { el, card, label, path, x, y, tx, ty, w, h, ... }
  var animId = null;
  var selectedId = null;
  var cbs = { bgTap: null, nodeTap: null, nodeDblTap: null };

  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function easeInOutCubic(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function reducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /* ── init & events ── */
  function init(opts) {
    viewport = opts.viewport; world = opts.world; gridEl = opts.grid; edgeSvg = opts.edges;
    cbs.bgTap = opts.onBackgroundTap;
    cbs.nodeTap = opts.onNodeTap;
    cbs.nodeDblTap = opts.onNodeDblTap;
    bindPan();
    bindWheel();
    applyView();
  }

  function bindPan() {
    var pan = null;
    viewport.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      if (e.target.closest('.node')) return;
      pan = { x: e.clientX, y: e.clientY, panX: panX, panY: panY, moved: false };
      viewport.setPointerCapture(e.pointerId);
      viewport.classList.add('is-panning');
    });
    viewport.addEventListener('pointermove', function (e) {
      if (!pan) return;
      var dx = e.clientX - pan.x, dy = e.clientY - pan.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) pan.moved = true;
      panX = pan.panX + dx; panY = pan.panY + dy;
      applyView();
    });
    function endPan() {
      if (!pan) return;
      viewport.classList.remove('is-panning');
      var wasTap = !pan.moved;
      pan = null;
      if (wasTap && cbs.bgTap) cbs.bgTap();
    }
    viewport.addEventListener('pointerup', endPan);
    viewport.addEventListener('pointercancel', endPan);
  }

  function bindWheel() {
    viewport.addEventListener('wheel', function (e) {
      e.preventDefault();
      var rect = viewport.getBoundingClientRect();
      var dy = e.deltaY * (e.deltaMode === 1 ? 33 : 1);
      var factor = Math.exp(-dy * (e.ctrlKey ? 0.008 : 0.00125));
      setZoom(zoom * factor, e.clientX - rect.left, e.clientY - rect.top);
    }, { passive: false });
  }

  function bindNodeEvents(rec) {
    rec.el.addEventListener('pointerdown', function (e) {
      e.stopPropagation();
      if (e.button === 0 && cbs.nodeTap) cbs.nodeTap(rec.id);
    });
    rec.el.addEventListener('dblclick', function (e) {
      e.stopPropagation();
      if (cbs.nodeDblTap) cbs.nodeDblTap(rec.id);
    });
    rec.el.addEventListener('pointerenter', function () {
      if (rec.path) rec.path.classList.add('is-hot');
    });
    rec.el.addEventListener('pointerleave', function () {
      if (rec.path) rec.path.classList.remove('is-hot');
    });
  }

  /* ── view transforms ── */
  function applyView() {
    world.style.transform = 'translate(' + panX + 'px,' + panY + 'px) scale(' + zoom + ')';
    var g = CFG.grid * zoom, gm = CFG.grid * CFG.gridMajor * zoom;
    gridEl.style.backgroundSize = g + 'px ' + g + 'px, ' + gm + 'px ' + gm + 'px';
    gridEl.style.backgroundPosition = panX + 'px ' + panY + 'px, ' + panX + 'px ' + panY + 'px';
    if (MM.UI && MM.UI.setZoom) MM.UI.setZoom(zoom);
  }

  function setZoom(z, cx, cy) {
    var nz = clamp(z, CFG.minZoom, CFG.maxZoom);
    if (cx === undefined) { cx = viewport.clientWidth / 2; cy = viewport.clientHeight / 2; }
    var wx = (cx - panX) / zoom, wy = (cy - panY) / zoom;
    zoom = nz;
    panX = cx - wx * zoom; panY = cy - wy * zoom;
    applyView();
  }

  function centerOn(id) {
    var rec = records.get(id);
    if (!rec) return;
    panX = viewport.clientWidth / 2 - (rec.tx + rec.w / 2) * zoom;
    panY = viewport.clientHeight / 2 - (rec.ty + rec.h / 2) * zoom;
    applyView();
  }

  function fit() {
    if (!records.size) return;
    var minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
    records.forEach(function (r) {
      minX = Math.min(minX, r.tx); minY = Math.min(minY, r.ty);
      maxX = Math.max(maxX, r.tx + r.w); maxY = Math.max(maxY, r.ty + r.h);
    });
    var pad = 90;
    var z = Math.min(
      (viewport.clientWidth - pad * 2) / (maxX - minX),
      (viewport.clientHeight - pad * 2) / (maxY - minY)
    );
    zoom = clamp(z, CFG.minZoom, CFG.maxFitZoom);
    panX = viewport.clientWidth / 2 - (minX + maxX) / 2 * zoom;
    panY = viewport.clientHeight / 2 - (minY + maxY) / 2 * zoom;
    applyView();
  }

  /* ── DOM records ── */
  function ensureRecord(node, isRoot) {
    var rec = records.get(node.id);
    if (!rec) {
      var el = document.createElement('div');
      el.className = 'node'; el.dataset.id = node.id;
      var card = document.createElement('div');
      card.className = 'card is-new' + (isRoot ? ' is-root' : '');
      var label = document.createElement('span');
      label.className = 'label'; label.setAttribute('spellcheck', 'false');
      card.appendChild(label); el.appendChild(card);

      rec = {
        id: node.id, el: el, card: card, label: label, path: null,
        x: 0, y: 0, tx: 0, ty: 0, sx: 0, sy: 0, w: 0, h: 0, sh: 0,
        fresh: true, text: '', parentId: null, side: null, isRoot: isRoot
      };

      if (!isRoot) {
        var p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        p.setAttribute('class', 'edge is-drawing');
        p.setAttribute('pathLength', '1');
        edgeSvg.appendChild(p);
        rec.path = p;
      }

      bindNodeEvents(rec);
      world.appendChild(el);
      records.set(node.id, rec);
    }
    // FIX: never rewrite the label while the user is editing it.
    // Assigning textContent collapses the caret to the start of the
    // label, so each new keystroke lands *before* the previous one -
    // producing reversed text like "raqaZ".
    if (rec.text !== node.text && !rec.label.isContentEditable) {
      rec.label.textContent = node.text;
      rec.text = node.text;
    }

    rec.node = node;
    rec.isRoot = isRoot;
    return rec;
  }

  function prune(alive) {
    records.forEach(function (rec, id) {
      if (alive.has(id)) return;
      rec.el.classList.add('is-removing');
      if (rec.path) rec.path.classList.add('is-removing');
      var el = rec.el, path = rec.path;
      setTimeout(function () { el.remove(); if (path) path.remove(); }, 200);
      records.delete(id);
      if (selectedId === id) selectedId = null;
    });
  }

  /* ── layout (root centered, children split left/right) ── */
  function layout(root) {
    records.forEach(function (rec) {
      rec.w = rec.el.offsetWidth;
      rec.h = rec.el.offsetHeight;
    });

    (function subH(n) {
      var rec = records.get(n.id);
      if (!n.children.length) { rec.sh = rec.h; return rec.sh; }
      var sum = 0;
      n.children.forEach(function (c, i) {
        sum += subH(c);
        if (i) sum += CFG.gapY;
      });
      rec.sh = Math.max(rec.h, sum);
      return rec.sh;
    })(root);

    var rootRec = records.get(root.id);
    rootRec.tx = -rootRec.w / 2;
    rootRec.ty = -rootRec.h / 2;

    var kids = root.children;
    var rightCount = Math.ceil(kids.length / 2);
    placeChildren(rootRec, kids.slice(0, rightCount), 'right', 0);
    placeChildren(rootRec, kids.slice(rightCount), 'left', 0);
  }

  function placeChildren(parentRec, children, side, centerY) {
    if (!children.length) return;
    var total = 0;
    children.forEach(function (c, i) {
      total += records.get(c.id).sh;
      if (i) total += CFG.gapY;
    });
    var cursor = centerY - total / 2;
    children.forEach(function (c) {
      var rec = records.get(c.id);
      var mid = cursor + rec.sh / 2;
      rec.tx = side === 'right'
        ? parentRec.tx + parentRec.w + CFG.gapX
        : parentRec.tx - CFG.gapX - rec.w;
      rec.ty = mid - rec.h / 2;
      rec.side = side;
      placeChildren(rec, c.children, side, mid);
      cursor += rec.sh + CFG.gapY;
    });
  }

  /* ── sync model → DOM ── */
  function sync(root, opts) {
    opts = opts || {};
    var animate = opts.animate !== false && !reducedMotion();
    var dur = opts.quick ? CFG.tweenMsQuick : CFG.tweenMs;

    var alive = new Set();
    (function walk(n, isRoot, parentRec) {
      var rec = ensureRecord(n, isRoot);
      rec.parentId = parentRec ? parentRec.id : null;
      alive.add(n.id);
      n.children.forEach(function (c) { walk(c, false, rec); });
    })(root, true, null);

    prune(alive);
    layout(root);

    // Fresh nodes sprout from their parent's current position
    records.forEach(function (rec) {
      if (rec.fresh) {
        var p = rec.parentId ? records.get(rec.parentId) : null;
        if (p) {
          rec.x = p.x + p.w / 2 - rec.w / 2;
          rec.y = p.y + p.h / 2 - rec.h / 2;
        } else {
          rec.x = rec.tx; rec.y = rec.ty;
        }
      }
      rec.sx = rec.x; rec.sy = rec.y;
    });

    if (animate) startTween(dur);
    else {
      records.forEach(function (r) { r.x = r.tx; r.y = r.ty; r.fresh = false; });
      applyFrame();
    }
  }

  function startTween(dur) {
    if (animId) cancelAnimationFrame(animId);
    var t0 = performance.now();
    function step(now) {
      var t = Math.min(1, (now - t0) / dur);
      var e = easeInOutCubic(t);
      records.forEach(function (r) {
        r.x = r.sx + (r.tx - r.sx) * e;
        r.y = r.sy + (r.ty - r.sy) * e;
        if (t === 1) r.fresh = false;
      });
      applyFrame();
      if (t < 1) animId = requestAnimationFrame(step);
      else animId = null;
    }
    animId = requestAnimationFrame(step);
  }

  function applyFrame() {
    records.forEach(function (rec) {
      rec.el.style.transform = 'translate3d(' + rec.x + 'px,' + rec.y + 'px,0)';
      if (rec.path) {
        var p = rec.parentId ? records.get(rec.parentId) : null;
        if (p) rec.path.setAttribute('d', edgePath(p, rec));
      }
    });
  }

  function edgePath(p, c) {
    var right = c.side === 'right';
    var x1 = right ? p.x + p.w : p.x;
    var y1 = p.y + p.h / 2;
    var x2 = right ? c.x : c.x + c.w;
    var y2 = c.y + c.h / 2;
    var mx = (x1 + x2) / 2;
    return 'M ' + x1 + ' ' + y1 + ' C ' + mx + ' ' + y1 + ', ' + mx + ' ' + y2 + ', ' + x2 + ' ' + y2;
  }

  /* ── selection ── */
  function select(id) {
    selectedId = id;
    records.forEach(function (rec, rid) {
      var on = rid === id;
      rec.el.classList.toggle('is-selected', on);
      if (rec.path) rec.path.classList.toggle('is-active', on);
    });
  }

  function clear() {
    if (animId) { cancelAnimationFrame(animId); animId = null; }
    records.forEach(function (rec) {
      rec.el.remove();
      if (rec.path) rec.path.remove();
    });
    records.clear();
    selectedId = null;
  }

  MM.Canvas = {
    init: init,
    sync: sync,
    select: select,
    clear: clear,
    centerOn: centerOn,
    fit: fit,
    zoomBy: function (f) { setZoom(zoom * f); },
    resetZoom: function () { setZoom(1); },
    getZoom: function () { return zoom; },
    getRecord: function (id) { return records.get(id); }
  };
})(window.MM = window.MM || {});