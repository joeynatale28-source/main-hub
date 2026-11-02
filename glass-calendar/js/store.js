/* daylight — Store (js/store.js)
   localStorage-backed data layer. All event writes go through here, and the
   subscribed-calendar read-only rule is enforced HERE (not just in the UI):
   any create/update/delete/move against a subscribed calendar's events is
   refused with { ok:false, error }. The surface is deliberately small and
   synchronous so a server backend can replace it later.

   Stored event record: { id, cal, title, loc, desc, allDay, startMs, endMs,
     rrule (string|null), repeat (simple key|null), exdates: [ms],
     uid (feed events), feedKey (feed events), declined } */
"use strict";
(function (global) {
  var KEY = "daylight-app-v1";
  var idCounter = 1;

  function nextId(prefix) { return (prefix || "id") + "-" + Date.now().toString(36) + "-" + (idCounter++).toString(36) + Math.floor(Math.random() * 1e6).toString(36); }

  function seedData() {
    var data = {
      version: 1,
      calendars: [
        { id: "personal", name: "Personal", color: "blue", hidden: true, subscribed: false, feedUrl: null, source: null, lastSync: null },
        { id: "work", name: "Work", color: "violet", hidden: true, subscribed: false, feedUrl: null, source: null, lastSync: null },
        { id: "life", name: "Life & plans", color: "green", hidden: true, subscribed: false, feedUrl: null, source: null, lastSync: null },
        { id: "holidays", name: "US Holidays", color: "amber", hidden: false, subscribed: true, feedUrl: global.US_HOLIDAYS_FEED_URL, source: "bundled", lastSync: null }
      ],
      events: [],
      tasks: [],
      settings: {
        themeMode: "dark", firstName: "Joey", tzLabel: "EST",
        weekNumbers: false, showDeclined: true, reduceMotion: false,
        defaultView: "month", sidebarRail: false, notify15: true, notifyDaily: false
      },
      ui: { cursorMs: null, selectedMs: null, miniCursorMs: null, miniSelectedMs: null },
      notified: {}, lastDailySummary: null
    };
    // Populate US Holidays from the bundled snapshot, through the real parser.
    var parsed = global.ICAL.parse(global.US_HOLIDAYS_ICS);
    var hol = data.calendars[3];
    parsed.events.forEach(function (rec) { data.events.push(feedRecord(hol.id, rec)); });
    hol.lastSync = Date.now();
    return data;
  }

  function feedRecord(calId, rec) {
    return {
      id: nextId("ev"), cal: calId, title: rec.title, loc: rec.loc || "", desc: rec.desc || "",
      allDay: !!rec.allDay, startMs: rec.startMs, endMs: rec.endMs,
      rrule: rec.rrule || null, repeat: null, exdates: rec.exdates || [],
      uid: rec.uid, feedKey: rec.feedKey, declined: !!rec.declined
    };
  }

  var Store = {
    data: null,

    load: function () {
      var raw = null;
      try { raw = localStorage.getItem(KEY); } catch (e) { /* storage unavailable */ }
      if (raw) {
        try {
          var parsed = JSON.parse(raw);
          if (parsed && parsed.version === 1 && Array.isArray(parsed.calendars) && Array.isArray(parsed.events)) {
            Store.data = parsed;
            return Store.data;
          }
        } catch (e) { /* corrupt: fall through to a fresh seed */ }
      }
      Store.data = seedData();
      Store.save();
      return Store.data;
    },

    save: function () {
      try { localStorage.setItem(KEY, JSON.stringify(Store.data)); } catch (e) { /* quota/blocked: app keeps working in memory */ }
    },

    /* ---------- lookups ---------- */
    calendar: function (id) {
      var cs = Store.data.calendars;
      for (var i = 0; i < cs.length; i++) if (cs[i].id === id) return cs[i];
      return null;
    },
    event: function (id) {
      var es = Store.data.events;
      for (var i = 0; i < es.length; i++) if (es[i].id === id) return es[i];
      return null;
    },
    isSubscribed: function (cal) { return !!(cal && cal.subscribed); },
    isReadOnlyEvent: function (rec) { return Store.isSubscribed(Store.calendar(rec.cal)); },
    writableCalendars: function () { return Store.data.calendars.filter(function (c) { return !c.subscribed; }); },

    /* The one gate every event write passes through. */
    assertWritable: function (calId) {
      var cal = Store.calendar(calId);
      if (!cal) return { ok: false, error: "That calendar no longer exists" };
      if (cal.subscribed) return { ok: false, error: "Subscribed calendars are read-only" };
      return { ok: true };
    },

    /* ---------- events ---------- */
    createEvent: function (fields) {
      var gate = Store.assertWritable(fields.cal);
      if (!gate.ok) return gate;
      var rec = {
        id: nextId("ev"), cal: fields.cal, title: fields.title || "", loc: fields.loc || "", desc: fields.desc || "",
        allDay: !!fields.allDay, startMs: fields.startMs, endMs: fields.endMs,
        rrule: fields.rrule || null, repeat: fields.repeat || null,
        exdates: [], uid: null, feedKey: null, declined: false
      };
      Store.data.events.push(rec);
      Store.save();
      return { ok: true, event: rec };
    },

    updateEvent: function (id, fields) {
      var rec = Store.event(id);
      if (!rec) return { ok: false, error: "That event no longer exists" };
      var gate = Store.assertWritable(rec.cal);
      if (!gate.ok) return gate;
      if (fields.cal && fields.cal !== rec.cal) {
        var gate2 = Store.assertWritable(fields.cal);
        if (!gate2.ok) return gate2;
      }
      ["title", "loc", "desc", "allDay", "startMs", "endMs", "rrule", "repeat", "cal"].forEach(function (k) {
        if (fields[k] !== undefined) rec[k] = fields[k];
      });
      Store.save();
      return { ok: true, event: rec };
    },

    deleteEvent: function (id) {
      var rec = Store.event(id);
      if (!rec) return { ok: false, error: "That event no longer exists" };
      var gate = Store.assertWritable(rec.cal);
      if (!gate.ok) return gate;
      Store.data.events = Store.data.events.filter(function (e) { return e.id !== id; });
      Store.save();
      return { ok: true, event: rec };
    },

    /* ---------- recurring occurrence operations ----------
       scope: "only" | "following" | "all". `fields` (optional) carries the
       edited/moved values for the affected part. */
    _truncateSeries: function (rec, occMs) {
      // End the series just before occMs. Returns false if nothing remains.
      var rule = global.RRule.ruleOf(rec);
      if (!rule) return false;
      var before = global.RRule.countBefore(rec, occMs);
      if (before === 0) return false;
      rule.untilMs = rec.allDay ? occMs - 1 : occMs - 1000;
      rule.count = null;
      rec.rrule = global.RRule.stringify(rule, rec.allDay);
      rec.repeat = null;
      return true;
    },

    deleteOccurrence: function (id, occMs, scope) {
      var rec = Store.event(id);
      if (!rec) return { ok: false, error: "That event no longer exists" };
      var gate = Store.assertWritable(rec.cal);
      if (!gate.ok) return gate;
      if (scope === "all" || !global.RRule.ruleOf(rec)) {
        return Store.deleteEvent(id);
      }
      if (scope === "only") {
        if (rec.exdates.indexOf(occMs) < 0) rec.exdates.push(occMs);
        Store.save();
        return { ok: true };
      }
      // following: truncate; if the occurrence is the first, delete the series
      if (!Store._truncateSeries(rec, occMs)) return Store.deleteEvent(id);
      Store.save();
      return { ok: true };
    },

    /* Edit/move one occurrence. fields = full replacement values (title, loc,
       desc, cal, allDay, startMs, endMs, rrule, repeat) as from the form. */
    updateOccurrence: function (id, occMs, scope, fields) {
      var rec = Store.event(id);
      if (!rec) return { ok: false, error: "That event no longer exists" };
      var gate = Store.assertWritable(rec.cal);
      if (!gate.ok) return gate;
      if (fields.cal) { var g2 = Store.assertWritable(fields.cal); if (!g2.ok) return g2; }
      if (scope === "all" || !global.RRule.ruleOf(rec)) {
        return Store.updateEvent(id, fields);
      }
      if (scope === "only") {
        if (rec.exdates.indexOf(occMs) < 0) rec.exdates.push(occMs);
        // Detached copy: fields override the occurrence's own values;
        // anything omitted keeps the series values, and it never repeats.
        var onlyFields = { title: rec.title, loc: rec.loc, desc: rec.desc, cal: rec.cal, allDay: rec.allDay, startMs: occMs, endMs: occMs + (rec.endMs - rec.startMs), rrule: null, repeat: null };
        Object.keys(fields).forEach(function (k) { if (fields[k] !== undefined) onlyFields[k] = fields[k]; });
        var created = Store.createEvent(onlyFields);
        if (!created.ok) { // roll back the exdate
          rec.exdates = rec.exdates.filter(function (t) { return t !== occMs; });
          Store.save();
          return created;
        }
        Store.save();
        return { ok: true, event: created.event, detached: true };
      }
      // following: split the series at occMs
      var oldRule = global.RRule.ruleOf(rec);
      var idx = global.RRule.countBefore(rec, occMs);
      var remaining = null;
      if (oldRule && oldRule.count != null) remaining = oldRule.count - idx;
      var snapshot = JSON.stringify(rec);
      if (idx > 0 && !Store._truncateSeries(rec, occMs)) {
        // fall through: truncation failed unexpectedly; treat as "all"
        return Store.updateEvent(id, fields);
      }
      if (idx === 0) {
        // Splitting at the first occurrence = replacing the series
        Store.data.events = Store.data.events.filter(function (e) { return e.id !== id; });
      }
      var nf = { title: rec.title, loc: rec.loc, desc: rec.desc, cal: rec.cal, allDay: rec.allDay, startMs: occMs, endMs: occMs + (rec.endMs - rec.startMs) };
      Object.keys(fields).forEach(function (k) { if (fields[k] !== undefined) nf[k] = fields[k]; });
      // If the editor didn't change the repeat rule, carry the old rule over
      // with its remaining count; the form passes rrule only when it built one.
      if (fields.rrule === undefined && fields.repeat === undefined) {
        if (oldRule) {
          var nr = { freq: oldRule.freq, interval: oldRule.interval, byday: oldRule.byday, bymonthday: oldRule.bymonthday, bymonth: oldRule.bymonth, untilMs: oldRule.untilMs, count: remaining };
          nf.rrule = global.RRule.stringify(nr, fields.allDay != null ? fields.allDay : rec.allDay);
          nf.repeat = null;
        }
      }
      var created2 = Store.createEvent(nf);
      if (!created2.ok) {
        // restore the original series record
        var cur = Store.event(id);
        if (cur) { var orig = JSON.parse(snapshot); Object.keys(orig).forEach(function (k) { cur[k] = orig[k]; }); }
        else Store.data.events.push(JSON.parse(snapshot));
        Store.save();
        return created2;
      }
      Store.save();
      return { ok: true, event: created2.event, split: true };
    },

    /* ---------- calendars ---------- */
    createCalendar: function (fields) {
      var cal = {
        id: nextId("cal"), name: fields.name || "Calendar", color: fields.color || "blue",
        hidden: false, subscribed: !!fields.subscribed, feedUrl: fields.feedUrl || null,
        source: fields.source || null, lastSync: fields.lastSync || null
      };
      Store.data.calendars.push(cal);
      Store.save();
      return { ok: true, calendar: cal };
    },
    updateCalendar: function (id, fields) {
      var cal = Store.calendar(id);
      if (!cal) return { ok: false, error: "That calendar no longer exists" };
      ["name", "color", "hidden", "lastSync"].forEach(function (k) { if (fields[k] !== undefined) cal[k] = fields[k]; });
      Store.save();
      return { ok: true, calendar: cal };
    },
    /* Returns a snapshot of what was removed so the UI can offer Undo. */
    deleteCalendar: function (id) {
      var cal = Store.calendar(id);
      if (!cal) return { ok: false, error: "That calendar no longer exists" };
      var removedEvents = Store.data.events.filter(function (e) { return e.cal === id; });
      Store.data.events = Store.data.events.filter(function (e) { return e.cal !== id; });
      Store.data.calendars = Store.data.calendars.filter(function (c) { return c.id !== id; });
      Store.save();
      return { ok: true, snapshot: { calendar: cal, events: removedEvents } };
    },
    restoreCalendar: function (snapshot) {
      if (!snapshot || !snapshot.calendar) return { ok: false };
      if (!Store.calendar(snapshot.calendar.id)) Store.data.calendars.push(snapshot.calendar);
      (snapshot.events || []).forEach(function (e) { if (!Store.event(e.id)) Store.data.events.push(e); });
      Store.save();
      return { ok: true };
    },
    restoreEvent: function (rec) {
      if (rec && !Store.event(rec.id)) { Store.data.events.push(rec); Store.save(); }
      return { ok: true };
    },

    /* ---------- subscriptions ---------- */
    /* Replace a subscribed calendar's feed events with a freshly parsed set,
       deduped by feedKey. Vanished events are removed, changed ones updated. */
    syncFeed: function (calId, parsed, meta) {
      var cal = Store.calendar(calId);
      if (!cal || !cal.subscribed) return { ok: false, error: "Not a subscribed calendar" };
      var incoming = {};
      parsed.events.forEach(function (rec) { incoming[rec.feedKey] = rec; });
      var kept = [];
      Store.data.events.forEach(function (e) {
        if (e.cal !== calId || !e.feedKey) { kept.push(e); return; }
        var inc = incoming[e.feedKey];
        if (!inc) return; // vanished from the feed
        e.title = inc.title; e.loc = inc.loc || ""; e.desc = inc.desc || "";
        e.allDay = !!inc.allDay; e.startMs = inc.startMs; e.endMs = inc.endMs;
        e.rrule = inc.rrule || null; e.exdates = inc.exdates || []; e.declined = !!inc.declined;
        kept.push(e);
        delete incoming[e.feedKey];
      });
      Object.keys(incoming).forEach(function (k) { kept.push(feedRecord(calId, incoming[k])); });
      Store.data.events = kept;
      cal.lastSync = Date.now();
      if (meta && meta.name) cal.name = meta.name;
      Store.save();
      return { ok: true, count: parsed.events.length };
    },
    findFeedByUrl: function (url) {
      var cs = Store.data.calendars;
      for (var i = 0; i < cs.length; i++) if (cs[i].feedUrl && cs[i].feedUrl === url) return cs[i];
      return null;
    },

    /* ---------- tasks ---------- */
    createTask: function (fields) {
      var t = { id: nextId("task"), title: fields.title || "", done: false, dueMs: fields.dueMs || null, cal: fields.cal || null };
      Store.data.tasks.push(t);
      Store.save();
      return { ok: true, task: t };
    },
    updateTask: function (id, fields) {
      var t = null;
      Store.data.tasks.forEach(function (x) { if (x.id === id) t = x; });
      if (!t) return { ok: false, error: "That task no longer exists" };
      ["title", "done", "dueMs", "cal"].forEach(function (k) { if (fields[k] !== undefined) t[k] = fields[k]; });
      Store.save();
      return { ok: true, task: t };
    },
    deleteTask: function (id) {
      Store.data.tasks = Store.data.tasks.filter(function (t) { return t.id !== id; });
      Store.save();
      return { ok: true };
    },

    /* ---------- settings / ui / misc ---------- */
    setSettings: function (patchObj) {
      Object.keys(patchObj).forEach(function (k) { Store.data.settings[k] = patchObj[k]; });
      Store.save();
    },
    setUi: function (patchObj) {
      Object.keys(patchObj).forEach(function (k) { Store.data.ui[k] = patchObj[k]; });
      Store.save();
    },
    exportJSON: function () {
      return JSON.stringify(Store.data, null, 2);
    },
    importJSON: function (text) {
      try {
        var parsed = JSON.parse(text);
        if (!parsed || !Array.isArray(parsed.calendars) || !Array.isArray(parsed.events) || !parsed.settings) {
          return { ok: false, error: "That file is not a daylight backup" };
        }
        parsed.version = 1;
        if (!Array.isArray(parsed.tasks)) parsed.tasks = [];
        if (!parsed.ui) parsed.ui = { cursorMs: null, selectedMs: null, miniCursorMs: null, miniSelectedMs: null };
        if (!parsed.notified) parsed.notified = {};
        Store.data = parsed;
        Store.save();
        return { ok: true };
      } catch (e) {
        return { ok: false, error: "That file could not be read as JSON" };
      }
    }
  };

  global.DaylightStore = Store;
})(window);
