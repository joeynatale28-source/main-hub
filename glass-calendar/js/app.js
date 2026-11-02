      "use strict";
      /* ================= Icons (inline SVG, Lucide-style) ================= */
      var ICONS = {
        calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
        calendarPlus: '<path d="M16 19h6"/><path d="M19 16v6"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M11 10H3"/><path d="M17.5 22H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v7.34"/>',
        search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
        settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
        help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
        lifebuoy: '<circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24"/><path d="m14.83 9.17 4.24-4.24"/><path d="m14.83 14.83 4.24 4.24"/><path d="m9.17 14.83-4.24 4.24"/><circle cx="12" cy="12" r="4"/>',
        plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
        chevL: '<path d="m15 18-6-6 6-6"/>',
        chevR: '<path d="m9 18 6-6-6-6"/>',
        chevD: '<path d="m6 9 6 6 6-6"/>',
        chevU: '<path d="m18 15-6-6-6 6"/>',
        x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
        check: '<path d="M20 6 9 17l-5-5"/>',
        clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
        pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
        repeat: '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
        pencil: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>',
        trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/>',
        dotsV: '<circle cx="12" cy="5" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1.6" fill="currentColor" stroke="none"/>',
        eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
        eyeOff: '<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a13.2 13.2 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.5 13.5 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.39-1.61"/><path d="m2 2 20 20"/>',
        bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
        sunrise: '<path d="M17 18a5 5 0 0 0-10 0"/><path d="M12 9V2"/><path d="M4.22 10.22l1.42 1.42"/><path d="M1 18h2"/><path d="M21 18h2"/><path d="M18.36 11.64l1.42-1.42"/><path d="M23 22H1"/><path d="m8 6 4-4 4 4"/>',
        sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
        moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
        monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/>',
        arrowL: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
        sliders: '<path d="M21 4h-7"/><path d="M10 4H3"/><path d="M21 12h-9"/><path d="M8 12H3"/><path d="M21 20h-5"/><path d="M12 20H3"/><circle cx="12" cy="4" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="14" cy="20" r="2"/>',
        droplet: '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/>',
        sync: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
        cpu: '<rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M9 2v2"/><path d="M9 20v2"/><path d="M20 9h2"/><path d="M20 14h2"/><path d="M2 9h2"/><path d="M2 14h2"/>',
        info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
        key: '<circle cx="8" cy="16" r="4.5"/><path d="M11.3 12.7 20 4"/><path d="m15.5 6.5 3 3"/>',
        collapse: '<path d="m11 17-5-5 5-5"/><path d="m18 17-5-5 5-5"/>',
        expand: '<path d="m6 17 5-5-5-5"/><path d="m13 17 5-5-5-5"/>',
        download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><path d="M12 15V3"/>',
        palette: '<circle cx="12" cy="12" r="9"/><circle cx="8" cy="10" r="1" fill="currentColor"/><circle cx="12" cy="7.5" r="1" fill="currentColor"/><circle cx="16" cy="10" r="1" fill="currentColor"/><path d="M12 21a2.5 2.5 0 0 0 2.5-2.5c0-.8-.4-1.4-1-1.9-.5-.5-1-1-1-1.6"/>',
        list: '<path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/>',
        menu: '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>',
        alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
        lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
        alignLeft: '<path d="M15 6H3"/><path d="M21 12H3"/><path d="M17 18H3"/>'
      };
      function icon(name, size) {
        size = size || 18;
        return '<svg class="ic" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || "") + "</svg>";
      }
      function esc(s) {
        return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
          return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
        });
      }
      function el(html) { var d = document.createElement("div"); d.innerHTML = html; return d.firstElementChild; }

      /* ================= Palette & data ================= */
      var PALETTE = {
        blue:   { dot: "#5b8def", dark: "#232f47", light: "#e2ebfd", darkText: "#b9cff9", lightText: "#2c4a7c" },
        violet: { dot: "#9a7ff0", dark: "#2c2542", light: "#ece7fb", darkText: "#c9bdf6", lightText: "#513f8f" },
        green:  { dot: "#43b581", dark: "#1e352e", light: "#dff2e7", darkText: "#a5dcc4", lightText: "#206045" },
        amber:  { dot: "#e3a93d", dark: "#372b1c", light: "#faf0d7", darkText: "#eec987", lightText: "#7a5a17" },
        rose:   { dot: "#e5646e", dark: "#38222a", light: "#fbe7ea", darkText: "#f2b3ba", lightText: "#8c3038" },
        teal:   { dot: "#3fb6b2", dark: "#1d3232", light: "#dff3f2", darkText: "#a3dcd9", lightText: "#1d5f5c" },
        plum:   { dot: "#c65d8f", dark: "#38222e", light: "#fae6f1", darkText: "#eda9c9", lightText: "#83355f" },
        gray:   { dot: "#8a8f98", dark: "#26282c", light: "#eceef1", darkText: "#c3c8cf", lightText: "#4b5058" }
      };
      var SWATCH_ORDER = ["blue", "violet", "green", "amber", "rose", "teal", "plum", "gray"];
      var REPEAT_LABELS = { daily: "Repeats daily", weekly: "Repeats weekly", monthly: "Repeats monthly", yearly: "Repeats yearly", custom: "Repeats · custom" };

      /* ================= Store-backed state =================
         The runtime working copy mirrors the preview's shape (events hold
         Date objects), but the source of truth is DaylightStore
         (localStorage). Data mutations go through Store methods, then
         syncFromStore() rebuilds the runtime copies. Lightweight sidebar /
         settings interactions mutate runtime fields and are mirrored back
         by persistLocal() (wired to the render entry points at the bottom). */
      var Store = window.DaylightStore;
      Store.load();
      var uid = 100;
      function mkEv(title, cal, start, end, opts) {
        opts = opts || {};
        if (opts.allDay) { end = new Date(end); end.setHours(23, 59); }
        return { id: "ev-local-" + (++uid), title: title, cal: cal, start: start, end: end,
          allDay: !!opts.allDay, loc: opts.loc || "", desc: opts.desc || "",
          repeat: opts.repeat || null, rrule: opts.rrule || null, exdates: opts.exdates || [],
          declined: !!opts.declined };
      }
      function dt(y, m, d, h, mi) { return new Date(y, m, d, h || 0, mi || 0); }
      function runtimeEvent(rec) {
        return { id: rec.id, title: rec.title, cal: rec.cal, loc: rec.loc || "", desc: rec.desc || "",
          allDay: !!rec.allDay, start: new Date(rec.startMs), end: new Date(rec.endMs),
          repeat: rec.repeat || null, rrule: rec.rrule || null, exdates: (rec.exdates || []).slice(),
          declined: !!rec.declined };
      }
      function buildState() {
        var d = Store.data, s = d.settings, u = d.ui;
        var today = sod(new Date());
        var st = {
          view: s.defaultView || "month",
          prevView: null,
          cursor: u.cursorMs ? new Date(u.cursorMs) : today,
          selected: u.selectedMs ? new Date(u.selectedMs) : today,
          miniCursor: u.miniCursorMs ? new Date(u.miniCursorMs) : new Date(today.getFullYear(), today.getMonth(), 1),
          miniSelected: u.miniSelectedMs ? new Date(u.miniSelectedMs) : today,
          themeMode: s.themeMode, firstName: s.firstName, tzLabel: s.tzLabel,
          weekNumbers: !!s.weekNumbers, showDeclined: s.showDeclined !== false, reduceMotion: !!s.reduceMotion,
          sidebarRail: !!s.sidebarRail,
          calendars: [], events: [], feeds: [],
          tasksView: false, taskFilter: "all"
        };
        syncInto(st);
        return st;
      }
      function syncInto(st) {
        var d = Store.data;
        st.calendars = d.calendars.map(function (c) {
          return { id: c.id, name: c.name, color: c.color, hidden: !!c.hidden, subscribed: !!c.subscribed };
        });
        st.events = d.events.map(runtimeEvent);
        st.feeds = d.calendars.filter(function (c) { return c.subscribed; }).map(function (c) {
          return { url: c.feedUrl || "", name: c.name, calId: c.id, lastSync: c.lastSync, source: c.source };
        });
      }
      var state = buildState();
      function syncFromStore() { syncInto(state); }
      /* Mirror runtime-owned fields (calendar name/color/visibility, settings
         shown in state, navigation cursor) into the Store and save. Event
         records are NOT touched here — they only change via Store methods. */
      function persistLocal() {
        var d = Store.data, s = d.settings;
        s.themeMode = state.themeMode; s.firstName = state.firstName; s.tzLabel = state.tzLabel;
        s.weekNumbers = state.weekNumbers; s.showDeclined = state.showDeclined;
        s.reduceMotion = state.reduceMotion; s.sidebarRail = state.sidebarRail;
        d.ui.cursorMs = state.cursor.getTime(); d.ui.selectedMs = state.selected.getTime();
        d.ui.miniCursorMs = state.miniCursor.getTime(); d.ui.miniSelectedMs = state.miniSelected.getTime();
        state.calendars.forEach(function (c) {
          var rec = Store.calendar(c.id);
          if (rec) { rec.name = c.name; rec.color = c.color; rec.hidden = !!c.hidden; }
        });
        Store.save();
      }

      /* ================= Date utils ================= */
      var TODAY = sod(new Date());
      var MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
      var MONTHS_S = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      var DOWS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
      var DOWS_S = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
      var DAY_MS = 86400000;
      function sod(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
      function addDays(d, n) { var x = sod(d); x.setDate(x.getDate() + n); return x; }
      function addMonths(d, n) { return new Date(d.getFullYear(), d.getMonth() + n, 1); }
      function sameDay(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
      function sundayOf(d) { return addDays(d, -sod(d).getDay()); }
      function pad2(n) { return (n < 10 ? "0" : "") + n; }
      function fmtTime(d) {
        var h = d.getHours(), m = d.getMinutes(), ap = h >= 12 ? "pm" : "am";
        var hh = h % 12; if (hh === 0) hh = 12;
        return hh + ":" + pad2(m) + ap;
      }
      function fmtTimeRange(a, b) { return fmtTime(a) + " - " + fmtTime(b); }
      function fmtHourLabel(h) {
        if (h === 0) return "12 AM"; if (h === 12) return "12 PM";
        return (h < 12 ? h + " AM" : (h - 12) + " PM");
      }
      function fmtDateLong(d) { return DOWS[d.getDay()] + ", " + MONTHS[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear(); }
      function fmtDateShort(d) { return MONTHS_S[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear(); }
      function isoWeek(d) {
        var x = sod(d); x.setDate(x.getDate() + 3 - ((x.getDay() + 6) % 7));
        var first = new Date(x.getFullYear(), 0, 4);
        first.setDate(first.getDate() + 3 - ((first.getDay() + 6) % 7));
        return 1 + Math.round(((x - first) / DAY_MS) / 7);
      }
      function calOf(id) { for (var i = 0; i < state.calendars.length; i++) if (state.calendars[i].id === id) return state.calendars[i]; return state.calendars[0]; }
      function isSubscribed(cal) { return !!(cal && cal.subscribed); }
      function isReadOnlyEvent(ev) { return isSubscribed(calOf(ev.cal)); }
      function writableCalendars() { return state.calendars.filter(function (c) { return !c.subscribed; }); }
      function defaultCalId() { var w = writableCalendars(); return w.length ? w[0].id : state.calendars[0].id; }
      function checkColorFor(colorKey) { return colorKey === "amber" ? "#1c1a12" : "#ffffff"; }
      function fmtGoogleWhen(occ) {
        var ev = occ.ev;
        var startDay = DOWS[occ.start.getDay()] + ", " + MONTHS[occ.start.getMonth()] + " " + occ.start.getDate();
        var endDay = DOWS[sod(occ.end).getDay()] + ", " + MONTHS[sod(occ.end).getMonth()] + " " + sod(occ.end).getDate();
        if (ev.allDay) {
          if (sameDay(sod(occ.start), sod(occ.end))) return startDay;
          return startDay + " – " + endDay;
        }
        if (sameDay(occ.start, occ.end)) return startDay + " · " + fmtTime(occ.start) + " – " + fmtTime(occ.end);
        return startDay + " · " + fmtTime(occ.start) + " – " + endDay + " · " + fmtTime(occ.end);
      }
      function fmtDuration(occ) {
        var ev = occ.ev;
        if (ev.allDay) {
          var days = Math.round((sod(occ.end) - sod(occ.start)) / DAY_MS) + 1;
          return days <= 1 ? "All day" : days + " days · All day";
        }
        var mins = Math.round((occ.end - occ.start) / 60000);
        if (mins <= 0) return "";
        if (mins < 60) return mins + (mins === 1 ? " minute" : " minutes");
        var h = Math.floor(mins / 60), m = mins % 60;
        var hs = h + (h === 1 ? " hour" : " hours");
        return m ? hs + " " + m + (m === 1 ? " minute" : " minutes") : hs;
      }
      function fmtRelativeDay(d) {
        var diff = Math.round((sod(d) - sod(TODAY)) / DAY_MS);
        if (diff === 0) return "Today";
        if (diff === 1) return "Tomorrow";
        if (diff === -1) return "Yesterday";
        if (diff > 1 && diff < 7) return "In " + diff + " days";
        if (diff < -1 && diff > -7) return Math.abs(diff) + " days ago";
        return "";
      }
      function fmtPopDate(occ) {
        var ev = occ.ev;
        var s = DOWS[occ.start.getDay()] + ", " + MONTHS[occ.start.getMonth()] + " " + occ.start.getDate() + ", " + occ.start.getFullYear();
        if (ev.allDay && !sameDay(sod(occ.start), sod(occ.end))) {
          s += " – " + DOWS[sod(occ.end).getDay()] + ", " + MONTHS[sod(occ.end).getMonth()] + " " + sod(occ.end).getDate() + ", " + sod(occ.end).getFullYear();
        } else if (!ev.allDay && !sameDay(occ.start, occ.end)) {
          s += " – " + DOWS[sod(occ.end).getDay()] + ", " + MONTHS[sod(occ.end).getMonth()] + " " + sod(occ.end).getDate() + ", " + sod(occ.end).getFullYear();
        }
        return s;
      }
      function effectiveTheme() {
        if (state.themeMode === "system") return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
        return state.themeMode;
      }
      function tintOf(cal) { var p = PALETTE[cal.color] || PALETTE.blue; return effectiveTheme() === "light" ? p.light : p.dark; }
      function tintTextOf(cal) { var p = PALETTE[cal.color] || PALETTE.blue; return effectiveTheme() === "light" ? p.lightText : p.darkText; }
      function dotOf(cal) { return (PALETTE[cal.color] || PALETTE.blue).dot; }

      /* Occurrences of an event overlapping [rs, re) — full RRULE engine
         (js/rrule.js): intervals, BYDAY, UNTIL/COUNT, exdates. */
      function occurrences(ev, rs, re) { return RRule.expand(ev, rs, re); }
      function hasRepeat(ev) { return !!(ev && (ev.rrule || ev.repeat)); }
      function repeatLabelOf(ev) {
        if (!ev) return "";
        if (ev.rrule) return RRule.describe(ev);
        return ev.repeat ? (REPEAT_LABELS[ev.repeat] || "Repeats") : "";
      }
      function visibleEvents() {
        return state.events.filter(function (ev) {
          var c = calOf(ev.cal); if (!c || c.hidden) return false;
          if (ev.declined && !state.showDeclined) return false;
          return true;
        });
      }
      function occsInRange(rs, re) {
        var out = [];
        visibleEvents().forEach(function (ev) { occurrences(ev, rs, re).forEach(function (o) { out.push(o); }); });
        return out;
      }
      function daysWithEventsInMonth(y, m) {
        var rs = new Date(y, m, 1), re = new Date(y, m + 1, 1);
        var set = {};
        occsInRange(rs, re).forEach(function (o) {
          var d = sod(o.start), last = sod(o.end);
          if (o.ev.allDay) { var x = new Date(d); while (x <= last) { if (x.getMonth() === m) set[x.getDate()] = true; x = addDays(x, 1); } }
          else if (d.getMonth() === m) set[d.getDate()] = true;
        });
        return set;
      }

      /* ================= Toasts ================= */
      function toast(msg, action) {
        var root = document.getElementById("toastRoot");
        var t = el('<div class="toast"><span>' + esc(msg) + "</span></div>");
        if (action) {
          var a = el('<button class="t-action">' + esc(action.label) + "</button>");
          a.addEventListener("click", function () { action.fn(); dismiss(); });
          t.appendChild(a);
        }
        var c = el('<button class="t-close" aria-label="Dismiss">' + icon("x", 14) + "</button>");
        c.addEventListener("click", dismiss);
        t.appendChild(c);
        root.appendChild(t);
        var timer = setTimeout(dismiss, 4200);
        function dismiss() { clearTimeout(timer); t.classList.add("out"); setTimeout(function () { t.remove(); }, 220); }
      }

      /* ================= Export UI code ================= */
      var COLOR_NAMES = { blue: "Blue", violet: "Violet", green: "Green", amber: "Amber", rose: "Rose", teal: "Teal", plum: "Plum", gray: "Gray" };
      function exportCode() {
        try {
          var clone = document.documentElement.cloneNode(true);
          ["sidebar", "greeting", "headerBand", "viewWrap", "overlayRoot", "toastRoot"].forEach(function (id) {
            var n = clone.querySelector("#" + id); if (n) n.innerHTML = "";
          });
          clone.querySelectorAll(".menu, .popover, .date-pop, #paletteBd, #drawerBackdrop").forEach(function (n) { n.remove(); });
          var sbClone = clone.querySelector("#sidebar"); if (sbClone) sbClone.classList.remove("drawer-open");
          var body = clone.querySelector("body"); if (body) body.removeAttribute("class");
          clone.setAttribute("data-theme", effectiveTheme());
          var html = "<!doctype html>\n" + clone.outerHTML;
          var blob = new Blob([html], { type: "text/html;charset=utf-8" });
          var url = URL.createObjectURL(blob);
          var a = document.createElement("a");
          a.href = url; a.download = "daylight-calendar-ui.html";
          document.body.appendChild(a); a.click(); a.remove();
          setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
          toast("UI code exported — check your downloads");
        } catch (err) { toast("Export failed in this browser"); }
      }
      var paletteCloseFn = null;
      function closeTopmostOverlay() {
        if (document.getElementById("datePop")) { closeDatePicker(); return true; }
        if (openMenuEl) { closeMenu(); return true; }
        if (paletteCloseFn) { paletteCloseFn(); return true; }
        if (overlayRoot.children.length) {
          var top = overlayRoot.children[overlayRoot.children.length - 1];
          var dlg = top.querySelector(".dialog, .settings-dialog") || top;
          var btn = dlg.querySelector("[data-x]") || top.querySelector(".settings-close") || dlg.querySelector("[data-cancel]");
          if (btn) { btn.click(); return true; }
          top.remove(); return true;
        }
        if (popEl) { closePopover(); return true; }
        return false;
      }

      /* ================= Menus ================= */
      var openMenuEl = null;
      function closeMenu() { if (openMenuEl) { openMenuEl.remove(); openMenuEl = null; document.removeEventListener("mousedown", menuOutside, true); } }
      function menuOutside(e) { if (openMenuEl && !openMenuEl.contains(e.target)) closeMenu(); }
      function openMenu(anchor, items, opts) {
        opts = opts || {};
        closeMenu(); closePopover();
        var m = el('<div class="menu" role="menu"></div>');
        items.forEach(function (it) {
          if (it.sep) { m.appendChild(el('<div class="menu-sep"></div>')); return; }
          if (it.label2) { m.appendChild(el('<div class="menu-label">' + esc(it.label2) + "</div>")); return; }
          var b = el('<button class="menu-item' + (it.danger ? " danger" : "") + '">' + (it.icon ? icon(it.icon, 16) : "") + "<span>" + esc(it.label) + "</span>" + (it.right ? '<span class="mi-right">' + icon(it.right, 15) + "</span>" : "") + "</button>");
          b.addEventListener("click", function () { closeMenu(); it.fn && it.fn(); });
          m.appendChild(b);
        });
        document.body.appendChild(m);
        var r = anchor.getBoundingClientRect();
        var mw = 220, mh = m.offsetHeight;
        var left = opts.align === "right" ? r.right - mw : r.left;
        left = Math.max(8, Math.min(left, window.innerWidth - mw - 8));
        var top = r.bottom + 6;
        if (top + mh > window.innerHeight - 8) top = Math.max(8, r.top - mh - 6);
        m.style.left = left + "px"; m.style.top = top + "px";
        openMenuEl = m;
        document.addEventListener("mousedown", menuOutside, true);
        return m;
      }

      /* ================= Sidebar ================= */
      var sidebarEl = document.getElementById("sidebar");
      var drawerBackdropEl = null;
      function openDrawer() {
        if (window.innerWidth >= 640) return;
        if (state.sidebarRail) { state.sidebarRail = false; renderSidebar(); renderHeader(); }
        sidebarEl.classList.add("drawer-open");
        if (!drawerBackdropEl) {
          drawerBackdropEl = el('<div id="drawerBackdrop"></div>');
          drawerBackdropEl.addEventListener("mousedown", function () { closeDrawer(); });
          document.body.appendChild(drawerBackdropEl);
        }
      }
      function closeDrawer() {
        sidebarEl.classList.remove("drawer-open");
        if (drawerBackdropEl) { drawerBackdropEl.remove(); drawerBackdropEl = null; }
      }
      function isDrawerOpen() { return sidebarEl.classList.contains("drawer-open"); }
      window.addEventListener("resize", function () { if (window.innerWidth >= 640 && isDrawerOpen()) closeDrawer(); });
      function renderSidebar() {
        sidebarEl.classList.toggle("rail", state.sidebarRail);
        sidebarEl.innerHTML = "";
        var brand = el(
          '<div class="brand-row">' +
            '<div class="logo-tile">' + icon("sunrise", 21) + "</div>" +
            '<div class="rail-hide"><div class="brand-name">daylight.</div><div class="brand-sub">Personal calendar</div></div>' +
            '<button class="icon-btn" id="collapseBtn" title="' + (state.sidebarRail ? "Expand sidebar" : "Collapse sidebar") + '">' + icon(state.sidebarRail ? "expand" : "collapse", 17) + "</button>" +
          "</div>"
        );
        brand.querySelector("#collapseBtn").addEventListener("click", function () {
          state.sidebarRail = !state.sidebarRail; renderSidebar();
        });
        sidebarEl.appendChild(brand);
        var addEvBtn;
        if (state.sidebarRail) {
          addEvBtn = el('<button class="btn-primary sidebar-add-rail" title="Add Event" aria-label="Add Event">' + icon("plus", 22) + "</button>");
        } else {
          addEvBtn = el('<button class="btn-primary sidebar-add">' + icon("plus", 22) + '<span class="bp-label">Add Event</span></button>');
        }
        addEvBtn.addEventListener("click", function () { closeDrawer(); openEventForm(null, state.selected); });
        sidebarEl.appendChild(addEvBtn);
        if (!state.sidebarRail) sidebarEl.appendChild(renderMiniCal());
        var label = el('<div class="side-label rail-hide"><span>My calendars</span></div>');
        var addBtn = el('<button class="mini-nav" title="New calendar">' + icon("plus", 13) + "</button>");
        addBtn.addEventListener("click", openNewCalendar);
        label.appendChild(addBtn);
        sidebarEl.appendChild(label);
        var list = el('<div id="calList"></div>');
        state.calendars.forEach(function (cal) { list.appendChild(calRow(cal)); });
        sidebarEl.appendChild(list);
        sidebarEl.appendChild(el('<div class="side-spacer"></div>'));
        if (!state.sidebarRail) sidebarEl.appendChild(el('<div class="side-label rail-hide"><span>Support</span></div>'));
        var help = el('<button class="side-row" title="Help center">' + icon("lifebuoy", 18) + '<span class="rail-hide">Help center</span></button>');
        help.addEventListener("click", function () { closeDrawer(); openHelp(); });
        var set = el('<button class="side-row" title="Settings">' + icon("settings", 18) + '<span class="rail-hide">Settings</span></button>');
        set.addEventListener("click", function () { closeDrawer(); openSettings("general"); });
        var exp = el('<button class="side-row" title="Download this UI as a single HTML file">' + icon("download", 18) + '<span class="rail-hide">Export UI code</span></button>');
        exp.addEventListener("click", function () { closeDrawer(); exportCode(); });
        sidebarEl.appendChild(help); sidebarEl.appendChild(set); sidebarEl.appendChild(exp);
        var pw = el(
          '<div class="profile-wrap"><button class="profile-row" title="Account">' +
            '<span class="avatar">JN</span>' +
            '<span class="rail-hide" style="min-width:0"><span class="profile-name">Joey Natale</span><br><span class="profile-email">joeynatale28@gmail.com</span></span>' +
            '<span class="icon-btn rail-hide" style="pointer-events:none">' + icon("dotsV", 17) + "</span>" +
          "</button></div>"
        );
        pw.querySelector(".profile-row").addEventListener("click", function (e) {
          openMenu(e.currentTarget, [
            { icon: "settings", label: "Settings", fn: function () { openSettings("general"); } },
            { icon: "download", label: "Export UI code", fn: exportCode },
            { icon: effectiveTheme() === "dark" ? "sun" : "moon", label: effectiveTheme() === "dark" ? "Light theme" : "Dark theme", fn: function () { state.themeMode = effectiveTheme() === "dark" ? "light" : "dark"; applyTheme(); renderAll(false); } },
            { icon: "lifebuoy", label: "Help center", fn: openHelp }
          ], { align: "right" });
        });
        sidebarEl.appendChild(pw);
      }
      function calRow(cal) {
        var row = el('<div class="cal-row"></div>');
        var checkSvg = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="' + checkColorFor(cal.color) + '" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
        var dot = el('<button class="cal-check' + (cal.hidden ? " off" : "") + '" title="' + (cal.hidden ? "Show " : "Hide ") + esc(cal.name) + '" aria-label="' + (cal.hidden ? "Show " : "Hide ") + esc(cal.name) + '" aria-pressed="' + (!cal.hidden) + '" style="background:' + dotOf(cal) + '">' + checkSvg + "</button>");
        dot.addEventListener("click", function () { cal.hidden = !cal.hidden; renderSidebar(); renderView(false); });
        row.appendChild(dot);
        var name = el('<span class="cal-name' + (cal.hidden ? " off" : "") + '">' + esc(cal.name) + "</span>");
        row.appendChild(name);
        if (cal.subscribed) row.appendChild(el('<span class="cal-badge" title="Subscribed calendar" aria-label="Subscribed calendar" role="img">' + icon("lock", 12) + "</span>"));
        var mb = el('<button class="icon-btn cal-menu-btn" title="Calendar options — rename, color, show or hide, delete" aria-label="Options for ' + esc(cal.name) + '">' + icon("dotsV", 16) + "</button>");
        mb.addEventListener("click", function () { openCalMenu(mb, cal, row); });
        row.appendChild(mb);
        return row;
      }
      function openCalMenu(anchor, cal, row) {
        closeMenu(); closePopover();
        var m = el('<div class="menu" role="menu" aria-label="Calendar options"></div>');
        function item(iconName, label, danger, fn) {
          var b = el('<button class="menu-item' + (danger ? " danger" : "") + '">' + icon(iconName, 16) + "<span>" + esc(label) + "</span></button>");
          b.addEventListener("click", function () { closeMenu(); fn(); });
          return b;
        }
        m.appendChild(item("pencil", "Rename", false, function () { startRename(row, cal); }));
        m.appendChild(item(cal.hidden ? "eye" : "eyeOff", cal.hidden ? "Show calendar" : "Hide calendar", false, function () { cal.hidden = !cal.hidden; renderSidebar(); renderView(false); }));
        if (cal.subscribed) m.appendChild(el('<div class="menu-current">' + icon("lock", 13) + "<span>Subscribed — events are read-only</span></div>"));
        m.appendChild(el('<div class="menu-sep"></div>'));
        m.appendChild(el('<div class="menu-label">Appearance · Color</div>'));
        var cur = el('<div class="menu-current"><span class="pop-dot" style="background:' + dotOf(cal) + ';margin:0"></span><span>Current: ' + esc(COLOR_NAMES[cal.color] || cal.color) + "</span></div>");
        m.appendChild(cur);
        var swWrap = el('<div class="menu-swatches"></div>');
        SWATCH_ORDER.forEach(function (k) {
          var b = el('<button class="swatch' + (cal.color === k ? " sel" : "") + '" style="background:' + PALETTE[k].dot + '" title="' + esc(COLOR_NAMES[k]) + '" aria-label="Set color to ' + esc(COLOR_NAMES[k]) + '"></button>');
          b.addEventListener("click", function () {
            cal.color = k;
            swWrap.querySelectorAll(".swatch").forEach(function (s) { s.classList.remove("sel"); });
            b.classList.add("sel");
            cur.querySelector(".pop-dot").style.background = PALETTE[k].dot;
            cur.querySelector("span:last-child").textContent = "Current: " + COLOR_NAMES[k];
            renderSidebar(); renderView(false);
            toast("Calendar color updated");
          });
          swWrap.appendChild(b);
        });
        m.appendChild(swWrap);
        m.appendChild(el('<div class="menu-sep"></div>'));
        m.appendChild(item("trash", "Delete calendar", true, function () { confirmDeleteCalendar(cal); }));
        document.body.appendChild(m);
        var r = anchor.getBoundingClientRect();
        var mw = 220, mh = m.offsetHeight;
        var left = Math.max(8, Math.min(r.right - mw, window.innerWidth - mw - 8));
        var top = r.bottom + 6;
        if (top + mh > window.innerHeight - 8) top = Math.max(8, r.top - mh - 6);
        m.style.left = left + "px"; m.style.top = top + "px";
        openMenuEl = m;
        document.addEventListener("mousedown", menuOutside, true);
      }
      function startRename(row, cal) {
        var nameEl = row.querySelector(".cal-name");
        var input = el('<input class="cal-rename" value="' + esc(cal.name) + '">');
        nameEl.replaceWith(input);
        input.focus(); input.select();
        function done(save) {
          if (save && input.value.trim()) { cal.name = input.value.trim(); toast("Calendar renamed"); }
          renderSidebar(); renderView(false);
        }
        input.addEventListener("blur", function () { done(true); });
        input.addEventListener("keydown", function (e) {
          if (e.key === "Enter") done(true);
          if (e.key === "Escape") { input.value = cal.name; done(false); }
        });
      }
      function confirmDeleteCalendar(cal) {
        var theirs = state.events.filter(function (e) { return e.cal === cal.id; }).length;
        openConfirm({
          title: "Delete “" + cal.name + "”?",
          body: "This removes the calendar" + (theirs ? " and its " + theirs + " event" + (theirs === 1 ? "" : "s") : "") + ". This cannot be undone.",
          confirmLabel: "Delete", danger: true,
          fn: function () {
            var res = Store.deleteCalendar(cal.id);
            syncFromStore(); renderSidebar(); renderView(false);
            if (res.ok && res.snapshot) {
              toast("Calendar deleted", { label: "Undo", fn: function () { Store.restoreCalendar(res.snapshot); syncFromStore(); renderSidebar(); renderView(false); toast("Calendar restored"); } });
            } else toast("Calendar deleted");
          }
        });
      }
      function renderMiniCal() {
        /* Decoupled: the mini calendar has its OWN cursor (state.miniCursor)
           and its OWN selection (state.miniSelected). Browsing it with the
           ‹ › arrows changes only the mini calendar — the main calendar does
           not move. Paging the main calendar does not change the mini month
           either. Only an explicit click on a mini date jumps the main view
           to that date (a deliberate pick, not browsing). */
        var wrap = el('<div class="rail-hide" id="miniWrap"></div>');
        var mc = state.miniCursor;
        var head = el('<div class="mini-head"><button class="mini-nav" title="Previous month — sidebar only">' + icon("chevL", 14) + '</button><span class="mini-title">' + MONTHS[mc.getMonth()] + " " + mc.getFullYear() + '</span><button class="mini-nav" title="Next month — sidebar only">' + icon("chevR", 14) + "</button></div>");
        var navs = head.querySelectorAll(".mini-nav");
        navs[0].addEventListener("click", function () { state.miniCursor = addMonths(state.miniCursor, -1); renderSidebar(); });
        navs[1].addEventListener("click", function () { state.miniCursor = addMonths(state.miniCursor, 1); renderSidebar(); });
        wrap.appendChild(head);
        var wd = el('<div class="mini-weekdays"><span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span></div>');
        wrap.appendChild(wd);
        var grid = el('<div id="miniGrid"></div>');
        var first = new Date(mc.getFullYear(), mc.getMonth(), 1);
        var start = sundayOf(first);
        var selWeekStart = sundayOf(state.miniSelected);
        var evDays = daysWithEventsInMonth(mc.getFullYear(), mc.getMonth());
        for (var w = 0; w < 6; w++) {
          var rowStart = addDays(start, w * 7);
          var row = el('<div class="mini-week' + (sameDay(rowStart, selWeekStart) ? " band" : "") + '"></div>');
          for (var d = 0; d < 7; d++) {
            (function (date) {
              var inMonth = date.getMonth() === mc.getMonth();
              var b = el('<button class="mini-day' + (inMonth ? "" : " dim") + (sameDay(date, TODAY) ? " today" : "") + (sameDay(date, state.miniSelected) ? " sel" : "") + '"><span class="num">' + date.getDate() + "</span>" + (inMonth && evDays[date.getDate()] ? '<span class="dot"></span>' : "") + "</button>");
              b.addEventListener("click", function () {
                state.miniSelected = sod(date);
                if (date.getMonth() !== state.miniCursor.getMonth() || date.getFullYear() !== state.miniCursor.getFullYear()) state.miniCursor = dt(date.getFullYear(), date.getMonth(), 1);
                state.selected = sod(date); state.cursor = sod(date);
                if (state.view === "day") state.prevView = state.prevView || "month";
                renderAll(false);
                closeDrawer();
              });
              row.appendChild(b);
            })(addDays(rowStart, d));
          }
          grid.appendChild(row);
        }
        wrap.appendChild(grid);
        return wrap;
      }

      /* ================= Greeting & header ================= */
      function renderGreeting() {
        var h = new Date().getHours();
        var word = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
        document.getElementById("greeting").innerHTML = "<b>" + word + ", " + esc(state.firstName) + '!</b> <span class="wave">👋</span>';
      }
      function viewRange() {
        var c = state.cursor;
        if (state.view === "month") return { title: MONTHS[c.getMonth()], sub: MONTHS[c.getMonth()] + " " + c.getFullYear() };
        if (state.view === "week") {
          var s = sundayOf(c), e = addDays(s, 6);
          return { title: MONTHS[s.getMonth()] + " " + s.getFullYear(), sub: MONTHS[s.getMonth()] + " " + pad2(s.getDate()) + " - " + MONTHS[e.getMonth()] + " " + pad2(e.getDate()) };
        }
        if (state.view === "day") return { title: MONTHS[c.getMonth()] + " " + c.getFullYear(), sub: fmtDateLong(c) };
        var a = sod(c), b = addDays(a, 20);
        return { title: "Agenda", sub: MONTHS_S[a.getMonth()] + " " + a.getDate() + " - " + MONTHS_S[b.getMonth()] + " " + b.getDate() + ", " + b.getFullYear() };
      }
      function renderHeader() {
        var hdr = document.getElementById("headerBand");
        var r = viewRange();
        hdr.innerHTML = "";
        var ham = el('<button class="icon-btn hamburger-btn" title="Open sidebar" aria-label="Open sidebar">' + icon("menu", 21) + "</button>");
        ham.addEventListener("click", function () { openDrawer(); });
        hdr.appendChild(ham);
        if (state.view === "day" && state.prevView) {
          var back = el('<button class="back-btn">' + icon("arrowL", 15) + "Back</button>");
          back.addEventListener("click", function () {
            var pv = state.prevView; state.prevView = null; state.view = pv; renderAll(true, -1);
          });
          hdr.appendChild(back);
        }
        var tw = el('<div class="head-title-wrap"><span class="head-cal-icon">' + icon("calendar", 22) + '</span><span><span class="head-title">' + esc(r.title) + '</span><br><span class="head-sub">' + esc(r.sub) + "</span></span></div>");
        hdr.appendChild(tw);
        var pill = el('<div class="nav-pill"><button title="Previous">' + icon("chevL", 16) + '</button><button class="today-seg">Today</button><button title="Next">' + icon("chevR", 16) + "</button></div>");
        var pb = pill.querySelectorAll("button");
        pb[0].addEventListener("click", function () { pageBy(-1); });
        pb[1].addEventListener("click", goToday);
        pb[2].addEventListener("click", function () { pageBy(1); });
        hdr.appendChild(pill);
        var right = el('<div class="head-right"></div>');
        var sb = el('<button class="icon-btn" title="Search (Ctrl+K)">' + icon("search", 19) + "</button>");
        sb.addEventListener("click", openSearch);
        var gb = el('<button class="icon-btn" title="Settings">' + icon("settings", 19) + "</button>");
        gb.addEventListener("click", function () { openSettings("general"); });
        var hb = el('<button class="icon-btn" title="Help">' + icon("help", 19) + "</button>");
        hb.addEventListener("click", openHelp);
        /* Add Event lives in the sidebar above the mini calendar — not in the header. */
        right.appendChild(sb); right.appendChild(gb); right.appendChild(hb);
        hdr.appendChild(right);
      }
      function goToday() {
        /* Main calendar only — the sidebar mini calendar keeps its own month. */
        state.cursor = sod(TODAY); state.selected = sod(TODAY);
        renderAll(false);
      }
      function pageBy(dir) {
        /* Main calendar only — do NOT sync state.miniCursor here. */
        var c = state.cursor;
        if (state.view === "month") state.cursor = addMonths(c, dir);
        else if (state.view === "week") state.cursor = addDays(c, 7 * dir);
        else if (state.view === "day") state.cursor = addDays(c, dir);
        else state.cursor = addDays(c, 21 * dir);
        renderAll(true, dir);
      }
      function renderAll(animate, dir) {
        renderGreeting(); renderHeader(); renderSidebar(); renderView(animate, dir);
      }

      /* ================= Views ================= */
      var viewWrap = document.getElementById("viewWrap");
      var reduceMotionMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
      function renderView(animate, dir) {
        closePopover(); closeMenu();
        viewWrap.innerHTML = "";
        var node;
        if (state.view === "month") node = renderMonth();
        else if (state.view === "week") node = renderTimeGrid(sundayOf(state.cursor), 7);
        else if (state.view === "day") node = renderTimeGrid(sod(state.cursor), 1);
        else node = renderAgenda();
        viewWrap.appendChild(node);
        if (animate && !state.reduceMotion && !reduceMotionMQ.matches) {
          node.classList.add(dir < 0 ? "anim-prev" : "anim-next");
          /* Mini calendar is decoupled — it does not slide with the main view. */
        }
        if (state.view === "week" || state.view === "day") {
          var sc = viewWrap.querySelector(".tg-scroll");
          if (sc) sc.scrollTop = Math.max(0, 6.5 * 52 - 8);
        }
      }
      function drillToDay(date) {
        if (state.view !== "day") state.prevView = state.view;
        state.view = "day"; state.cursor = sod(date); state.selected = sod(date);
        renderAll(true, 1);
      }
      function segClass(occ, date) {
        var s = sameDay(occ.start, date), e = sameDay(sod(occ.end), date) || sameDay(occ.end, date);
        var multi = sod(occ.end) - sod(occ.start) >= DAY_MS || (occ.ev.allDay && sod(occ.end) > sod(occ.start));
        if (!occ.ev.allDay && !multi) return "";
        if (occ.ev.allDay && !multi) return "";
        if (s && e) return "";
        if (s) return " seg-start";
        if (e) return " seg-end";
        if (date.getDay() === 0) return " seg-start";
        if (date.getDay() === 6) return " seg-end";
        return " seg-mid";
      }
      function isMultiDay(occ) { return sod(occ.end) - sod(occ.start) >= DAY_MS; }

      function renderMonth() {
        var wrap = el('<div class="month-wrap"></div>');
        var y = state.cursor.getFullYear(), m = state.cursor.getMonth();
        var dow = el('<div class="dow-row' + (state.weekNumbers ? " has-wn" : "") + '">' + (state.weekNumbers ? "<span></span>" : "") + DOWS_S.map(function (d) { return '<span class="dow-cell">' + d + "</span>"; }).join("") + "</div>");
        wrap.appendChild(dow);
        var grid = el('<div class="month-grid"></div>');
        var start = sundayOf(new Date(y, m, 1));
        var rangeEnd = addDays(start, 42);
        var occs = occsInRange(start, rangeEnd);
        for (var w = 0; w < 6; w++) {
          var rowStart = addDays(start, w * 7);
          var row = el('<div class="month-week' + (state.weekNumbers ? " has-wn" : "") + '"></div>');
          if (state.weekNumbers) row.appendChild(el('<div class="wn-cell">' + isoWeek(addDays(rowStart, 3)) + "</div>"));
          for (var d = 0; d < 7; d++) {
            (function (date, rowStartDate) {
              var inMonth = date.getMonth() === m;
              var dayOccs = occs.filter(function (o) { return sod(o.start) <= date && sod(o.end) >= date; });
              dayOccs.sort(function (a, b) {
                var am = (a.ev.allDay || isMultiDay(a)) ? 0 : 1, bm = (b.ev.allDay || isMultiDay(b)) ? 0 : 1;
                if (am !== bm) return am - bm;
                return a.start - b.start;
              });
              var cell = el('<div class="day-cell' + (inMonth ? "" : " out") + (sameDay(date, TODAY) ? " today" : "") + (sameDay(date, state.selected) ? " sel" : "") + ((date.getDay() === 0 || date.getDay() === 6) && dayOccs.length === 0 ? " hatch" : "") + '"></div>');
              var num = el('<button class="day-num" title="' + esc(fmtDateLong(date)) + '">' + date.getDate() + "</button>");
              num.addEventListener("click", function () { drillToDay(date); });
              cell.appendChild(num);
              var add = el('<button class="cell-add" title="Add event" aria-label="Add event on ' + esc(fmtDateLong(date)) + '">' + icon("plus", 14) + "</button>");
              add.addEventListener("click", function (e) { e.stopPropagation(); openEventForm(null, date); });
              cell.appendChild(add);
              var evBox = el('<div class="cell-events"></div>');
              var MAX = window.innerWidth <= 700 ? 2 : 3;
              dayOccs.slice(0, MAX).forEach(function (o) {
                var cal = calOf(o.ev.cal);
                var seg = segClass(o, date);
                var showTitle = sameDay(o.start, date) || date.getDay() === 0 || sod(o.start) > date && date.getDay() === 0;
                var isStart = sameDay(o.start, date) || date.getDay() === 0;
                var chip = el('<button class="chip' + seg + '" style="background:' + tintOf(cal) + ";color:" + tintTextOf(cal) + '">' +
                  (isStart || seg === "" ? '<span class="chip-title">' + esc(o.ev.title) + "</span>" + (!o.ev.allDay && !isMultiDay(o) ? '<span class="chip-time">' + fmtTime(o.start) + "</span>" : "") : '<span class="chip-title">&nbsp;</span>') +
                  "</button>");
                chip.setAttribute("aria-label", o.ev.title);
                chip.setAttribute("data-occ", o.ev.id + ":" + o.start.getTime());
                chip.addEventListener("click", function (e) { openPopover(o, chip); e.stopPropagation(); });
                evBox.appendChild(chip);
              });
              if (dayOccs.length > MAX) {
                var more = el('<button class="more-link">+' + (dayOccs.length - MAX) + " more</button>");
                more.addEventListener("click", function () { drillToDay(date); });
                evBox.appendChild(more);
              }
              cell.appendChild(evBox);
              cell.addEventListener("click", function () {
                state.selected = sod(date); renderSidebar();
                viewWrap.querySelectorAll(".day-cell.sel").forEach(function (c) { c.classList.remove("sel"); });
                cell.classList.add("sel");
              });
              row.appendChild(cell);
            })(addDays(rowStart, d), rowStart);
          }
          grid.appendChild(row);
        }
        wrap.appendChild(grid);
        return wrap;
      }

      var HOUR_PX = 52;
      function layoutDayEvents(list) {
        var items = list.map(function (o) {
          return { o: o, s: o.start.getHours() * 60 + o.start.getMinutes(), e: o.end.getHours() * 60 + o.end.getMinutes(), col: 0, cols: 1 };
        }).sort(function (a, b) { return a.s - b.s || b.e - a.e; });
        var clusters = [], cur = [], curEnd = -1;
        items.forEach(function (it) {
          if (cur.length && it.s >= curEnd) { clusters.push(cur); cur = []; curEnd = -1; }
          cur.push(it); curEnd = Math.max(curEnd, it.e);
        });
        if (cur.length) clusters.push(cur);
        clusters.forEach(function (cl) {
          var cols = [];
          cl.forEach(function (it) {
            var placed = false;
            for (var i = 0; i < cols.length; i++) if (cols[i] <= it.s) { it.col = i; cols[i] = it.e; placed = true; break; }
            if (!placed) { it.col = cols.length; cols.push(it.e); }
          });
          cl.forEach(function (it) { it.cols = cols.length; });
        });
        return items;
      }
      function renderTimeGrid(firstDay, numDays) {
        var days = [];
        for (var i = 0; i < numDays; i++) days.push(addDays(firstDay, i));
        var rangeEnd = addDays(firstDay, numDays);
        var occs = occsInRange(firstDay, rangeEnd);
        var cols = (56 + numDays * 150) + "px";
        var gridCols = "56px repeat(" + numDays + ", 1fr)";
        var wrap = el('<div class="tg-wrap' + (numDays > 1 ? " tg-week" : " tg-day") + '"></div>');
        var head = el('<div class="tg-head" style="grid-template-columns:' + gridCols + '"></div>');
        head.appendChild(el('<div class="tg-gutter-head">' + esc(state.tzLabel) + "</div>"));
        days.forEach(function (date) {
          var isToday = sameDay(date, TODAY);
          var h = el('<div class="tg-day-head' + (isToday ? " today" : "") + '"><span class="dow">' + DOWS_S[date.getDay()] + '</span><button class="dnum">' + date.getDate() + "</button></div>");
          h.querySelector(".dnum").addEventListener("click", function () { if (numDays > 1) drillToDay(date); });
          head.appendChild(h);
        });
        wrap.appendChild(head);
        var adRow = el('<div class="allday-row" style="grid-template-columns:' + gridCols + '"></div>');
        adRow.appendChild(el('<div class="allday-label">All-day</div>'));
        days.forEach(function (date) {
          var cell = el('<div class="allday-cell"></div>');
          occs.filter(function (o) { return o.ev.allDay && sod(o.start) <= date && sod(o.end) >= date; })
            .sort(function (a, b) { return a.start - b.start; })
            .forEach(function (o) {
              var cal = calOf(o.ev.cal);
              var isStart = sameDay(o.start, date) || date.getDay() === 0 || numDays === 1;
              var seg = numDays === 1 ? "" : segClass(o, date);
              var bar = el('<button class="allday-bar' + seg + '" style="background:' + tintOf(cal) + ";color:" + tintTextOf(cal) + '">' + (isStart ? esc(o.ev.title) : "&nbsp;") + "</button>");
              bar.setAttribute("aria-label", o.ev.title);
              bar.setAttribute("data-occ", o.ev.id + ":" + o.start.getTime());
              bar.addEventListener("click", function (e) { openPopover(o, bar); e.stopPropagation(); });
              cell.appendChild(bar);
            });
          adRow.appendChild(cell);
        });
        wrap.appendChild(adRow);
        var dayEventsTotal = occs.filter(function (o) { return !o.ev.allDay; }).length;
        if (numDays === 1 && dayEventsTotal === 0 && occs.length === 0) {
          var es = el('<div class="empty-state">' + icon("calendar", 30) + "<p>No events yet</p></div>");
          wrap.appendChild(es);
          return wrap;
        }
        var scroll = el('<div class="tg-scroll"></div>');
        var body = el('<div class="tg-body" style="grid-template-columns:' + gridCols + ";height:" + 24 * HOUR_PX + 'px"></div>');
        var gutter = el('<div class="tg-gutter"></div>');
        for (var hr = 1; hr < 24; hr++) {
          var lab = el('<span class="hour-label" style="top:' + hr * HOUR_PX + 'px">' + fmtHourLabel(hr) + "</span>");
          gutter.appendChild(lab);
        }
        body.appendChild(gutter);
        var now = new Date();
        var nowMin = now.getHours() * 60 + now.getMinutes();
        var todayInRange = days.some(function (d) { return sameDay(d, TODAY); });
        days.forEach(function (date) {
          var isWknd = date.getDay() === 0 || date.getDay() === 6;
          var colEl = el('<div class="tg-col' + (isWknd ? " hatch" : "") + '"><div class="hour-lines"></div></div>');
          var dayOccs = occs.filter(function (o) { return !o.ev.allDay && sameDay(o.start, date); });
          layoutDayEvents(dayOccs).forEach(function (it) {
            var o = it.o, cal = calOf(o.ev.cal);
            var top = it.s / 60 * HOUR_PX, height = Math.max(26, (it.e - it.s) / 60 * HOUR_PX - 3);
            var leftPct = it.col / it.cols * 100, widthPct = 100 / it.cols;
            var card = el('<button class="ev-card" style="top:' + top + "px;height:" + height + "px;left:calc(" + leftPct + "% + 3px);width:calc(" + widthPct + "% - 6px);background:" + tintOf(cal) + ";color:" + tintTextOf(cal) + '">' +
              '<span class="ev-title">' + esc(o.ev.title) + "</span>" +
              (height >= 44 ? '<span class="ev-time" style="display:block">' + fmtTimeRange(o.start, o.end) + "</span>" : "") +
              (o.loc && height >= 66 ? '<span class="ev-loc" style="display:block">' + esc(o.loc) + "</span>" : "") +
              "</button>");
            if (height < 58) card.querySelector(".ev-title").style.webkitLineClamp = "1";
            card.setAttribute("data-occ", o.ev.id + ":" + o.start.getTime());
            card.addEventListener("click", function (e) { openPopover(o, card); e.stopPropagation(); });
            colEl.appendChild(card);
          });
          body.appendChild(colEl);
        });
        if (todayInRange) {
          var line = el('<div class="now-line" style="top:' + nowMin / 60 * HOUR_PX + 'px;left:56px"><span class="now-seg"></span><span class="now-dot"></span></div>');
          body.appendChild(line);
          var nowTxt = (function () { var h = now.getHours(), ap = h >= 12 ? "PM" : "AM", hh = h % 12 || 12; return hh + ":" + pad2(now.getMinutes()) + " " + ap; })();
          var gutPill = el('<span class="now-pill" style="top:' + nowMin / 60 * HOUR_PX + 'px;left:2px;right:auto">' + nowTxt + "</span>");
          body.appendChild(gutPill);
        }
        scroll.appendChild(body);
        wrap.appendChild(scroll);
        return wrap;
      }

      function renderAgenda() {
        var start = sod(state.cursor), end = addDays(start, 21);
        var occs = occsInRange(start, end);
        var byDay = {};
        occs.forEach(function (o) {
          var key = sod(o.start).getTime();
          (byDay[key] = byDay[key] || []).push(o);
        });
        var scroll = el('<div class="agenda-scroll"></div>');
        var inner = el('<div class="agenda-inner"></div>');
        var keys = Object.keys(byDay).sort(function (a, b) { return a - b; });
        if (!keys.length) {
          inner.appendChild(el('<div class="empty-state">' + icon("calendar", 30) + "<p>No events yet</p></div>"));
        }
        keys.forEach(function (k) {
          var date = new Date(+k);
          var head = el('<div class="agenda-day-head"><span class="ad-name">' + DOWS[date.getDay()] + '</span><span class="ad-date">' + fmtDateShort(date) + "</span>" + (sameDay(date, TODAY) ? '<span class="ad-today">Today</span>' : "") + "</div>");
          inner.appendChild(head);
          byDay[k].slice().sort(function (a, b) { return (a.ev.allDay ? 0 : 1) - (b.ev.allDay ? 0 : 1) || a.start - b.start; }).forEach(function (o) {
            var cal = calOf(o.ev.cal);
            var meta = o.ev.allDay
              ? (isMultiDay(o) ? fmtDateShort(o.start) + " - " + fmtDateShort(sod(o.end)) : "All day")
              : fmtTimeRange(o.start, o.end);
            var card = el('<button class="agenda-card" style="background:' + tintOf(cal) + ";color:" + tintTextOf(cal) + '">' +
              '<span class="ac-bar" style="background:' + dotOf(cal) + '"></span>' +
              '<span><span class="ac-title">' + esc(o.ev.title) + '</span><span class="ac-meta" style="display:flex">' + icon("clock", 13) + "<span>" + esc(meta) + "</span>" +
              (o.loc ? icon("pin", 13) + "<span>" + esc(o.loc) + "</span>" : "") +
              "</span></span></button>");
            card.setAttribute("data-occ", o.ev.id + ":" + o.start.getTime());
            card.addEventListener("click", function (e) { openPopover(o, card); e.stopPropagation(); });
            inner.appendChild(card);
          });
        });
        scroll.appendChild(inner);
        var w = el('<div style="display:flex;flex-direction:column;flex:1;min-height:0"></div>');
        w.appendChild(scroll);
        return w;
      }

      /* ================= Event popover ================= */
      var popEl = null;
      function closePopover() { if (popEl) { popEl.remove(); popEl = null; document.removeEventListener("mousedown", popOutside, true); } }
      function popOutside(e) { if (popEl && !popEl.contains(e.target)) closePopover(); }
      function openPopover(occ, anchor) {
        closeMenu();
        if (popEl && popEl._occId === occ.ev.id && popEl._occStart === occ.start.getTime()) { closePopover(); return; }
        closePopover();
        var ev = occ.ev, cal = calOf(ev.cal);
        var readOnly = isReadOnlyEvent(ev);
        var rel = fmtRelativeDay(occ.start);
        var dur = fmtDuration(occ);
        /* Google Calendar–style detail: date first, then time + duration, then the rest with icon gutter */
        var timeMain, timeSub;
        if (ev.allDay) {
          timeMain = fmtPopDate(occ);
          timeSub = dur + (rel ? " · " + rel : "");
        } else if (sameDay(occ.start, occ.end)) {
          timeMain = fmtPopDate(occ);
          timeSub = fmtTime(occ.start) + " – " + fmtTime(occ.end) + (dur ? " · " + dur : "") + " · " + state.tzLabel + (rel ? " · " + rel : "");
        } else {
          timeMain = fmtPopDate(occ);
          timeSub = fmtTime(occ.start) + " – " + fmtTime(occ.end) + (dur ? " · " + dur : "") + " · " + state.tzLabel + (rel ? " · " + rel : "");
        }
        var rows = "";
        rows += '<div class="pop-row"><span class="pop-ic">' + icon("clock", 19) + '</span><span class="pop-main"><span class="pr-strong">' + esc(timeMain) + '</span><span class="pr-sub">' + esc(timeSub) + "</span></span></div>";
        if (hasRepeat(ev)) rows += '<div class="pop-row"><span class="pop-ic">' + icon("repeat", 18) + '</span><span class="pop-main">' + esc(repeatLabelOf(ev)) + "</span></div>";
        if (ev.loc) rows += '<div class="pop-row"><span class="pop-ic">' + icon("pin", 19) + '</span><span class="pop-main">' + esc(ev.loc) + '<span class="pr-sub">Location</span></span></div>';
        if (ev.desc) rows += '<div class="pop-row"><span class="pop-ic">' + icon("alignLeft", 18) + '</span><span class="pop-main pop-desc">' + esc(ev.desc) + "</span></div>";
        rows += '<div class="pop-row"><span class="pop-ic">' + icon("calendar", 18) + '</span><span class="pop-main">' + esc(cal.name) + (readOnly ? '<span class="pr-sub">Subscribed calendar</span>' : "") + (ev.declined ? '<span class="pr-sub">Declined</span>' : "") + "</span></div>";
        if (readOnly) rows += '<div class="pop-row"><span class="pop-ic">' + icon("lock", 17) + '</span><span class="pop-main" style="color:var(--muted);font-size:13px">Read-only — you can\'t create, edit, or delete events on this calendar.</span></div>';
        var topBtns = "";
        if (!readOnly) topBtns += '<button class="icon-btn" data-act="edit" title="Edit event" aria-label="Edit event">' + icon("pencil", 17) + '</button><button class="icon-btn" data-act="del" title="Delete event" aria-label="Delete event">' + icon("trash", 17) + "</button>";
        topBtns += '<button class="icon-btn" data-act="close" title="Close" aria-label="Close">' + icon("x", 17) + "</button>";
        var foot = "";
        if (!readOnly) foot = '<div class="pop-foot"><button class="btn-ghost" data-act="del2">Delete</button><button class="btn-primary" data-act="edit2">Edit event</button></div>';
        var calLine = '<div class="pop-cal-line"><span class="pop-cal-chip"><span style="width:8px;height:8px;border-radius:50%;background:' + dotOf(cal) + ';display:inline-block"></span>' + esc(cal.name) + "</span>" + (ev.allDay ? "<span>All day</span>" : "") + (hasRepeat(ev) ? "<span>" + esc(repeatLabelOf(ev)) + "</span>" : "") + "</div>";
        var p = el('<div class="popover" role="dialog" aria-label="Event details"><div class="pop-top">' + topBtns + '</div><div class="pop-head"><span class="pop-color-sq" style="background:' + dotOf(cal) + '"></span><div style="flex:1;min-width:0"><div class="pop-title">' + esc(ev.title) + "</div>" + calLine + "</div></div>" +
          '<div class="pop-rows">' + rows + "</div>" + foot + "</div>");
        p._occId = ev.id; p._occStart = occ.start.getTime();
        document.body.appendChild(p);
        var r = anchor.getBoundingClientRect();
        var pw = 376, ph = p.offsetHeight;
        var left = Math.max(8, Math.min(r.left, window.innerWidth - pw - 8));
        var top = r.bottom + 8;
        if (top + ph > window.innerHeight - 8) top = Math.max(8, r.top - ph - 8);
        p.style.left = left + "px"; p.style.top = top + "px";
        popEl = p;
        document.addEventListener("mousedown", popOutside, true);
        p.querySelector('[data-act="close"]').addEventListener("click", closePopover);
        var editBtn = p.querySelector('[data-act="edit"]');
        if (editBtn) editBtn.addEventListener("click", function () { closePopover(); openEventForm(ev, null, occ); });
        var delBtn = p.querySelector('[data-act="del"]');
        function doDelete() {
          if (readOnly) { toast("Subscribed calendars are read-only"); return; }
          var gate = Store.assertWritable(ev.cal);
          if (!gate.ok) { toast(gate.error); return; }
          closePopover();
          if (hasRepeat(ev)) {
            openScopeDialog({
              verb: "Delete",
              onPick: function (scope) {
                var res = Store.deleteOccurrence(ev.id, occ.start.getTime(), scope);
                if (!res.ok) { toast(res.error || "Could not delete that event"); return; }
                syncFromStore(); renderAll(false);
                toast(scope === "all" ? "Series deleted" : "Event deleted");
              }
            });
            return;
          }
          var recCopy = JSON.parse(JSON.stringify(Store.event(ev.id)));
          var res = Store.deleteEvent(ev.id);
          if (!res.ok) { toast(res.error || "Could not delete that event"); return; }
          syncFromStore(); renderAll(false);
          toast("Event deleted", { label: "Undo", fn: function () { Store.restoreEvent(recCopy); syncFromStore(); renderAll(false); toast("Event restored"); } });
        }
        function doEdit() { closePopover(); openEventForm(ev, null, occ); }
        if (delBtn) delBtn.addEventListener("click", doDelete);
        var edit2 = p.querySelector('[data-act="edit2"]');
        if (edit2) edit2.addEventListener("click", doEdit);
        var del2 = p.querySelector('[data-act="del2"]');
        if (del2) del2.addEventListener("click", doDelete);
      }

      /* ================= Generic dialogs ================= */
      var overlayRoot = document.getElementById("overlayRoot");
      function closeTopDialog() {
        var kids = overlayRoot.children;
        if (kids.length) kids[kids.length - 1].remove();
      }
      function openConfirm(opts) {
        var bd = el('<div class="backdrop"><div class="dialog" style="width:400px">' +
          '<div class="dialog-head"><span class="dialog-title">' + esc(opts.title) + '</span><button class="icon-btn" data-x title="Close" aria-label="Close">' + icon("x", 17) + "</button></div>" +
          '<div class="dialog-body"><p style="margin:0;font-size:14px;color:var(--muted);line-height:1.55">' + esc(opts.body) + "</p></div>" +
          '<div class="dialog-foot"><button class="btn-ghost" data-cancel>Cancel</button><button class="' + (opts.danger ? "btn-danger" : "btn-primary") + '" style="margin-left:0" data-ok>' + esc(opts.confirmLabel) + "</button></div></div></div>");
        overlayRoot.appendChild(bd);
        function close() { bd.remove(); }
        bd.querySelector("[data-x]").addEventListener("click", close);
        bd.querySelector("[data-cancel]").addEventListener("click", close);
        bd.addEventListener("mousedown", function (e) { if (e.target === bd) close(); });
        bd.querySelector("[data-ok]").addEventListener("click", function () { close(); opts.fn(); });
      }
      function openHelp() {
        var bd = el('<div class="backdrop"><div class="dialog" style="width:440px">' +
          '<div class="dialog-head"><span class="dialog-title">Help center</span><button class="icon-btn" data-x title="Close" aria-label="Close">' + icon("x", 17) + "</button></div>" +
          '<div class="dialog-body" style="font-size:14px;line-height:1.6;color:var(--muted)">' +
          "<p style='margin:0 0 10px'>daylight stores everything in this browser (local storage), so your calendars, events, and tasks are saved on this device and survive reloads. Nothing leaves the device except feeds you subscribe to.</p>" +
          "<p style='margin:0 0 10px'>Click a date number to jump into Day view. Click any event to see its details, edit it, or delete it.</p>" +
          "<p style='margin:0'>Press <b style='color:var(--text)'>Ctrl/⌘ + ,</b> for Settings and <b style='color:var(--text)'>Ctrl/⌘ + K</b> for Search.</p>" +
          '</div><div class="dialog-foot"><button class="btn-primary" style="margin-left:0" data-ok>Done</button></div></div></div>');
        overlayRoot.appendChild(bd);
        function close() { bd.remove(); }
        bd.querySelector("[data-x]").addEventListener("click", close);
        bd.querySelector("[data-ok]").addEventListener("click", close);
        bd.addEventListener("mousedown", function (e) { if (e.target === bd) close(); });
      }
      function openNewCalendar() {
        var chosen = "teal";
        var bd = el('<div class="backdrop"><div class="dialog" style="width:400px">' +
          '<div class="dialog-head"><span class="dialog-title">New calendar</span><button class="icon-btn" data-x title="Close" aria-label="Close">' + icon("x", 17) + "</button></div>" +
          '<div class="dialog-body"><div class="field"><label for="ncName">Name</label><input class="text-input" id="ncName" placeholder="Calendar name"><div class="field-err" id="ncErr">Add a name</div></div>' +
          '<div class="field"><label>Color</label><div class="swatches" id="ncSwatches"></div></div></div>' +
          '<div class="dialog-foot"><button class="btn-ghost" data-cancel>Cancel</button><button class="btn-primary" style="margin-left:0" data-ok>Create calendar</button></div></div></div>');
        overlayRoot.appendChild(bd);
        var sw = bd.querySelector("#ncSwatches");
        SWATCH_ORDER.forEach(function (k) {
          var b = el('<button class="swatch' + (k === chosen ? " sel" : "") + '" style="background:' + PALETTE[k].dot + '" title="' + k + '"></button>');
          b.addEventListener("click", function () { chosen = k; sw.querySelectorAll(".swatch").forEach(function (s) { s.classList.remove("sel"); }); b.classList.add("sel"); });
          sw.appendChild(b);
        });
        var input = bd.querySelector("#ncName");
        input.focus();
        function close() { bd.remove(); }
        bd.querySelector("[data-x]").addEventListener("click", close);
        bd.querySelector("[data-cancel]").addEventListener("click", close);
        bd.addEventListener("mousedown", function (e) { if (e.target === bd) close(); });
        bd.querySelector("[data-ok]").addEventListener("click", function () {
          var name = input.value.trim();
          if (!name) { input.classList.add("err"); bd.querySelector("#ncErr").classList.add("show"); return; }
          var res = Store.createCalendar({ name: name, color: chosen });
          if (!res.ok) { toast(res.error || "Could not create that calendar"); return; }
          syncFromStore();
          close(); renderSidebar(); toast("Calendar created");
        });
      }

      /* ================= Event form ================= */
      function timeOptions(selMin) {
        var out = "";
        for (var m = 0; m < 24 * 60; m += 30) {
          var h = Math.floor(m / 60), ap = h >= 12 ? "PM" : "AM", hh = h % 12 || 12;
          out += '<option value="' + m + '"' + (m === selMin ? " selected" : "") + ">" + hh + ":" + pad2(m % 60) + " " + ap + "</option>";
        }
        return out;
      }
      function openDatePicker(anchorBtn, current, onPick) {
        closeDatePicker();
        var pop = el('<div class="date-pop"></div>');
        pop.id = "datePop";
        var view = dt(current.getFullYear(), current.getMonth(), 1);
        function draw() {
          pop.innerHTML = "";
          var head = el('<div class="mini-head" style="padding-bottom:6px"><button class="mini-nav" title="Previous month" aria-label="Previous month">' + icon("chevL", 14) + '</button><span class="mini-title" style="font-size:14px">' + MONTHS[view.getMonth()] + " " + view.getFullYear() + '</span><button class="mini-nav" title="Next month" aria-label="Next month">' + icon("chevR", 14) + "</button></div>");
          var navs = head.querySelectorAll(".mini-nav");
          navs[0].addEventListener("click", function (e) { e.stopPropagation(); view = addMonths(view, -1); draw(); });
          navs[1].addEventListener("click", function (e) { e.stopPropagation(); view = addMonths(view, 1); draw(); });
          pop.appendChild(head);
          pop.appendChild(el('<div class="mini-weekdays"><span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span></div>'));
          var start = sundayOf(view);
          for (var w = 0; w < 6; w++) {
            var row = el('<div class="mini-week"></div>');
            for (var d = 0; d < 7; d++) {
              (function (date) {
                var b = el('<button class="mini-day' + (date.getMonth() === view.getMonth() ? "" : " dim") + (sameDay(date, TODAY) ? " today" : "") + (sameDay(date, current) ? " sel" : "") + '"><span class="num">' + date.getDate() + "</span></button>");
                b.addEventListener("click", function (e) { e.stopPropagation(); closeDatePicker(); onPick(sod(date)); });
                row.appendChild(b);
              })(addDays(start, w * 7 + d));
            }
            pop.appendChild(row);
          }
        }
        draw();
        document.body.appendChild(pop);
        var r = anchorBtn.getBoundingClientRect();
        pop.style.left = Math.max(8, Math.min(r.left, window.innerWidth - 260)) + "px";
        var top = r.bottom + 6;
        if (top + 320 > window.innerHeight) top = Math.max(8, r.top - 326);
        pop.style.top = top + "px";
        setTimeout(function () { document.addEventListener("mousedown", dpOutside, true); }, 0);
      }
      function dpOutside(e) { var p = document.getElementById("datePop"); if (p && !p.contains(e.target)) closeDatePicker(); }
      function closeDatePicker() { var p = document.getElementById("datePop"); if (p) p.remove(); document.removeEventListener("mousedown", dpOutside, true); }

      function openEventForm(existing, presetDate, occ) {
        closePopover(); closeMenu();
        if (existing && isReadOnlyEvent(existing)) { toast("Subscribed calendars are read-only — events can't be edited"); return; }
        var isEdit = !!existing;
        var src = existing || null;
        var base = occ || src;
        var now = new Date();
        var nextHour = Math.min(23, now.getHours() + 1);
        var f = {
          title: src ? src.title : "",
          cal: src ? src.cal : defaultCalId(),
          allDay: src ? src.allDay : false,
          sDate: base ? sod(base.start) : sod(presetDate || state.selected),
          eDate: base ? sod(base.end) : sod(presetDate || state.selected),
          sMin: base && !base.allDay ? base.start.getHours() * 60 + base.start.getMinutes() : nextHour * 60,
          eMin: base && !base.allDay ? base.end.getHours() * 60 + base.end.getMinutes() : nextHour * 60 + 60,
          repeat: src ? (RRule.simpleKey(src) || null) : null,
          custom: { freq: "WEEKLY", interval: 1, endType: "never", count: 30, endDate: addMonths(sod(new Date()), 1), byday: null },
          loc: src ? src.loc : "",
          desc: src ? (src.desc || "") : "",
          dirty: false
        };
        if (f.eMin >= 24 * 60) f.eMin = 23 * 60 + 30;
        if (src && src.rrule) {
          var parsedRule = RRule.parse(src.rrule);
          if (parsedRule) {
            f.custom.freq = parsedRule.freq; f.custom.interval = parsedRule.interval || 1;
            if (parsedRule.count) { f.custom.endType = "count"; f.custom.count = parsedRule.count; }
            else if (parsedRule.untilMs != null) { f.custom.endType = "date"; f.custom.endDate = sod(new Date(parsedRule.untilMs)); }
            if (parsedRule.byday) f.custom.byday = parsedRule.byday.map(function (b) { return b.dow; });
          }
        }
        var bd = el('<div class="backdrop"></div>');
        var dlg = el('<div class="dialog" role="dialog" aria-modal="true"></div>');
        dlg.innerHTML =
          '<div class="dialog-head"><span class="dialog-title">' + (isEdit ? "Edit event" : "New event") + '</span><button class="icon-btn" data-x title="Close" aria-label="Close">' + icon("x", 17) + "</button></div>" +
          '<div class="dialog-body">' +
            '<div class="field"><label for="efTitle">Title</label><input class="text-input" id="efTitle" placeholder="Event title" value="' + esc(f.title) + '"><div class="field-err" id="efTitleErr">Add a title</div></div>' +
            '<div class="field"><div class="switch-row"><span><span class="sw-label">All-day</span></span><label class="switch"><input type="checkbox" id="efAllDay"' + (f.allDay ? " checked" : "") + '><span class="track"></span><span class="knob"></span></label></div></div>' +
            '<div class="form-grid">' +
              '<div class="field"><label>Starts</label><button class="picker-btn" id="efSDate">' + icon("calendar", 15) + '<span></span></button></div>' +
              '<div class="field"><label>Ends</label><button class="picker-btn" id="efEDate">' + icon("calendar", 15) + '<span></span></button></div>' +
              '<div class="field" id="efSTimeWrap"><label>Start time</label><select class="picker-btn" id="efSTime"></select></div>' +
              '<div class="field" id="efETimeWrap"><label>End time</label><select class="picker-btn" id="efETime"></select></div>' +
            "</div>" +
            '<div class="field"><label>Repeats</label><button class="picker-btn" id="efRepeat">' + icon("repeat", 15) + '<span></span><span style="margin-left:auto;color:var(--muted)">' + icon("chevD", 15) + "</span></button></div>" +
            '<div class="field" id="efCustom" style="display:none"><label>Custom repeat</label>' +
              '<div class="form-grid">' +
                '<div class="field" style="margin-bottom:8px"><label>Frequency</label><select class="picker-btn" id="efCFreq"><option value="DAILY">Daily</option><option value="WEEKLY">Weekly</option><option value="MONTHLY">Monthly</option><option value="YEARLY">Yearly</option></select></div>' +
                '<div class="field" style="margin-bottom:8px"><label>Every (interval)</label><input class="text-input" id="efCInterval" type="number" min="1" max="99"></div>' +
              '</div>' +
              '<div id="efCByday" style="display:none;gap:5px;flex-wrap:wrap;margin-bottom:10px"></div>' +
              '<div class="form-grid">' +
                '<div class="field" style="margin-bottom:0"><label>Ends</label><select class="picker-btn" id="efCEnd"><option value="never">Never</option><option value="date">On date</option><option value="count">After a number of times</option></select></div>' +
                '<div class="field" style="margin-bottom:0" id="efCEndDateWrap"><label>End date</label><button class="picker-btn" id="efCEndDate"><span></span></button></div>' +
                '<div class="field" style="margin-bottom:0" id="efCEndCountWrap"><label>Times</label><input class="text-input" id="efCCount" type="number" min="1" max="999"></div>' +
              '</div>' +
            '</div>' +
            '<div class="field"><label for="efLoc">Location</label><input class="text-input" id="efLoc" placeholder="Add a location" value="' + esc(f.loc) + '"></div>' +
            '<div class="field"><label for="efDesc">Description</label><textarea class="text-area" id="efDesc" rows="2" placeholder="Add a description">' + esc(f.desc) + '</textarea></div>' +
            '<div class="field"><label>Calendar</label><button class="picker-btn" id="efCal"><span></span><span style="margin-left:auto;color:var(--muted)">' + icon("chevD", 15) + "</span></button><p class=\"inline-note\">Subscribed calendars like US Holidays are read-only and can't be picked here.</p></div>" +
          "</div>" +
          '<div class="dialog-foot"><button class="btn-ghost" data-cancel>Cancel</button><button class="btn-primary" style="margin-left:0" data-save>' + (isEdit ? "Save changes" : "Create event") + "</button></div>";
        bd.appendChild(dlg);
        overlayRoot.appendChild(bd);
        var titleIn = dlg.querySelector("#efTitle");
        var allDayIn = dlg.querySelector("#efAllDay");
        var sDateBtn = dlg.querySelector("#efSDate"), eDateBtn = dlg.querySelector("#efEDate");
        var sTime = dlg.querySelector("#efSTime"), eTime = dlg.querySelector("#efETime");
        var repBtn = dlg.querySelector("#efRepeat"), calBtn = dlg.querySelector("#efCal");
        var locIn = dlg.querySelector("#efLoc");
        var descIn = dlg.querySelector("#efDesc");
        function markDirty() { f.dirty = true; }
        function dateLabel(d) { return MONTHS_S[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear(); }
        function syncUI() {
          sDateBtn.querySelector("span").textContent = dateLabel(f.sDate);
          eDateBtn.querySelector("span").textContent = dateLabel(f.eDate);
          sTime.innerHTML = timeOptions(f.sMin);
          eTime.innerHTML = timeOptions(f.eMin);
          dlg.querySelector("#efSTimeWrap").style.display = f.allDay ? "none" : "";
          dlg.querySelector("#efETimeWrap").style.display = f.allDay ? "none" : "";
          repBtn.querySelector("span").textContent = f.repeat ? (f.repeat === "custom" ? "Custom…" : f.repeat[0].toUpperCase() + f.repeat.slice(1)) : "None";
          syncCustom();
          var cal = calOf(f.cal);
          calBtn.querySelector("span").innerHTML = '<span style="display:inline-flex;align-items:center;gap:8px"><span class="pop-dot" style="background:' + dotOf(cal) + ';margin:0"></span>' + esc(cal.name) + "</span>";
        }
        var cFreq = dlg.querySelector("#efCFreq"), cInt = dlg.querySelector("#efCInterval"),
            cEnd = dlg.querySelector("#efCEnd"), cEndDateBtn = dlg.querySelector("#efCEndDate"),
            cCount = dlg.querySelector("#efCCount"), cByday = dlg.querySelector("#efCByday");
        function syncCustom() {
          var show = f.repeat === "custom";
          dlg.querySelector("#efCustom").style.display = show ? "" : "none";
          if (!show) return;
          cFreq.value = f.custom.freq; cInt.value = f.custom.interval; cEnd.value = f.custom.endType; cCount.value = f.custom.count;
          cEndDateBtn.querySelector("span").textContent = dateLabel(f.custom.endDate);
          dlg.querySelector("#efCEndDateWrap").style.display = f.custom.endType === "date" ? "" : "none";
          dlg.querySelector("#efCEndCountWrap").style.display = f.custom.endType === "count" ? "" : "none";
          cByday.style.display = f.custom.freq === "WEEKLY" ? "flex" : "none";
          if (f.custom.freq === "WEEKLY") {
            cByday.innerHTML = "";
            var sel = f.custom.byday && f.custom.byday.length ? f.custom.byday : [f.sDate.getDay()];
            DOWS_S.forEach(function (nm, dow) {
              var on = sel.indexOf(dow) >= 0;
              var b = el('<button type="button" class="mini-nav" style="width:auto;padding:0 9px;height:30px;border-radius:15px;' + (on ? "background:var(--accent);color:#fff;border-color:var(--accent)" : "") + '">' + nm + "</button>");
              b.addEventListener("click", function () {
                var cur = f.custom.byday && f.custom.byday.length ? f.custom.byday.slice() : [f.sDate.getDay()];
                var i = cur.indexOf(dow);
                if (i >= 0) { if (cur.length > 1) cur.splice(i, 1); } else cur.push(dow);
                f.custom.byday = cur; markDirty(); syncCustom();
              });
              cByday.appendChild(b);
            });
          }
        }
        cFreq.addEventListener("change", function () { f.custom.freq = cFreq.value; markDirty(); syncCustom(); });
        cInt.addEventListener("change", function () { f.custom.interval = Math.max(1, Math.min(99, +cInt.value || 1)); markDirty(); syncCustom(); });
        cEnd.addEventListener("change", function () { f.custom.endType = cEnd.value; markDirty(); syncCustom(); });
        cCount.addEventListener("change", function () { f.custom.count = Math.max(1, Math.min(999, +cCount.value || 1)); markDirty(); });
        cEndDateBtn.addEventListener("click", function () { openDatePicker(cEndDateBtn, f.custom.endDate, function (d) { f.custom.endDate = d; markDirty(); syncCustom(); }); });
        syncUI();
        titleIn.focus();
        titleIn.addEventListener("input", function () { f.title = titleIn.value; titleIn.classList.remove("err"); dlg.querySelector("#efTitleErr").classList.remove("show"); markDirty(); });
        locIn.addEventListener("input", function () { f.loc = locIn.value; markDirty(); });
        if (descIn) descIn.addEventListener("input", function () { f.desc = descIn.value; markDirty(); });
        allDayIn.addEventListener("change", function () {
          f.allDay = allDayIn.checked; markDirty();
          if (!f.allDay && f.sMin == null) { f.sMin = nextHour * 60; f.eMin = f.sMin + 60; }
          syncUI();
        });
        sDateBtn.addEventListener("click", function () {
          openDatePicker(sDateBtn, f.sDate, function (d) {
            f.sDate = d; if (f.eDate < d) f.eDate = d; markDirty(); syncUI();
          });
        });
        eDateBtn.addEventListener("click", function () {
          openDatePicker(eDateBtn, f.eDate, function (d) {
            f.eDate = d; if (f.sDate > d) f.sDate = d; markDirty(); syncUI();
          });
        });
        sTime.addEventListener("change", function () {
          var dur = f.eMin - f.sMin;
          f.sMin = +sTime.value; f.eMin = Math.min(23 * 60 + 30, f.sMin + dur);
          if (f.eMin <= f.sMin) f.eMin = f.sMin + 30;
          markDirty(); syncUI();
        });
        eTime.addEventListener("change", function () { f.eMin = +eTime.value; markDirty(); });
        repBtn.addEventListener("click", function () {
          var items = [{ label2: "Repeat" }];
          [["none", "None"], ["daily", "Daily"], ["weekly", "Weekly"], ["monthly", "Monthly"], ["yearly", "Yearly"], ["custom", "Custom…"]].forEach(function (pair) {
            items.push({ label: pair[1], right: (f.repeat || "none") === pair[0] ? "check" : null, fn: function () { f.repeat = pair[0] === "none" ? null : pair[0]; markDirty(); syncUI(); } });
          });
          openMenu(repBtn, items);
        });
        calBtn.addEventListener("click", function () {
          var items = [{ label2: "Calendar" }];
          writableCalendars().forEach(function (c) {
            items.push({ label: c.name, right: f.cal === c.id ? "check" : null, fn: function () { f.cal = c.id; markDirty(); syncUI(); } });
          });
          var subs = state.calendars.filter(function (c) { return c.subscribed; });
          if (subs.length) { items.push({ sep: true }); items.push({ label2: "Subscribed — read-only" }); subs.forEach(function (c) { items.push({ label: c.name + " (read-only)", fn: function () { toast("Subscribed calendars are read-only — pick another calendar"); } }); }); }
          if (!writableCalendars().length) items.push({ label: "No writable calendars yet — create one from the sidebar", fn: function () {} });
          openMenu(calBtn, items);
        });
        function tryClose() {
          closeDatePicker(); closeMenu();
          if (f.dirty) {
            openConfirm({
              title: "Discard changes?",
              body: "You have unsaved changes to this event. Discarding them cannot be undone.",
              confirmLabel: "Discard", danger: true,
              fn: function () { bd.remove(); }
            });
          } else bd.remove();
        }
        dlg.querySelector("[data-x]").addEventListener("click", tryClose);
        dlg.querySelector("[data-cancel]").addEventListener("click", tryClose);
        bd.addEventListener("mousedown", function (e) { if (e.target === bd) tryClose(); });
        function buildFormRRule() {
          if (!f.repeat) return null;
          if (f.repeat !== "custom") return RRule.stringify(RRule.fromSimple(f.repeat), f.allDay);
          var rule = { freq: f.custom.freq, interval: Math.max(1, f.custom.interval || 1), byday: null, bymonthday: null, bymonth: null, untilMs: null, count: null };
          if (f.custom.freq === "WEEKLY" && f.custom.byday && f.custom.byday.length) {
            rule.byday = f.custom.byday.slice().sort(function (a, b) { return a - b; }).map(function (dow) { return { dow: dow, ord: null }; });
          }
          if (f.custom.endType === "count") rule.count = Math.max(1, f.custom.count || 1);
          else if (f.custom.endType === "date") rule.untilMs = sod(f.custom.endDate).getTime() + DAY_MS - 1;
          return RRule.stringify(rule, f.allDay);
        }
        dlg.querySelector("[data-save]").addEventListener("click", function () {
          f.title = titleIn.value.trim();
          if (!f.title) {
            titleIn.classList.add("err"); dlg.querySelector("#efTitleErr").classList.add("show"); titleIn.focus(); return;
          }
          var start, end;
          if (f.allDay) { start = sod(f.sDate); end = sod(f.eDate); end.setHours(23, 59); }
          else {
            start = new Date(f.sDate); start.setHours(Math.floor(f.sMin / 60), f.sMin % 60);
            end = new Date(f.eDate); end.setHours(Math.floor(f.eMin / 60), f.eMin % 60);
            if (end <= start) { end = new Date(start.getTime() + 30 * 60000); }
          }
          if (isSubscribed(calOf(f.cal))) { toast("Subscribed calendars are read-only — pick another calendar"); return; }
          closeDatePicker(); closeMenu();
          var fields = { title: f.title, cal: f.cal, loc: locIn.value.trim(), desc: descIn ? descIn.value.trim() : "",
            allDay: f.allDay, startMs: start.getTime(), endMs: end.getTime(), rrule: buildFormRRule(), repeat: f.repeat || null };
          function finish(res, msg) {
            if (!res.ok) { toast(res.error || "Could not save that event"); return; }
            bd.remove(); syncFromStore(); renderAll(false); toast(msg);
          }
          if (!isEdit) { finish(Store.createEvent(fields), "Event created"); return; }
          if (occ && hasRepeat(src)) {
            var rec = Store.event(src.id);
            var storedRule = rec ? (rec.rrule || (rec.repeat ? RRule.stringify(RRule.fromSimple(rec.repeat), rec.allDay) : null)) : null;
            var repeatChanged = (fields.rrule || null) !== storedRule;
            openScopeDialog({
              verb: "Save",
              onPick: function (scope) {
                var flds = {}; Object.keys(fields).forEach(function (k) { flds[k] = fields[k]; });
                if (scope === "all") {
                  var delta = start.getTime() - occ.start.getTime();
                  flds.startMs = (rec ? rec.startMs : src.start.getTime()) + delta;
                  flds.endMs = flds.startMs + (end.getTime() - start.getTime());
                  if (!repeatChanged && rec) { flds.rrule = rec.rrule; flds.repeat = rec.repeat; }
                  finish(Store.updateOccurrence(src.id, occ.start.getTime(), "all", flds), "Series updated");
                } else if (scope === "following") {
                  if (!repeatChanged) { delete flds.rrule; delete flds.repeat; }
                  finish(Store.updateOccurrence(src.id, occ.start.getTime(), "following", flds), "Event updated");
                } else {
                  flds.rrule = null; flds.repeat = null;
                  finish(Store.updateOccurrence(src.id, occ.start.getTime(), "only", flds), "Event updated");
                }
              }
            });
            return;
          }
          finish(Store.updateEvent(src.id, fields), "Event updated");
        });
      }

      /* ================= Search palette =================
         Search MUST have: (1) a visible ✕ close button in the top-right of
         the palette (#palClose), (2) a clear-✕ inside the field (#palClear,
         shown only while there is text) that empties the query, and
         (3) close on outside click (mousedown on the backdrop) and on
         Escape. All three are implemented in openSearch below. */
      function openSearch() {
        closeMenu(); closePopover();
        if (document.getElementById("paletteBd")) return;
        var bd = el('<div class="palette-backdrop" id="paletteBd"><div class="palette" role="dialog" aria-modal="true" aria-label="Search events">' +
          '<div class="palette-input-row">' + icon("search", 18) + '<input class="palette-input" id="palInput" placeholder="Search events"><button class="palette-clear" id="palClear" title="Clear search text" aria-label="Clear search text">' + icon("x", 13) + '</button><button class="palette-close" id="palClose" title="Close search" aria-label="Close search">' + icon("x", 16) + "</button></div>" +
          '<div class="palette-results" id="palResults"></div></div></div>');
        document.body.appendChild(bd);
        var input = bd.querySelector("#palInput");
        var results = bd.querySelector("#palResults");
        var clear = bd.querySelector("#palClear");
        input.focus();
        function close() { if (paletteCloseFn === close) paletteCloseFn = null; bd.remove(); document.removeEventListener("keydown", palKeys, true); }
        paletteCloseFn = close;
        bd.querySelector("#palClose").addEventListener("click", close);
        function palKeys(e) { if (e.key === "Escape") { e.stopPropagation(); close(); } }
        document.addEventListener("keydown", palKeys, true);
        bd.addEventListener("mousedown", function (e) { if (e.target === bd) close(); });
        clear.addEventListener("click", function () { input.value = ""; draw(); input.focus(); });
        function draw() {
          var q = input.value.trim().toLowerCase();
          clear.classList.toggle("show", q.length > 0);
          results.innerHTML = "";
          if (!q) {
            results.appendChild(el('<div class="empty-state" style="padding:30px 20px">' + icon("search", 26) + "<p>Start typing to search your events</p></div>"));
            return;
          }
          var nowY = new Date().getFullYear();
          var range = [];
          state.events.forEach(function (ev) {
            RRule.expand(ev, new Date(nowY - 2, 0, 1), new Date(nowY + 3, 11, 31)).forEach(function (o) {
              if (o.ev.title.toLowerCase().indexOf(q) >= 0 || (o.ev.loc || "").toLowerCase().indexOf(q) >= 0 || (o.ev.desc || "").toLowerCase().indexOf(q) >= 0) range.push(o);
            });
          });
          range.sort(function (a, b) { return a.start - b.start; });
          if (!range.length) {
            results.appendChild(el('<div class="empty-state" style="padding:30px 20px">' + icon("search", 26) + "<p>No results for “" + esc(input.value.trim()) + "”</p></div>"));
            return;
          }
          var groups = {};
          range.slice(0, 40).forEach(function (o) { (groups[o.ev.cal] = groups[o.ev.cal] || []).push(o); });
          Object.keys(groups).forEach(function (calId) {
            var cal = calOf(calId);
            results.appendChild(el('<div class="pal-group">' + esc(cal.name) + "</div>"));
            groups[calId].forEach(function (o) {
              var sub = o.ev.allDay ? fmtDateShort(o.start) + " · All day" : fmtDateShort(o.start) + " · " + fmtTimeRange(o.start, o.end);
              var item = el('<button class="pal-item"><span class="pop-dot" style="background:' + dotOf(cal) + ';margin:0"></span><span class="pi-text"><span class="pi-title">' + esc(o.ev.title) + '</span><br><span class="pi-sub">' + esc(sub) + "</span></span>" + icon("chevR", 15) + "</button>");
              item.addEventListener("click", function () {
                close();
                if (cal.hidden) { cal.hidden = false; Store.updateCalendar(cal.id, { hidden: false }); toast("“" + cal.name + "” is now shown"); }
                state.selected = sod(o.start);
                if (state.view !== "day") { state.prevView = state.view; state.view = "day"; }
                state.cursor = sod(o.start);
                renderAll(false);
                var target = viewWrap.querySelector('[data-occ="' + o.ev.id + ":" + o.start.getTime() + '"]');
                openPopover(o, target || viewWrap);
              });
              results.appendChild(item);
            });
          });
        }
        input.addEventListener("input", draw);
        draw();
      }

      /* ================= Settings ================= */
      var settingsState = { section: "general", pendingView: null };
      function applyTheme() {
        document.documentElement.setAttribute("data-theme", effectiveTheme());
      }
      function openSettings(section) {
        closeMenu(); closePopover();
        settingsState.section = section || settingsState.section || "general";
        settingsState.pendingView = state.view;
        var bd = el('<div class="backdrop"></div>');
        var dlg = el('<div class="settings-dialog" role="dialog" aria-modal="true" aria-label="Settings"></div>');
        var rail = el('<div class="settings-rail"><div class="sr-title">Settings</div></div>');
        var sections = [
          ["general", "sliders", "General"],
          ["appearance", "droplet", "Appearance"],
          ["calendar", "calendar", "Calendar"],
          ["notifications", "bell", "Notifications"],
          ["data", "sync", "Data & sync"],
          ["ai", "cpu", "AI access"],
          ["about", "info", "About"]
        ];
        var pane = el('<div class="settings-pane"></div>');
        sections.forEach(function (s) {
          var b = el('<button class="sr-item' + (settingsState.section === s[0] ? " active" : "") + '">' + icon(s[1], 17) + "<span>" + s[2] + "</span></button>");
          b.addEventListener("click", function () {
            settingsState.section = s[0];
            rail.querySelectorAll(".sr-item").forEach(function (x) { x.classList.remove("active"); });
            b.classList.add("active");
            drawPane();
          });
          rail.appendChild(b);
        });
        dlg.appendChild(rail); dlg.appendChild(pane);
        bd.appendChild(dlg);
        overlayRoot.appendChild(bd);
        function close() {
          var chosen = settingsState.viewSelect && document.contains(settingsState.viewSelect) ? settingsState.viewSelect.value : settingsState.pendingView;
          settingsState.viewSelect = null;
          bd.remove();
          if (chosen && chosen !== state.view) {
            state.view = chosen; state.prevView = null; renderAll(true, 1);
          } else renderAll(false);
        }
        bd.addEventListener("mousedown", function (e) { if (e.target === bd) close(); });
        function drawPane() {
          pane.innerHTML = "";
          var x = el('<button class="icon-btn settings-close" title="Close settings">' + icon("x", 17) + "</button>");
          x.addEventListener("click", close);
          pane.appendChild(x);
          var fn = { general: paneGeneral, appearance: paneAppearance, calendar: paneCalendar, notifications: paneNotifications, data: paneData, ai: paneAI, about: paneAbout }[settingsState.section];
          fn(pane, close);
        }
        drawPane();
      }
      function switchHTML(id, checked) {
        return '<label class="switch"><input type="checkbox" id="' + id + '"' + (checked ? " checked" : "") + '><span class="track"></span><span class="knob"></span></label>';
      }
      function paneHead(pane, title, sub) {
        pane.appendChild(el("<h2>" + esc(title) + "</h2>"));
        if (sub) pane.appendChild(el('<p class="pane-sub">' + esc(sub) + "</p>"));
      }
      function paneGeneral(pane) {
        paneHead(pane, "General", "The basics of your daylight account.");
        var g = el('<div class="set-group"><div class="set-group-title">Profile</div>' +
          '<div class="field"><label for="gsName">First name</label><input class="text-input" id="gsName" style="max-width:300px" value="' + esc(state.firstName) + '"><p class="inline-note">Used in the greeting at the top of your calendar.</p></div>' +
          '<div class="field"><label>Email</label><input class="text-input" style="max-width:300px" value="joeynatale28@gmail.com" disabled></div></div>');
        pane.appendChild(g);
        var nameIn = g.querySelector("#gsName");
        nameIn.addEventListener("input", function () { state.firstName = nameIn.value.trim() || "Joey"; renderGreeting(); });
        var g2 = el('<div class="set-group"><div class="set-group-title">Preferences</div>' +
          '<div class="set-row switch-row"><span><span class="sw-label">Time zone</span><div class="sw-sub">Shown over the time gutter in Week and Day views.</div></span>' +
          '<select class="set-select" id="gsTz" style="max-width:230px"><option value="EST">Eastern (EST)</option><option value="CST">Central (CST)</option><option value="MST">Mountain (MST)</option><option value="PST">Pacific (PST)</option></select></div>' +
          '<div class="set-row switch-row"><span><span class="sw-label">Reduce motion</span><div class="sw-sub">Makes view transitions and popups appear instantly.</div></span>' + switchHTML("gsRM", state.reduceMotion) + "</div></div>");
        pane.appendChild(g2);
        var tz = g2.querySelector("#gsTz");
        tz.value = state.tzLabel;
        tz.addEventListener("change", function () { state.tzLabel = tz.value; renderView(false); });
        g2.querySelector("#gsRM").addEventListener("change", function (e) {
          state.reduceMotion = e.target.checked;
          document.body.classList.toggle("reduce-motion", state.reduceMotion);
        });
      }
      function paneAppearance(pane) {
        paneHead(pane, "Appearance", "Pick a theme. Each calendar's color now lives in that calendar's ⋯ menu in the sidebar.");
        var g = el('<div class="set-group"><div class="set-group-title">Theme</div><div class="theme-cards"></div></div>');
        var cards = g.querySelector(".theme-cards");
        [["light", "sun", "Light", "tc-light"], ["dark", "moon", "Dark", "tc-dark"], ["system", "monitor", "System", "tc-system"]].forEach(function (t) {
          var c = el('<button class="theme-card' + (state.themeMode === t[0] ? " sel" : "") + '"><span class="tc-preview ' + t[3] + '" style="display:block"></span><span class="tc-name">' + icon(t[1], 15) + t[2] + "</span></button>");
          c.addEventListener("click", function () {
            state.themeMode = t[0]; applyTheme();
            cards.querySelectorAll(".theme-card").forEach(function (x) { x.classList.remove("sel"); });
            c.classList.add("sel");
            renderSidebar(); renderView(false);
          });
          cards.appendChild(c);
        });
        pane.appendChild(g);
        var note = el('<div class="set-group"><div class="set-group-title">Calendar colors</div><p class="pane-sub" style="margin:0">Open any calendar\'s <b style="color:var(--text)">⋯</b> menu in the sidebar and pick a color under <b style="color:var(--text)">Appearance · Color</b>. The change applies everywhere right away.</p></div>');
        pane.appendChild(note);
      }
      function paneCalendar(pane) {
        paneHead(pane, "Calendar", "How your calendar opens and what it shows.");
        var g = el('<div class="set-group">' +
          '<div class="field"><label for="csView">Default Calendar View</label><select class="set-select" id="csView">' +
          '<option value="month">Month</option><option value="week">Week</option><option value="day">Day</option><option value="agenda">Agenda</option></select>' +
          '<p class="inline-note">The view daylight opens to. It applies when you close Settings.</p></div>' +
          '<div class="set-row switch-row"><span><span class="sw-label">Week numbers</span><div class="sw-sub">Show the ISO week number along the left edge of Month view.</div></span>' + switchHTML("csWN", state.weekNumbers) + "</div>" +
          '<div class="set-row switch-row"><span><span class="sw-label">Show declined events</span><div class="sw-sub">Declined events stay visible on your calendar.</div></span>' + switchHTML("csSD", state.showDeclined) + "</div></div>");
        pane.appendChild(g);
        var sel = g.querySelector("#csView");
        sel.value = settingsState.pendingView || state.view;
        settingsState.viewSelect = sel;
        sel.addEventListener("change", function () {
          settingsState.pendingView = sel.value;
          if (sel.value !== state.view) { state.view = sel.value; state.prevView = null; renderHeader(); renderView(true, 1); renderSidebar(); }
        });
        g.querySelector("#csWN").addEventListener("change", function (e) { state.weekNumbers = e.target.checked; renderView(false); });
        g.querySelector("#csSD").addEventListener("change", function (e) { state.showDeclined = e.target.checked; renderView(false); renderSidebar(); });
      }
      function paneNotifications(pane) {
        paneHead(pane, "Notifications", "Reminders for the events on your calendar.");
        var status = ("Notification" in window) ? Notification.permission : "unsupported";
        var g = el('<div class="set-group">' +
          '<div class="set-row switch-row"><span><span class="sw-label">Browser notifications</span><div class="sw-sub" id="ntStatus">' +
          (status === "granted" ? "Notifications are on for this browser." : status === "denied" ? "Notifications are blocked in this browser's settings." : status === "unsupported" ? "This browser does not support notifications." : "Notifications are not turned on yet.") +
          '</div></span><button class="btn-ghost" id="ntBtn">Enable notifications</button></div>' +
          '<div class="set-row switch-row"><span><span class="sw-label">Remind me 15 minutes before</span><div class="sw-sub">A heads-up shortly before each timed event starts.</div></span>' + switchHTML("nt15", true) + "</div>" +
          '<div class="set-row switch-row"><span><span class="sw-label">Daily summary at 7 AM</span><div class="sw-sub">One notification with everything on the day ahead.</div></span>' + switchHTML("ntDaily", false) + "</div></div>");
        pane.appendChild(g);
        g.querySelector("#ntBtn").addEventListener("click", function () {
          if (!("Notification" in window)) { toast("Notifications are not supported here"); return; }
          Notification.requestPermission().then(function (perm) {
            g.querySelector("#ntStatus").textContent = perm === "granted" ? "Notifications are on for this browser." : perm === "denied" ? "Notifications are blocked in this browser's settings." : "Notifications are not turned on yet.";
            if (perm === "granted") toast("Notifications enabled");
          });
        });
      }
      function paneData(pane) {
        paneHead(pane, "Data & sync", "Calendar feeds daylight keeps up to date for you.");
        var g = el('<div class="set-group"><div class="set-group-title">Subscriptions</div><div id="feedList"></div>' +
          '<div class="form-grid" style="grid-template-columns:1fr auto;align-items:end"><div class="field" style="margin-bottom:0"><label for="fdUrl">Feed URL</label><span class="input-clear-wrap" style="display:block"><input class="text-input" id="fdUrl" placeholder="https://example.com/calendar.ics"><button class="input-clear" id="fdClear" title="Clear feed URL" aria-label="Clear feed URL">' + icon("x", 12) + '</button></span><div class="field-err" id="fdErr"></div></div>' +
          '<button class="btn-primary" style="margin-left:0" id="fdAdd">Add feed</button></div></div>');
        pane.appendChild(g);
        var list = g.querySelector("#feedList");
        function drawFeeds() {
          list.innerHTML = "";
          if (!state.feeds.length) list.appendChild(el('<div class="empty-state" style="padding:22px">' + icon("sync", 24) + "<p>No subscriptions yet</p></div>"));
          state.feeds.forEach(function (f) {
            var row = el('<div class="feed-row">' + icon("sync", 16) + '<span class="fr-url">' + esc(f.url) + '<br><span class="fr-sub">' + esc(f.name || "Calendar feed") + ' · Synced just now</span></span><button class="icon-btn" title="Remove feed">' + icon("trash", 15) + "</button></div>");
            row.querySelector(".icon-btn").addEventListener("click", function () {
              state.feeds = state.feeds.filter(function (x) { return x !== f; });
              drawFeeds(); toast("Feed removed");
            });
            list.appendChild(row);
          });
        }
        drawFeeds();
        var urlIn = g.querySelector("#fdUrl"), err = g.querySelector("#fdErr");
        var fdClear = g.querySelector("#fdClear");
        urlIn.addEventListener("input", function () { fdClear.classList.toggle("show", urlIn.value.length > 0); err.classList.remove("show"); urlIn.classList.remove("err"); });
        fdClear.addEventListener("click", function () { urlIn.value = ""; fdClear.classList.remove("show"); urlIn.focus(); });
        g.querySelector("#fdAdd").addEventListener("click", function () {
          var v = urlIn.value.trim();
          err.classList.remove("show"); urlIn.classList.remove("err");
          function fail(msg) { err.textContent = msg; err.classList.add("show"); urlIn.classList.add("err"); }
          if (!/^https?:\/\/\S+\.\S+/.test(v)) return fail("Enter a valid feed URL");
          if (state.feeds.some(function (f) { return f.url === v; })) return fail("That feed is already subscribed");
          state.feeds.push({ url: v, name: "Calendar feed" });
          urlIn.value = ""; drawFeeds(); toast("Feed added");
        });
      }
      function paneAI(pane) {
        paneHead(pane, "AI access", "Tokens let your AI tools read and update this calendar over MCP.");
        var g = el('<div class="set-group"><div class="set-group-title">Tokens</div><div id="tkList"></div>' +
          '<button class="btn-ghost" id="tkNew">' + icon("plus", 15) + "Create token</button>" +
          '<p class="inline-note">A token can be revoked at any time. Revoking takes effect immediately.</p></div>');
        pane.appendChild(g);
        var list = g.querySelector("#tkList");
        function drawTokens() {
          list.innerHTML = "";
          if (!state.tokens.length) list.appendChild(el('<div class="empty-state" style="padding:22px">' + icon("key", 24) + "<p>No tokens yet</p></div>"));
          state.tokens.forEach(function (t) {
            var row = el('<div class="token-row">' + icon("key", 16) + '<span class="tk-val">' + esc(t.label) + '<br><span class="tk-sub">Created ' + esc(t.created) + "</span></span>" + '<button class="btn-ghost" style="height:31px;color:var(--danger);border-color:var(--line)">Revoke</button></div>');
            row.querySelector("button").addEventListener("click", function () {
              state.tokens = state.tokens.filter(function (x) { return x.id !== t.id; });
              drawTokens(); toast("Token revoked");
            });
            list.appendChild(row);
          });
        }
        drawTokens();
        g.querySelector("#tkNew").addEventListener("click", function () {
          state.tokens.push({ id: ++uid, label: "MCP access token", created: fmtDateShort(new Date()) });
          drawTokens(); toast("Token created");
        });
      }
      function paneAbout(pane) {
        paneHead(pane, "About", "");
        var g = el('<div><div class="about-logo"><span class="logo-tile">' + icon("sunrise", 25) + '</span><span><span style="font-size:17px;font-weight:700;display:block">daylight.</span><span style="color:var(--muted);font-size:13px">Version 1.0 · Personal calendar</span></span></div>' +
          '<div class="set-group"><div class="set-group-title">What is new in 1.0</div><ul class="changelog">' +
          "<li>Month, Week, Day, and Agenda views share one calm design.</li>" +
          "<li>Multi-day events now draw as a single bar across the week.</li>" +
          "<li>Settings opens in one fixed-size popup from anywhere in the app.</li>" +
          "<li>Calendar colors now live in each calendar's ⋯ menu in the sidebar.</li>" +
          "<li>Only US Holidays is shown by default; turn the others on from the sidebar checkboxes.</li>" +
          "<li>Add Event now sits in the sidebar above the mini calendar.</li>" +
          "<li>The sidebar mini calendar browses on its own — paging it no longer moves the main calendar, and paging the main calendar no longer moves it.</li>" +
          "<li>Subscribed calendars like US Holidays are read-only: no creating, editing, or deleting their events.</li>" +
          "<li>Clicking an event now opens a Google Calendar–style detail popover.</li>" +
          "</ul></div>" +
          '<div style="display:flex;gap:9px;flex-wrap:wrap;margin-bottom:6px"><button class="btn-primary" style="margin-left:0" id="abExport">' + "Export UI code" + '</button><button class="btn-ghost" id="abCheck">Check for updates</button></div>' +
          '<p class="inline-note">daylight is your calendar, kept simple on purpose.</p></div>');
        pane.appendChild(g);
        var abExp = g.querySelector("#abExport");
        abExp.innerHTML = icon("download", 15) + "<span>Export UI code</span>";
        abExp.addEventListener("click", exportCode);
        g.querySelector("#abCheck").addEventListener("click", function () { toast("You are on the latest version"); });
      }

      /* ================= Keyboard & init ================= */
      document.addEventListener("keydown", function (e) {
        var mod = e.metaKey || e.ctrlKey;
        if (mod && e.key === ",") { e.preventDefault(); if (!overlayRoot.children.length) openSettings("general"); else closeTopmostOverlay(); }
        if (mod && (e.key === "k" || e.key === "K")) { e.preventDefault(); openSearch(); }
        if (e.key === "Escape") {
          if (isDrawerOpen()) { closeDrawer(); e.preventDefault(); return; }
          if (closeTopmostOverlay()) { e.preventDefault(); }
        }
      });
      if (window.matchMedia) {
        window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", function () {
          if (state.themeMode === "system") { applyTheme(); renderAll(false); }
        });
      }
      applyTheme();
      renderAll(false);

      /* ================= Recurring scope dialog ================= */
      function openScopeDialog(opts) {
        var bd = el('<div class="backdrop"><div class="dialog" style="width:420px">' +
          '<div class="dialog-head"><span class="dialog-title">' + esc(opts.verb) + ' recurring event</span><button class="icon-btn" data-x title="Close" aria-label="Close">' + icon("x", 17) + "</button></div>" +
          '<div class="dialog-body"><p style="margin:0 0 14px;font-size:14px;color:var(--muted);line-height:1.55">This event is part of a repeating series. How much of the series should change?</p>' +
          '<div class="scope-opts">' +
          '<button class="scope-opt" data-scope="only">Only this event</button>' +
          '<button class="scope-opt" data-scope="following">This and following events</button>' +
          '<button class="scope-opt" data-scope="all">All events in the series</button>' +
          "</div></div>" +
          '<div class="dialog-foot"><button class="btn-ghost" data-cancel>Cancel</button></div></div></div>');
        overlayRoot.appendChild(bd);
        var done = false;
        function close() { bd.remove(); }
        function cancel() { close(); if (opts.onCancel) opts.onCancel(); }
        bd.querySelector("[data-x]").addEventListener("click", cancel);
        bd.querySelector("[data-cancel]").addEventListener("click", cancel);
        bd.addEventListener("mousedown", function (e) { if (e.target === bd) cancel(); });
        bd.querySelectorAll("[data-scope]").forEach(function (b) {
          b.addEventListener("click", function () { if (done) return; done = true; close(); opts.onPick(b.getAttribute("data-scope")); });
        });
      }

      /* ================= Settings: Calendar pane (persists Default View) ================= */
      function paneCalendar(pane) {
        paneHead(pane, "Calendar", "How your calendar opens and what it shows.");
        var g = el('<div class="set-group">' +
          '<div class="field"><label for="csView">Default Calendar View</label><select class="set-select" id="csView">' +
          '<option value="month">Month</option><option value="week">Week</option><option value="day">Day</option><option value="agenda">Agenda</option></select>' +
          '<p class="inline-note">The view daylight opens to. It applies when you close Settings.</p></div>' +
          '<div class="set-row switch-row"><span><span class="sw-label">Week numbers</span><div class="sw-sub">Show the ISO week number along the left edge of Month view.</div></span>' + switchHTML("csWN", state.weekNumbers) + "</div>" +
          '<div class="set-row switch-row"><span><span class="sw-label">Show declined events</span><div class="sw-sub">Declined events stay visible on your calendar.</div></span>' + switchHTML("csSD", state.showDeclined) + "</div></div>");
        pane.appendChild(g);
        var sel = g.querySelector("#csView");
        sel.value = settingsState.pendingView || state.view;
        settingsState.viewSelect = sel;
        sel.addEventListener("change", function () {
          settingsState.pendingView = sel.value;
          Store.setSettings({ defaultView: sel.value });
          if (sel.value !== state.view) { state.view = sel.value; state.prevView = null; renderHeader(); renderView(true, 1); renderSidebar(); }
        });
        g.querySelector("#csWN").addEventListener("change", function (e) { state.weekNumbers = e.target.checked; renderView(false); });
        g.querySelector("#csSD").addEventListener("change", function (e) { state.showDeclined = e.target.checked; renderView(false); renderSidebar(); });
      }

      /* ================= Settings: Notifications pane (wired switches) ================= */
      function paneNotifications(pane) {
        paneHead(pane, "Notifications", "Reminders for the events on your calendar.");
        var status = ("Notification" in window) ? Notification.permission : "unsupported";
        var g = el('<div class="set-group">' +
          '<div class="set-row switch-row"><span><span class="sw-label">Browser notifications</span><div class="sw-sub" id="ntStatus">' +
          (status === "granted" ? "Notifications are on for this browser." : status === "denied" ? "Notifications are blocked in this browser's settings." : status === "unsupported" ? "This browser does not support notifications." : "Notifications are not turned on yet.") +
          '</div></span><button class="btn-ghost" id="ntBtn">Enable notifications</button></div>' +
          '<div class="set-row switch-row"><span><span class="sw-label">Remind me 15 minutes before</span><div class="sw-sub">A heads-up shortly before each timed event starts, while daylight is open.</div></span>' + switchHTML("nt15", !!Store.data.settings.notify15) + "</div>" +
          '<div class="set-row switch-row"><span><span class="sw-label">Daily summary at 7 AM</span><div class="sw-sub">One notification with everything on the day ahead, while daylight is open.</div></span>' + switchHTML("ntDaily", !!Store.data.settings.notifyDaily) + "</div></div>");
        pane.appendChild(g);
        g.querySelector("#ntBtn").addEventListener("click", function () {
          if (!("Notification" in window)) { toast("Notifications are not supported here"); return; }
          Notification.requestPermission().then(function (perm) {
            g.querySelector("#ntStatus").textContent = perm === "granted" ? "Notifications are on for this browser." : perm === "denied" ? "Notifications are blocked in this browser's settings." : "Notifications are not turned on yet.";
            if (perm === "granted") toast("Notifications enabled");
          });
        });
        g.querySelector("#nt15").addEventListener("change", function (e) { Store.setSettings({ notify15: e.target.checked }); toast(e.target.checked ? "15-minute reminders on" : "15-minute reminders off"); });
        g.querySelector("#ntDaily").addEventListener("change", function (e) { Store.setSettings({ notifyDaily: e.target.checked }); toast(e.target.checked ? "Daily summary on" : "Daily summary off"); });
      }

      /* ================= Settings: AI pane (honest — needs the server version) ================= */
      function paneAI(pane) {
        paneHead(pane, "AI access", "Tokens let AI tools read and update this calendar over MCP.");
        var g = el('<div class="set-group"><div class="empty-state" style="padding:26px">' + icon("cpu", 26) +
          "<p>AI access needs the server version of daylight. This build keeps everything locally in your browser — there is no server endpoint for a token to connect to, so tokens aren't offered here rather than faked.</p></div></div>");
        pane.appendChild(g);
      }

      /* ================= Settings: Data & sync (real feeds, .ics import, backup) ================= */
      function fetchFeedText(url) {
        var ctl = ("AbortController" in window) ? new AbortController() : null;
        var timer = ctl ? setTimeout(function () { ctl.abort(); }, 15000) : null;
        return fetch(url, { signal: ctl ? ctl.signal : undefined }).then(function (r) {
          if (timer) clearTimeout(timer);
          if (!r.ok) throw new Error("HTTP " + r.status);
          return r.text();
        }).catch(function (e) { if (timer) clearTimeout(timer); throw e; });
      }
      function pickFeedColor() {
        var order = ["teal", "rose", "plum", "green", "violet", "blue", "gray", "amber"];
        var used = {};
        Store.data.calendars.forEach(function (c) { used[c.color] = true; });
        for (var i = 0; i < order.length; i++) if (!used[order[i]]) return order[i];
        return order[Store.data.calendars.length % order.length];
      }
      function paneData(pane) {
        paneHead(pane, "Data & sync", "Calendar feeds daylight keeps up to date for you. Subscribed calendars are read-only.");
        var g = el('<div class="set-group"><div class="set-group-title">Subscriptions</div><div id="feedList"></div>' +
          '<div class="form-grid" style="grid-template-columns:1fr auto;align-items:end"><div class="field" style="margin-bottom:0"><label for="fdUrl">Feed URL</label><span class="input-clear-wrap" style="display:block"><input class="text-input" id="fdUrl" placeholder="https://example.com/calendar.ics"><button class="input-clear" id="fdClear" title="Clear feed URL" aria-label="Clear feed URL">' + icon("x", 12) + '</button></span><div class="field-err" id="fdErr"></div></div>' +
          '<button class="btn-primary" style="margin-left:0" id="fdAdd">Add feed</button></div>' +
          '<p class="inline-note">Feeds are fetched straight from your browser. If a publisher blocks cross-origin requests (CORS), the fetch will fail — in that case, import the .ics file instead.</p>' +
          '<div class="backup-row" style="margin-top:10px"><button class="btn-ghost" id="fdImport">' + icon("download", 15) + '<span>Import .ics file</span></button><input type="file" id="fdFile" accept=".ics,text/calendar" style="display:none"></div></div>');
        pane.appendChild(g);
        var g2 = el('<div class="set-group"><div class="set-group-title">Backup</div>' +
          '<p class="pane-sub" style="margin:0 0 12px">Your calendars, events, tasks, and settings live in this browser. Export a backup file to keep them safe or move them to another device.</p>' +
          '<div class="backup-row"><button class="btn-ghost" id="bkExport">Export data (JSON)</button><button class="btn-ghost" id="bkImport">Import data (JSON)</button><input type="file" id="bkFile" accept=".json,application/json" style="display:none"></div></div>');
        pane.appendChild(g2);

        var list = g.querySelector("#feedList");
        function drawFeeds() {
          list.innerHTML = "";
          var subs = Store.data.calendars.filter(function (c) { return c.subscribed; });
          if (!subs.length) list.appendChild(el('<div class="empty-state" style="padding:22px">' + icon("sync", 24) + "<p>No subscriptions yet</p></div>"));
          subs.forEach(function (cal) {
            var count = Store.data.events.filter(function (e) { return e.cal === cal.id; }).length;
            var src = cal.feedUrl ? esc(cal.feedUrl) : (cal.source === "file" ? "Imported .ics file" : "Bundled snapshot");
            var sync = cal.lastSync ? ("Synced " + fmtDateShort(new Date(cal.lastSync)) + " · " + fmtTime(new Date(cal.lastSync))) : "Not synced yet";
            var row = el('<div class="feed-row">' + icon("sync", 16) + '<span class="fr-url">' + esc(cal.name) + " · " + src + '<br><span class="fr-sub">' + count + (count === 1 ? " event" : " events") + " · " + esc(sync) + '</span></span><span class="fr-actions">' +
              (cal.feedUrl ? '<button class="icon-btn" data-refresh title="Refresh feed">' + icon("sync", 15) + "</button>" : "") +
              '<button class="icon-btn" data-remove title="Unsubscribe">' + icon("trash", 15) + "</button></span></div>");
            var rb = row.querySelector("[data-refresh]");
            if (rb) rb.addEventListener("click", function () { refreshFeed(cal, drawFeeds); });
            row.querySelector("[data-remove]").addEventListener("click", function () {
              openConfirm({
                title: "Unsubscribe from “" + cal.name + "”?",
                body: "This removes the calendar and its " + count + " event" + (count === 1 ? "" : "s") + " from daylight.",
                confirmLabel: "Unsubscribe", danger: true,
                fn: function () {
                  Store.deleteCalendar(cal.id); syncFromStore(); drawFeeds(); renderSidebar(); renderView(false); toast("Subscription removed");
                }
              });
            });
            list.appendChild(row);
          });
        }
        function refreshFeed(cal, after) {
          toast("Refreshing “" + cal.name + "”…");
          fetchFeedText(cal.feedUrl).then(function (text) {
            var parsed = ICAL.parse(text);
            if (!parsed.events.length) { toast("That feed returned no events"); return; }
            var res = Store.syncFeed(cal.id, parsed);
            syncFromStore(); if (after) after(); renderSidebar(); renderView(false);
            toast("Feed refreshed — " + res.count + (res.count === 1 ? " event" : " events"));
          }).catch(function () {
            toast("Couldn't refresh that feed — the publisher may be blocking cross-origin requests (CORS)");
          });
        }
        drawFeeds();
        var urlIn = g.querySelector("#fdUrl"), err = g.querySelector("#fdErr");
        var fdClear = g.querySelector("#fdClear");
        urlIn.addEventListener("input", function () { fdClear.classList.toggle("show", urlIn.value.length > 0); err.classList.remove("show"); urlIn.classList.remove("err"); });
        fdClear.addEventListener("click", function () { urlIn.value = ""; fdClear.classList.remove("show"); urlIn.focus(); });
        g.querySelector("#fdAdd").addEventListener("click", function () {
          var v = urlIn.value.trim();
          err.classList.remove("show"); urlIn.classList.remove("err");
          function fail(msg) { err.textContent = msg; err.classList.add("show"); urlIn.classList.add("err"); }
          if (!/^https?:\/\/\S+\.\S+/.test(v)) return fail("Enter a valid feed URL");
          if (Store.findFeedByUrl(v)) return fail("That feed is already subscribed");
          var btn = g.querySelector("#fdAdd");
          btn.disabled = true; btn.textContent = "Adding…";
          fetchFeedText(v).then(function (text) {
            btn.disabled = false; btn.textContent = "Add feed";
            var parsed = ICAL.parse(text);
            if (!parsed.events.length) return fail("That URL didn't return any calendar events");
            var name = parsed.name || "Calendar feed";
            var created = Store.createCalendar({ name: name, color: pickFeedColor(), subscribed: true, feedUrl: v, source: "feed" });
            if (!created.ok) return fail(created.error || "Could not add that feed");
            var res = Store.syncFeed(created.calendar.id, parsed);
            syncFromStore(); urlIn.value = ""; fdClear.classList.remove("show"); drawFeeds(); renderSidebar(); renderView(false);
            toast("Feed added — " + res.count + (res.count === 1 ? " event" : " events"));
          }).catch(function () {
            btn.disabled = false; btn.textContent = "Add feed";
            fail("Couldn't fetch that feed — the publisher may be blocking cross-origin requests (CORS). Try importing the .ics file instead.");
          });
        });
        var fileIn = g.querySelector("#fdFile");
        g.querySelector("#fdImport").addEventListener("click", function () { fileIn.click(); });
        fileIn.addEventListener("change", function () {
          var file = fileIn.files && fileIn.files[0];
          if (!file) return;
          file.text().then(function (text) {
            var parsed = ICAL.parse(text);
            if (!parsed.events.length) { toast("That file didn't contain any calendar events"); return; }
            var name = parsed.name || file.name.replace(/\.ics$/i, "") || "Imported calendar";
            var created = Store.createCalendar({ name: name, color: pickFeedColor(), subscribed: true, feedUrl: null, source: "file" });
            if (!created.ok) { toast(created.error || "Could not import that file"); return; }
            var res = Store.syncFeed(created.calendar.id, parsed);
            syncFromStore(); drawFeeds(); renderSidebar(); renderView(false);
            toast("Imported — " + res.count + (res.count === 1 ? " event" : " events"));
          }).catch(function () { toast("That file could not be read"); });
          fileIn.value = "";
        });
        g2.querySelector("#bkExport").addEventListener("click", function () {
          var blob = new Blob([Store.exportJSON()], { type: "application/json" });
          var url = URL.createObjectURL(blob);
          var a = document.createElement("a");
          a.href = url; a.download = "daylight-backup.json";
          document.body.appendChild(a); a.click(); a.remove();
          setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
          toast("Backup downloaded");
        });
        var bkFile = g2.querySelector("#bkFile");
        g2.querySelector("#bkImport").addEventListener("click", function () { bkFile.click(); });
        bkFile.addEventListener("change", function () {
          var file = bkFile.files && bkFile.files[0];
          if (!file) return;
          file.text().then(function (text) {
            var res = Store.importJSON(text);
            if (!res.ok) { toast(res.error || "That backup could not be restored"); return; }
            toast("Backup restored — reloading");
            setTimeout(function () { location.reload(); }, 700);
          }).catch(function () { toast("That file could not be read"); });
          bkFile.value = "";
        });
      }

      /* ================= Tasks view ================= */
      function openTasks() {
        state.tasksView = true;
        renderTasksView();
        closeDrawer();
      }
      function renderTasksView() {
        renderGreeting(); renderHeader(); renderSidebar();
        var hdr = document.getElementById("headerBand");
        var tw = hdr.querySelector(".head-title-wrap");
        if (tw) {
          var titleEl = tw.querySelector(".head-title"); if (titleEl) titleEl.textContent = "Tasks";
          var subEl = tw.querySelector(".head-sub"); if (subEl) subEl.textContent = "Your to-do list";
        }
        var pill = hdr.querySelector(".nav-pill"); if (pill) pill.remove();
        var back = hdr.querySelector(".back-btn"); if (back) back.remove();
        viewWrap.innerHTML = "";
        var scroll = el('<div class="tasks-scroll"></div>');
        var inner = el('<div class="tasks-inner"></div>');
        var counts = { all: 0, todo: 0, done: 0 };
        Store.data.tasks.forEach(function (t) { counts.all++; if (t.done) counts.done++; else counts.todo++; });
        var filters = el('<div class="tasks-filters"></div>');
        [["all", "All"], ["todo", "To do"], ["done", "Completed"]].forEach(function (pair) {
          var b = el('<button class="' + (state.taskFilter === pair[0] ? "active" : "") + '">' + pair[1] + '<span class="tf-count">' + counts[pair[0]] + "</span></button>");
          b.addEventListener("click", function () { state.taskFilter = pair[0]; renderTasksView(); });
          filters.appendChild(b);
        });
        inner.appendChild(filters);
        var addRow = el('<div class="task-add"><input class="text-input" id="tkTitle" placeholder="Add a task and press Enter"><input class="text-input" id="tkDue" type="date" style="max-width:175px;flex:none" title="Due date (optional)"><button class="btn-primary" style="margin-left:0" id="tkAdd">Add</button></div>');
        inner.appendChild(addRow);
        var titleIn = addRow.querySelector("#tkTitle"), dueIn = addRow.querySelector("#tkDue");
        function addTask() {
          var title = titleIn.value.trim();
          if (!title) { titleIn.focus(); return; }
          var dueMs = null;
          if (dueIn.value) { var p = dueIn.value.split("-"); dueMs = new Date(+p[0], +p[1] - 1, +p[2]).getTime(); }
          Store.createTask({ title: title, dueMs: dueMs });
          renderTasksView();
        }
        addRow.querySelector("#tkAdd").addEventListener("click", addTask);
        titleIn.addEventListener("keydown", function (e) { if (e.key === "Enter") addTask(); });
        var list = Store.data.tasks.filter(function (t) {
          if (state.taskFilter === "todo") return !t.done;
          if (state.taskFilter === "done") return t.done;
          return true;
        }).slice().sort(function (a, b) {
          if (a.done !== b.done) return a.done ? 1 : -1;
          var ad = a.dueMs || Infinity, bd2 = b.dueMs || Infinity;
          return ad - bd2;
        });
        if (!list.length) {
          inner.appendChild(el('<div class="empty-state">' + icon("list", 28) + "<p>" + (state.taskFilter === "done" ? "No completed tasks yet" : state.taskFilter === "todo" ? "Nothing to do — nice" : "No tasks yet") + "</p></div>"));
        }
        list.forEach(function (t) {
          var row = el('<div class="task-row"></div>');
          var chk = el('<button class="task-check' + (t.done ? " done" : "") + '" aria-label="' + (t.done ? "Mark not done" : "Mark done") + '" aria-pressed="' + t.done + '"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg></button>');
          chk.addEventListener("click", function () { Store.updateTask(t.id, { done: !t.done }); renderTasksView(); });
          row.appendChild(chk);
          var main = el('<span class="task-main"><span class="task-title' + (t.done ? " done" : "") + '" title="Double-click to rename">' + esc(t.title) + "</span>" +
            (t.dueMs ? '<span class="task-meta">' + icon("calendar", 12) + "<span>Due " + esc(fmtDateShort(new Date(t.dueMs))) + "</span></span>" : "") + "</span>");
          main.querySelector(".task-title").addEventListener("dblclick", function () { startTaskRename(main, t); });
          row.appendChild(main);
          var del = el('<button class="icon-btn task-del" title="Delete task" aria-label="Delete task">' + icon("trash", 15) + "</button>");
          del.addEventListener("click", function () { Store.deleteTask(t.id); renderTasksView(); toast("Task deleted"); });
          row.appendChild(del);
          inner.appendChild(row);
        });
        scroll.appendChild(inner);
        viewWrap.appendChild(scroll);
        titleIn.focus();
      }
      function startTaskRename(main, t) {
        var titleEl = main.querySelector(".task-title");
        var input = el('<input class="cal-rename" value="' + esc(t.title) + '">');
        titleEl.replaceWith(input);
        input.focus(); input.select();
        var finished = false;
        function done(save) {
          if (finished) return; finished = true;
          if (save && input.value.trim()) Store.updateTask(t.id, { title: input.value.trim() });
          renderTasksView();
        }
        input.addEventListener("blur", function () { done(true); });
        input.addEventListener("keydown", function (e) { if (e.key === "Enter") done(true); if (e.key === "Escape") done(false); });
      }
      function injectTasksRow() {
        var open = Store.data.tasks.filter(function (t) { return !t.done; }).length;
        var row = el('<button class="side-row' + (state.tasksView ? " active" : "") + '" title="Tasks">' + icon("list", 18) + '<span class="rail-hide">Tasks</span>' + (open ? '<span class="tf-count rail-hide" style="margin-left:auto">' + open + "</span>" : "") + "</button>");
        row.addEventListener("click", function () { closeDrawer(); openTasks(); });
        var pw = sidebarEl.querySelector(".profile-wrap");
        if (pw) sidebarEl.insertBefore(row, pw); else sidebarEl.appendChild(row);
      }

      /* ================= Persistence wiring =================
         Render entry points double as save points for the lightweight
         runtime-owned state (settings mirrors, navigation, calendar
         name/color/visibility). Event records only change via Store. */
      var _renderAll = renderAll;
      renderAll = function (animate, dir) { state.tasksView = false; _renderAll(animate, dir); persistLocal(); };
      var _renderView = renderView;
      renderView = function (animate, dir) { _renderView(animate, dir); persistLocal(); };
      var _renderSidebar = renderSidebar;
      renderSidebar = function () { _renderSidebar(); injectTasksRow(); persistLocal(); };
      var _renderGreeting = renderGreeting;
      renderGreeting = function () { _renderGreeting(); persistLocal(); };
      document.addEventListener("change", function () { persistLocal(); });
      window.addEventListener("beforeunload", function () { persistLocal(); });

      /* ================= Drag and drop =================
         Pointer-based. Time-grid cards: move (day change in Week) and
         bottom-edge resize, 15-minute snap. Month chips and all-day bars:
         move by whole days. Dragging on empty Month cells creates a range;
         dragging on empty time-grid space creates a timed range. Escape
         cancels. Subscribed calendars are refused up front and again at
         the Store gate on commit. */
      var dragCtx = null;
      var suppressClickUntil = 0;
      document.addEventListener("click", function (e) {
        if (Date.now() < suppressClickUntil) { e.stopPropagation(); e.preventDefault(); suppressClickUntil = 0; }
      }, true);
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && dragCtx) { e.stopPropagation(); cancelDrag(); }
      }, true);

      function monthGridInfo() {
        var grid = viewWrap.querySelector(".month-grid");
        if (!grid) return null;
        var rect = grid.getBoundingClientRect();
        var wn = state.weekNumbers ? 30 : 0;
        var start = sundayOf(new Date(state.cursor.getFullYear(), state.cursor.getMonth(), 1));
        return { rect: rect, wn: wn, start: start, cw: (rect.width - wn) / 7, ch: rect.height / 6 };
      }
      function monthDateAt(x, y) {
        var info = monthGridInfo();
        if (!info) return null;
        var col = Math.floor((x - info.rect.left - info.wn) / info.cw);
        var row = Math.floor((y - info.rect.top) / info.ch);
        if (col < 0 || col > 6 || row < 0 || row > 5) return null;
        return addDays(info.start, row * 7 + col);
      }
      function monthCellDate(cellEl) {
        var info = monthGridInfo();
        if (!info) return null;
        var r = cellEl.getBoundingClientRect();
        var col = Math.round((r.left - info.rect.left - info.wn) / info.cw);
        var row = Math.round((r.top - info.rect.top) / info.ch);
        return addDays(info.start, row * 7 + col);
      }
      function timeGridPoint(x, y) {
        var body = viewWrap.querySelector(".tg-body");
        if (!body) return null;
        var rect = body.getBoundingClientRect();
        var numDays = state.view === "week" ? 7 : 1;
        var colW = (rect.width - 56) / numDays;
        var col = Math.max(0, Math.min(numDays - 1, Math.floor((x - rect.left - 56) / colW)));
        var firstDay = state.view === "week" ? sundayOf(state.cursor) : sod(state.cursor);
        var mins = Math.max(0, Math.min(24 * 60 - 15, Math.round(((y - rect.top) / HOUR_PX * 60) / 15) * 15));
        return { date: addDays(firstDay, col), mins: mins };
      }
      function clearRangeSel() {
        viewWrap.querySelectorAll(".range-sel").forEach(function (n) { n.classList.remove("range-sel"); });
      }
      function paintRangeSel() {
        if (!dragCtx || !dragCtx.cells) return;
        var a = dragCtx.startDate <= dragCtx.curDate ? dragCtx.startDate : dragCtx.curDate;
        var b = dragCtx.startDate <= dragCtx.curDate ? dragCtx.curDate : dragCtx.startDate;
        dragCtx.cells.forEach(function (c) {
          c.el.classList.toggle("range-sel", c.date >= a && c.date <= b);
        });
      }
      function dragMove(e) {
        if (!dragCtx) return;
        var dx = e.clientX - dragCtx.x0, dy = e.clientY - dragCtx.y0;
        if (!dragCtx.started) {
          if (Math.abs(dx) + Math.abs(dy) < 6) return;
          dragCtx.started = true;
          document.body.classList.add("dragging");
          if (dragCtx.kind === "occ") {
            var cal = calOf(dragCtx.ev.cal);
            var g = el('<div class="drag-ghost" style="background:' + tintOf(cal) + ";color:" + tintTextOf(cal) + '"><span>' + esc(dragCtx.ev.title) + '</span><span class="ev-time"></span></div>');
            g.style.width = Math.max(90, dragCtx.origRect.width) + "px";
            if (dragCtx.mode !== "resize") { dragCtx.el.classList.add("drag-src"); document.body.appendChild(g); dragCtx.ghost = g; }
          } else {
            var g2 = el('<div class="drag-ghost" style="background:var(--surface2);color:var(--text)"><span>New event</span><span class="ev-time"></span></div>');
            g2.style.width = "150px";
            document.body.appendChild(g2);
            dragCtx.ghost = g2;
          }
        }
        e.preventDefault();
        if (dragCtx.kind === "create") {
          var d = monthDateAt(e.clientX, e.clientY);
          if (d) { dragCtx.curDate = d; paintRangeSel(); dragCtx.ghost.style.left = (e.clientX + 14) + "px"; dragCtx.ghost.style.top = (e.clientY + 14) + "px"; dragCtx.ghost.querySelector(".ev-time").textContent = fmtDateShort(dragCtx.startDate <= dragCtx.curDate ? dragCtx.startDate : dragCtx.curDate) + " – " + fmtDateShort(dragCtx.startDate <= dragCtx.curDate ? dragCtx.curDate : dragCtx.startDate); }
          return;
        }
        if (dragCtx.kind === "wcreate") {
          var wp = timeGridPoint(e.clientX, e.clientY);
          if (wp) {
            dragCtx.curDate = wp.date; dragCtx.curMins = wp.mins;
            dragCtx.ghost.style.left = (e.clientX + 14) + "px"; dragCtx.ghost.style.top = (e.clientY + 14) + "px";
            var lo = Math.min(dragCtx.startMins, wp.mins), hi = Math.max(dragCtx.startMins, wp.mins);
            dragCtx.ghost.querySelector(".ev-time").textContent = fmtTime(new Date(wp.date.getTime() + lo * 60000)) + " – " + fmtTime(new Date(wp.date.getTime() + hi * 60000));
          }
          return;
        }
        if (dragCtx.mode === "resize") {
          var rp = timeGridPoint(e.clientX, e.clientY);
          if (rp) {
            var day0 = sod(new Date(dragCtx.occStart)).getTime();
            var ne = day0 + rp.mins * 60000;
            if (ne <= dragCtx.occStart + 15 * 60000) ne = dragCtx.occStart + 15 * 60000;
            dragCtx.newEnd = ne;
            dragCtx.el.style.height = Math.max(26, (ne - dragCtx.occStart) / 60000 / 60 * HOUR_PX - 3) + "px";
            var et = dragCtx.el.querySelector(".ev-time");
            if (et) et.textContent = fmtTimeRange(new Date(dragCtx.occStart), new Date(ne));
          }
          return;
        }
        var ghost = dragCtx.ghost;
        ghost.style.left = (e.clientX - (dragCtx.x0 - dragCtx.origRect.left)) + "px";
        ghost.style.top = (e.clientY - (dragCtx.y0 - dragCtx.origRect.top)) + "px";
        var label = "";
        if (dragCtx.el.classList.contains("allday-bar") && (state.view === "week" || state.view === "day")) {
          var ap = timeGridPoint(e.clientX, e.clientY);
          if (ap) { dragCtx.targetDate = ap.date; label = fmtDateShort(ap.date); }
        } else if (state.view === "month" || dragCtx.el.classList.contains("chip") || dragCtx.el.classList.contains("allday-bar")) {
          var md = monthDateAt(e.clientX, e.clientY);
          if (md) { dragCtx.targetDate = md; label = fmtDateShort(md); }
        } else {
          var tp = timeGridPoint(e.clientX, e.clientY);
          if (tp) {
            dragCtx.targetDate = tp.date;
            var startMins = Math.max(0, Math.min(24 * 60 - 15, Math.round((tp.mins - (dragCtx.grabOffset || 0)) / 15) * 15));
            dragCtx.targetMins = startMins;
            label = fmtTime(new Date(tp.date.getTime() + startMins * 60000));
          }
        }
        var t = ghost.querySelector(".ev-time");
        if (t) t.textContent = label;
      }
      function dragDetach() {
        document.removeEventListener("pointermove", dragMove, true);
        document.removeEventListener("pointerup", dragUp, true);
        document.removeEventListener("pointercancel", dragUp, true);
      }
      function cancelDrag() {
        if (!dragCtx) return;
        dragDetach();
        if (dragCtx.ghost) dragCtx.ghost.remove();
        if (dragCtx.el) { dragCtx.el.classList.remove("drag-src"); dragCtx.el.style.height = ""; }
        dragCtx = null;
        document.body.classList.remove("dragging");
        clearRangeSel();
        suppressClickUntil = Date.now() + 250;
        renderView(false);
      }
      function dragUp(e) {
        dragDetach();
        if (!dragCtx) return;
        var ctx = dragCtx; dragCtx = null;
        document.body.classList.remove("dragging");
        clearRangeSel();
        if (!ctx.started) return;
        suppressClickUntil = Date.now() + 250;
        if (ctx.ghost) ctx.ghost.remove();
        if (ctx.el) ctx.el.classList.remove("drag-src");
        if (ctx.kind === "create") {
          var a = ctx.startDate <= ctx.curDate ? ctx.startDate : ctx.curDate;
          var b = ctx.startDate <= ctx.curDate ? ctx.curDate : ctx.startDate;
          var nh = Math.min(22, new Date().getHours() + 1);
          openEventForm(null, null, { start: new Date(a.getFullYear(), a.getMonth(), a.getDate(), nh, 0), end: new Date(b.getFullYear(), b.getMonth(), b.getDate(), nh + 1, 0), allDay: false });
          return;
        }
        if (ctx.kind === "wcreate") {
          var lo2 = Math.min(ctx.startMins, ctx.curMins), hi2 = Math.max(ctx.startMins, ctx.curMins);
          if (hi2 <= lo2) hi2 = lo2 + 60;
          openEventForm(null, null, { start: new Date(ctx.startDate.getTime() + lo2 * 60000), end: new Date(ctx.startDate.getTime() + hi2 * 60000), allDay: false });
          return;
        }
        var ev = ctx.ev, newStart, newEnd;
        if (ctx.mode === "resize") {
          if (!ctx.newEnd || ctx.newEnd === ctx.occStart + ctx.dur) { renderView(false); return; }
          newStart = ctx.occStart; newEnd = ctx.newEnd;
        } else if (ev.allDay || state.view === "month" || ctx.el.classList.contains("chip") || ctx.el.classList.contains("allday-bar")) {
          if (!ctx.targetDate) { renderView(false); return; }
          var deltaDays = Math.round((sod(ctx.targetDate) - sod(new Date(ctx.occStart))) / DAY_MS);
          if (!deltaDays) return;
          newStart = ctx.occStart + deltaDays * DAY_MS;
          newEnd = newStart + ctx.dur;
        } else {
          if (!ctx.targetDate || ctx.targetMins == null) { renderView(false); return; }
          newStart = ctx.targetDate.getTime() + ctx.targetMins * 60000;
          newEnd = newStart + ctx.dur;
          if (newStart === ctx.occStart) return;
        }
        commitOccurrenceMove(ev, ctx.occStart, newStart, newEnd);
      }
      function commitOccurrenceMove(ev, occStart, newStart, newEnd) {
        var gate = Store.assertWritable(ev.cal);
        if (!gate.ok) { toast(gate.error); renderView(false); return; }
        var rec = Store.event(ev.id);
        if (!rec) { renderView(false); return; }
        if (!hasRepeat(ev)) {
          var res = Store.updateEvent(ev.id, { startMs: newStart, endMs: newEnd });
          if (!res.ok) toast(res.error || "Could not move that event");
          syncFromStore(); renderAll(false);
          return;
        }
        openScopeDialog({
          verb: "Move",
          onCancel: function () { renderView(false); },
          onPick: function (scope) {
            var flds = { title: rec.title, loc: rec.loc, desc: rec.desc, cal: rec.cal, allDay: rec.allDay, startMs: newStart, endMs: newEnd, rrule: rec.rrule, repeat: rec.repeat };
            var r;
            if (scope === "all") {
              var delta = newStart - occStart;
              flds.startMs = rec.startMs + delta;
              flds.endMs = flds.startMs + (newEnd - newStart);
              r = Store.updateOccurrence(ev.id, occStart, "all", flds);
            } else if (scope === "following") {
              delete flds.rrule; delete flds.repeat;
              r = Store.updateOccurrence(ev.id, occStart, "following", flds);
            } else {
              flds.rrule = null; flds.repeat = null;
              r = Store.updateOccurrence(ev.id, occStart, "only", flds);
            }
            if (!r.ok) toast(r.error || "Could not move that event");
            syncFromStore(); renderAll(false);
          }
        });
      }
      viewWrap.addEventListener("pointerdown", function (e) {
        if (e.button !== 0 && e.pointerType === "mouse") return;
        if (overlayRoot.children.length) return;
        if (!e.target.closest) return;
        if (e.target.closest(".menu, .popover, .date-pop, .palette-backdrop, .backdrop")) return;
        var occEl = e.target.closest("[data-occ]");
        if (occEl) {
          var parts = occEl.getAttribute("data-occ").split(":");
          var ev = null;
          state.events.forEach(function (x) { if (x.id === parts[0]) ev = x; });
          if (!ev || isReadOnlyEvent(ev)) return;
          var mode = "move";
          var grabOffset = 0;
          if (occEl.classList.contains("ev-card")) {
            var r0 = occEl.getBoundingClientRect();
            if (e.clientY > r0.bottom - 10) mode = "resize";
            else {
              var tp0 = timeGridPoint(e.clientX, e.clientY);
              if (tp0 && sameDay(tp0.date, new Date(+parts[1]))) {
                grabOffset = tp0.mins - ((+parts[1] - sod(new Date(+parts[1])).getTime()) / 60000);
              }
            }
          }
          dragCtx = { kind: "occ", mode: mode, ev: ev, occStart: +parts[1], dur: ev.end - ev.start,
            x0: e.clientX, y0: e.clientY, started: false, el: occEl, ghost: null,
            origRect: occEl.getBoundingClientRect(), targetDate: null, targetMins: null, newEnd: null, grabOffset: grabOffset };
          document.addEventListener("pointermove", dragMove, true);
          document.addEventListener("pointerup", dragUp, true);
          document.addEventListener("pointercancel", dragUp, true);
          return;
        }
        var cellEl = e.target.closest(".day-cell");
        if (state.view === "month" && cellEl && !e.target.closest(".chip, .day-num, .cell-add, .more-link")) {
          var date0 = monthCellDate(cellEl);
          if (!date0) return;
          var cells = [];
          viewWrap.querySelectorAll(".day-cell").forEach(function (c) { var d = monthCellDate(c); if (d) cells.push({ el: c, date: d }); });
          dragCtx = { kind: "create", startDate: date0, curDate: date0, cells: cells, x0: e.clientX, y0: e.clientY, started: false, ghost: null };
          document.addEventListener("pointermove", dragMove, true);
          document.addEventListener("pointerup", dragUp, true);
          document.addEventListener("pointercancel", dragUp, true);
          return;
        }
        var colEl = e.target.closest(".tg-col");
        if ((state.view === "week" || state.view === "day") && colEl && (e.target === colEl || (e.target.classList && e.target.classList.contains("hour-lines")))) {
          var wp0 = timeGridPoint(e.clientX, e.clientY);
          if (!wp0) return;
          dragCtx = { kind: "wcreate", startDate: wp0.date, curDate: wp0.date, startMins: wp0.mins, curMins: wp0.mins, x0: e.clientX, y0: e.clientY, started: false, ghost: null };
          document.addEventListener("pointermove", dragMove, true);
          document.addEventListener("pointerup", dragUp, true);
          document.addEventListener("pointercancel", dragUp, true);
        }
      });

      /* ================= Notifications scheduler =================
         While daylight is open: one notification 15 minutes before each
         timed event on a shown calendar, and an optional 7 AM summary. */
      function notificationTick() {
        if (!("Notification" in window) || Notification.permission !== "granted") return;
        var now = Date.now();
        var changed = false;
        if (Store.data.settings.notify15) {
          var rs = new Date(now - 60000), re = new Date(now + 16 * 60000);
          Store.data.events.forEach(function (rec) {
            var cal = Store.calendar(rec.cal);
            if (!cal || cal.hidden) return;
            var ev = runtimeEvent(rec);
            if (ev.allDay) return;
            RRule.expand(ev, rs, re).forEach(function (o) {
              var until = o.start.getTime() - now;
              var key = rec.id + "@" + o.start.getTime();
              if (until > 0 && until <= 15 * 60000 && !Store.data.notified[key]) {
                Store.data.notified[key] = now; changed = true;
                try { new Notification(ev.title, { body: "Starts at " + fmtTime(o.start) + (ev.loc ? " · " + ev.loc : "") }); } catch (err) {}
              }
            });
          });
        }
        if (Store.data.settings.notifyDaily) {
          var d = new Date();
          var key2 = d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate();
          if (d.getHours() >= 7 && Store.data.lastDailySummary !== key2) {
            Store.data.lastDailySummary = key2; changed = true;
            var dayOccs = occsInRange(sod(d), addDays(sod(d), 1));
            try {
              new Notification("Your day in daylight", { body: dayOccs.length ? dayOccs.length + (dayOccs.length === 1 ? " event" : " events") + " today · First: " + dayOccs[0].ev.title : "Nothing scheduled today" });
            } catch (err) {}
          }
        }
        if (changed) {
          var cutoff = now - 7 * DAY_MS;
          Object.keys(Store.data.notified).forEach(function (k) { if (Store.data.notified[k] < cutoff) delete Store.data.notified[k]; });
          Store.save();
        }
      }
      setInterval(notificationTick, 30000);
      notificationTick();


      /* Final startup pass through the wrapped renderers, so additions that
         hook rendering (the sidebar Tasks row, persistence) apply on first
         paint, not only after the first interaction. */
      renderAll(false);
