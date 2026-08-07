/* storage.js — JSON persistence in LocalStorage */
(function (MM) {
  'use strict';

  var KEY = 'mind-map-editor:map:v1';

  var Storage = {
    KEY: KEY,

    /** Save a flat node list. Returns { ok, savedAt? } */
    save: function (nodes) {
      var payload = { app: 'mind-map-editor', version: 1, savedAt: Date.now(), nodes: nodes };
      try {
        localStorage.setItem(KEY, JSON.stringify(payload));
        return { ok: true, savedAt: payload.savedAt };
      } catch (err) {
        return { ok: false, error: err };
      }
    },

    /** Load the most recently saved map. Returns payload or null. */
    load: function () {
      try {
        var raw = localStorage.getItem(KEY);
        if (!raw) return null;
        var data = JSON.parse(raw);
        if (!data || !Array.isArray(data.nodes) || data.nodes.length === 0) return null;
        return data;
      } catch (err) {
        return null;
      }
    }
  };

  MM.Storage = Storage;
})(window.MM = window.MM || {});