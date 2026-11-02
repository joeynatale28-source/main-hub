/* daylight — iCalendar parser (js/ics.js)
   Parses VEVENT blocks from .ics text: UID, SUMMARY, LOCATION, DESCRIPTION,
   DTSTART/DTEND (DATE, floating, UTC, and TZID forms), RRULE, EXDATE,
   RECURRENCE-ID, STATUS. Returns plain event records with ms timestamps. */
"use strict";
(function (global) {
  var DAY_MS = 86400000;

  function unfold(text) {
    return String(text).replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/\n[ \t]/g, "");
  }
  function unescapeText(s) {
    return String(s == null ? "" : s)
      .replace(/\\n/gi, "\n").replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\\\/g, "\\");
  }

  /* Convert a wall-clock time in an IANA zone to a UTC instant (ms). */
  function zonedToUtc(y, mo, d, h, mi, s, tz) {
    try {
      var guess = Date.UTC(y, mo, d, h, mi, s);
      var dtf = new Intl.DateTimeFormat("en-US", {
        timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
      });
      function offsetAt(utcMs) {
        var parts = {};
        dtf.formatToParts(new Date(utcMs)).forEach(function (p) { parts[p.type] = p.value; });
        var asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour % 24, +parts.minute, +parts.second);
        return asUtc - utcMs;
      }
      var off1 = offsetAt(guess);
      var utc = guess - off1;
      var off2 = offsetAt(utc);
      if (off2 !== off1) utc = guess - off2;
      return utc;
    } catch (e) {
      return new Date(y, mo, d, h, mi, s).getTime(); // unknown zone: fall back to local
    }
  }

  function parseDateTime(value, params) {
    params = params || {};
    var v = String(value).trim();
    var m = /^(\d{4})(\d{2})(\d{2})$/.exec(v);
    if (m || params.VALUE === "DATE") {
      var mm = m || /^(\d{4})(\d{2})(\d{2})/.exec(v);
      if (mm) return { ms: new Date(+mm[1], +mm[2] - 1, +mm[3]).getTime(), isDate: true };
    }
    m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/.exec(v);
    if (m) {
      var y = +m[1], mo = +m[2] - 1, d = +m[3], h = +m[4], mi = +m[5], s = +m[6];
      if (m[7] === "Z") return { ms: Date.UTC(y, mo, d, h, mi, s), isDate: false };
      if (params.TZID) return { ms: zonedToUtc(y, mo, d, h, mi, s, params.TZID), isDate: false };
      return { ms: new Date(y, mo, d, h, mi, s).getTime(), isDate: false };
    }
    var t = Date.parse(v);
    if (!isNaN(t)) return { ms: t, isDate: false };
    return null;
  }

  function splitProps(block) {
    var props = [];
    block.split("\n").forEach(function (line) {
      if (!line.trim()) return;
      var idx = line.indexOf(":");
      if (idx < 0) return;
      var left = line.slice(0, idx), value = line.slice(idx + 1);
      var segs = left.split(";");
      var name = segs[0].toUpperCase();
      var params = {};
      for (var i = 1; i < segs.length; i++) {
        var eq = segs[i].indexOf("=");
        if (eq > 0) params[segs[i].slice(0, eq).toUpperCase()] = segs[i].slice(eq + 1).replace(/^"|"$/g, "");
      }
      props.push({ name: name, params: params, value: value });
    });
    return props;
  }

  /* parse(text) -> { name, events: [record] }
     record: { uid, recurrenceId (ms|null), feedKey, title, loc, desc, allDay,
               startMs, endMs, rrule (string|null), exdates: [ms], declined } */
  function parse(text) {
    var clean = unfold(text);
    var calName = null;
    var nameM = /(?:^|\n)X-WR-CALNAME:(.+)/.exec(clean);
    if (nameM) calName = unescapeText(nameM[1].trim());
    var events = [];
    var blocks = clean.split("BEGIN:VEVENT");
    for (var i = 1; i < blocks.length; i++) {
      var block = blocks[i].split("END:VEVENT")[0];
      var props = splitProps(block);
      var ev = { uid: null, recurrenceId: null, title: "", loc: "", desc: "", allDay: false, startMs: null, endMs: null, rrule: null, exdates: [], declined: false };
      var dtstart = null, dtend = null, durationMs = null;
      props.forEach(function (p) {
        switch (p.name) {
          case "UID": ev.uid = p.value.trim(); break;
          case "SUMMARY": ev.title = unescapeText(p.value); break;
          case "LOCATION": ev.loc = unescapeText(p.value); break;
          case "DESCRIPTION": ev.desc = unescapeText(p.value); break;
          case "RRULE": ev.rrule = p.value.trim(); break;
          case "STATUS": if (/CANCEL/i.test(p.value)) ev.declined = true; break;
          case "RECURRENCE-ID": {
            var r = parseDateTime(p.value, p.params);
            if (r) ev.recurrenceId = r.ms;
            break;
          }
          case "DTSTART": dtstart = { parsed: parseDateTime(p.value, p.params) }; break;
          case "DTEND": dtend = { parsed: parseDateTime(p.value, p.params) }; break;
          case "DURATION": {
            var dm = /^P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(p.value.trim());
            if (dm) durationMs = (((+dm[1] || 0) * 7 + (+dm[2] || 0)) * 24 * 3600 + (+dm[3] || 0) * 3600 + (+dm[4] || 0) * 60 + (+dm[5] || 0)) * 1000;
            break;
          }
          case "EXDATE": {
            p.value.split(",").forEach(function (v) {
              var x = parseDateTime(v, p.params);
              if (x) ev.exdates.push(x.ms);
            });
            break;
          }
        }
      });
      if (!dtstart || !dtstart.parsed) continue;
      ev.allDay = !!dtstart.parsed.isDate;
      ev.startMs = dtstart.parsed.ms;
      if (dtend && dtend.parsed) {
        ev.endMs = dtend.parsed.ms;
        if (ev.allDay) ev.endMs = ev.endMs - DAY_MS + (DAY_MS - 60000); // exclusive date end -> inclusive 23:59
      } else if (durationMs != null) {
        ev.endMs = ev.startMs + durationMs - (ev.allDay ? 60000 : 0);
      } else if (ev.allDay) {
        ev.endMs = ev.startMs + DAY_MS - 60000;
      } else {
        ev.endMs = ev.startMs; // zero-duration timed event
      }
      if (!ev.uid) ev.uid = "noid-" + ev.startMs + "-" + ev.title;
      ev.feedKey = ev.uid + "|" + (ev.recurrenceId != null ? ev.recurrenceId : "");
      events.push(ev);
    }
    return { name: calName, events: events };
  }

  global.ICAL = { parse: parse, parseDateTime: parseDateTime };
})(window);
