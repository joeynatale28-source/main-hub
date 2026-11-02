/* daylight — RRULE engine (js/rrule.js)
   Parses and expands a practical subset of RFC 5545 RRULE:
   FREQ=DAILY|WEEKLY|MONTHLY|YEARLY, INTERVAL, BYDAY, BYMONTHDAY, BYMONTH,
   UNTIL (date or UTC datetime), COUNT. Occurrences are local Date objects,
   matching the app's local-time data model. */
"use strict";
(function (global) {
  var DAY_MS = 86400000;
  var BYDAY_MAP = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };
  var FREQ_STEP = { DAILY: "day", WEEKLY: "week", MONTHLY: "month", YEARLY: "year" };

  function sod(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }

  function parseUntil(v) {
    var m = /^(\d{4})(\d{2})(\d{2})$/.exec(v);
    if (m) { // date-only UNTIL: inclusive of that whole day
      return new Date(+m[1], +m[2] - 1, +m[3]).getTime() + DAY_MS - 1;
    }
    m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/.exec(v);
    if (m) {
      if (m[7] === "Z") return Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
      return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]).getTime();
    }
    return null;
  }

  function parse(str) {
    if (!str) return null;
    var rule = { freq: null, interval: 1, byday: null, bymonthday: null, bymonth: null, untilMs: null, count: null };
    String(str).split(";").forEach(function (part) {
      var kv = part.split("=");
      if (kv.length !== 2) return;
      var k = kv[0].toUpperCase(), v = kv[1];
      if (k === "FREQ") rule.freq = v.toUpperCase();
      else if (k === "INTERVAL") rule.interval = Math.max(1, parseInt(v, 10) || 1);
      else if (k === "BYDAY") {
        rule.byday = v.split(",").map(function (d) {
          var mm = /^(-?\d+)?([A-Z]{2})$/.exec(d.trim());
          return mm ? { dow: BYDAY_MAP[mm[2]], ord: mm[1] ? parseInt(mm[1], 10) : null } : null;
        }).filter(Boolean);
      }
      else if (k === "BYMONTHDAY") rule.bymonthday = v.split(",").map(function (n) { return parseInt(n, 10); }).filter(function (n) { return !isNaN(n); });
      else if (k === "BYMONTH") rule.bymonth = v.split(",").map(function (n) { return parseInt(n, 10); }).filter(function (n) { return !isNaN(n); });
      else if (k === "UNTIL") rule.untilMs = parseUntil(v);
      else if (k === "COUNT") rule.count = parseInt(v, 10) || null;
    });
    if (!rule.freq || !FREQ_STEP[rule.freq]) return null;
    return rule;
  }

  function fmtUntil(ms, allDay) {
    var d = new Date(ms);
    function p(n) { return (n < 10 ? "0" : "") + n; }
    if (allDay) return d.getUTCFullYear() + p(d.getUTCMonth() + 1) + p(d.getUTCDate());
    return d.getUTCFullYear() + p(d.getUTCMonth() + 1) + p(d.getUTCDate()) + "T" + p(d.getUTCHours()) + p(d.getUTCMinutes()) + p(d.getUTCSeconds()) + "Z";
  }

  function stringify(rule, allDay) {
    var parts = ["FREQ=" + rule.freq];
    if (rule.interval && rule.interval > 1) parts.push("INTERVAL=" + rule.interval);
    if (rule.byday && rule.byday.length) {
      var rev = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
      parts.push("BYDAY=" + rule.byday.map(function (b) { return (b.ord ? b.ord : "") + rev[b.dow]; }).join(","));
    }
    if (rule.bymonthday && rule.bymonthday.length) parts.push("BYMONTHDAY=" + rule.bymonthday.join(","));
    if (rule.bymonth && rule.bymonth.length) parts.push("BYMONTH=" + rule.bymonth.join(","));
    if (rule.count) parts.push("COUNT=" + rule.count);
    else if (rule.untilMs != null) parts.push("UNTIL=" + fmtUntil(rule.untilMs, allDay));
    return parts.join(";");
  }

  function fromSimple(key) {
    if (!key) return null;
    var map = { daily: "DAILY", weekly: "WEEKLY", monthly: "MONTHLY", yearly: "YEARLY" };
    if (!map[key]) return null;
    return { freq: map[key], interval: 1, byday: null, bymonthday: null, bymonth: null, untilMs: null, count: null };
  }

  function ruleOf(ev) {
    if (ev.rrule) return parse(ev.rrule);
    if (ev.repeat && ev.repeat !== "custom") return fromSimple(ev.repeat);
    return null;
  }

  /* Accept both runtime events (Date start/end) and stored records
     (numeric startMs/endMs) so the Store can pass its records directly. */
  function startOf(ev) { return ev.start instanceof Date ? ev.start : new Date(ev.start != null ? ev.start : ev.startMs); }
  function endOf(ev) { return ev.end instanceof Date ? ev.end : new Date(ev.end != null ? ev.end : ev.endMs); }

  /* Generate raw occurrence starts (ms) from DTSTART, ignoring exdates.
     Stops at rangeEnd where possible but honors COUNT/UNTIL semantics,
     which are counted from the series start. */
  function generate(ev, rangeEndMs) {
    var rule = ruleOf(ev);
    var start = startOf(ev);
    if (!rule) return [start.getTime()];
    var out = [];
    var guard = 0, produced = 0;
    var h = start.getHours(), mi = start.getMinutes(), s = start.getSeconds(), ms = start.getMilliseconds();
    function emit(t) {
      if (rule.untilMs != null && t > rule.untilMs) return false;
      if (rule.count != null && produced >= rule.count) return false;
      produced++;
      out.push(t);
      return true;
    }
    if (rule.freq === "DAILY") {
      var d0 = sod(start).getTime();
      for (var i = 0; guard++ < 6000; i += rule.interval) {
        var t = d0 + i * DAY_MS + (h * 3600 + mi * 60 + s) * 1000 + ms;
        if (rule.count == null && rule.untilMs == null && t >= rangeEndMs && i > 0) break;
        if (!emit(t)) break;
        if (rule.untilMs != null && t > rule.untilMs) break;
      }
    } else if (rule.freq === "WEEKLY") {
      var days = (rule.byday && rule.byday.length ? rule.byday.map(function (b) { return b.dow; }) : [start.getDay()]).slice().sort(function (a, b) { return a - b; });
      var week0 = sod(start).getTime() - start.getDay() * DAY_MS;
      outer:
      for (var w = 0; guard++ < 1200; w += rule.interval) {
        for (var j = 0; j < days.length; j++) {
          var t2 = week0 + (w * 7 + days[j]) * DAY_MS + (h * 3600 + mi * 60 + s) * 1000 + ms;
          if (t2 < start.getTime()) continue;
          if (rule.count == null && rule.untilMs == null && t2 >= rangeEndMs) break outer;
          if (!emit(t2)) break outer;
          if (rule.untilMs != null && t2 > rule.untilMs) break outer;
        }
      }
    } else if (rule.freq === "MONTHLY") {
      var y = start.getFullYear(), mo = start.getMonth();
      for (var k = 0; guard++ < 1200; k += rule.interval) {
        var yy = y + Math.floor((mo + k) / 12), mm = (mo + k) % 12;
        var cands = [];
        if (rule.byday && rule.byday.length) {
          rule.byday.forEach(function (b) {
            var day = nthWeekdayOfMonth(yy, mm, b.dow, b.ord || 1);
            if (day) cands.push(day);
          });
        } else {
          var mdays = rule.bymonthday && rule.bymonthday.length ? rule.bymonthday : [start.getDate()];
          mdays.forEach(function (md) {
            var dim = new Date(yy, mm + 1, 0).getDate();
            var dd = md > 0 ? md : dim + md + 1;
            if (dd >= 1 && dd <= dim) cands.push(dd);
          });
        }
        cands.sort(function (a, b) { return a - b; });
        for (var c = 0; c < cands.length; c++) {
          var t3 = new Date(yy, mm, cands[c], h, mi, s, ms).getTime();
          if (t3 < start.getTime()) continue;
          if (rule.count == null && rule.untilMs == null && t3 >= rangeEndMs) return out;
          if (!emit(t3)) return out;
          if (rule.untilMs != null && t3 > rule.untilMs) return out;
        }
      }
    } else if (rule.freq === "YEARLY") {
      var months = rule.bymonth && rule.bymonth.length ? rule.bymonth : [start.getMonth() + 1];
      for (var q = 0; guard++ < 400; q += rule.interval) {
        var yq = start.getFullYear() + q;
        var list = [];
        months.forEach(function (mon) {
          var dim2 = new Date(yq, mon, 0).getDate();
          var mdays2 = rule.bymonthday && rule.bymonthday.length ? rule.bymonthday : [start.getDate()];
          mdays2.forEach(function (md) { if (md >= 1 && md <= dim2) list.push(new Date(yq, mon - 1, md, h, mi, s, ms).getTime()); });
          if (rule.byday) rule.byday.forEach(function (b) {
            var day2 = nthWeekdayOfMonth(yq, mon - 1, b.dow, b.ord || 1);
            if (day2) list.push(new Date(yq, mon - 1, day2, h, mi, s, ms).getTime());
          });
        });
        list.sort(function (a, b) { return a - b; });
        for (var z = 0; z < list.length; z++) {
          if (list[z] < start.getTime()) continue;
          if (rule.count == null && rule.untilMs == null && list[z] >= rangeEndMs) return out;
          if (!emit(list[z])) return out;
          if (rule.untilMs != null && list[z] > rule.untilMs) return out;
        }
      }
    }
    return out;
  }

  function nthWeekdayOfMonth(y, m, dow, ord) {
    var dim = new Date(y, m + 1, 0).getDate();
    if (ord > 0) {
      var firstDow = new Date(y, m, 1).getDay();
      var day = 1 + ((dow - firstDow + 7) % 7) + (ord - 1) * 7;
      return day <= dim ? day : null;
    }
    var lastDow = new Date(y, m, dim).getDay();
    var dayL = dim - ((lastDow - dow + 7) % 7) + (ord + 1) * 7;
    return dayL >= 1 ? dayL : null;
  }

  /* Expand an event into occurrences overlapping [rs, re) (Dates).
     Applies exdates (array of ms starts). Returns [{ev, start, end}]. */
  function expand(ev, rs, re) {
    var start = startOf(ev);
    var end = endOf(ev);
    var dur = end.getTime() - start.getTime();
    var ex = {};
    (ev.exdates || []).forEach(function (t) { ex[t] = true; });
    var starts = generate(ev, re.getTime());
    var out = [];
    starts.forEach(function (t) {
      if (ex[t]) return;
      var e2 = t + dur;
      if (t < re.getTime() && e2 > rs.getTime()) out.push({ ev: ev, start: new Date(t), end: new Date(e2) });
    });
    return out;
  }

  /* Index (0-based) of the occurrence at occMs within the rule, ignoring exdates; -1 if not an occurrence. */
  function occurrenceIndex(ev, occMs) {
    var starts = generate(ev, occMs + 1);
    for (var i = 0; i < starts.length; i++) if (starts[i] === occMs) return i;
    return -1;
  }

  /* Number of rule-generated occurrences strictly before occMs. */
  function countBefore(ev, occMs) {
    return generate(ev, occMs).filter(function (t) { return t < occMs; }).length;
  }

  var MONTHS_S = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var FREQ_WORD = { DAILY: ["day", "days"], WEEKLY: ["week", "weeks"], MONTHLY: ["month", "months"], YEARLY: ["year", "years"] };

  function describe(ev) {
    var rule = ruleOf(ev);
    if (!rule) return "";
    var w = FREQ_WORD[rule.freq];
    var base;
    if (rule.interval > 1) base = "Repeats every " + rule.interval + " " + w[1];
    else base = "Repeats " + { DAILY: "daily", WEEKLY: "weekly", MONTHLY: "monthly", YEARLY: "yearly" }[rule.freq];
    if (rule.freq === "WEEKLY" && rule.byday && rule.byday.length > 1) {
      var names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      base += " on " + rule.byday.map(function (b) { return names[b.dow]; }).join(", ");
    }
    if (rule.freq === "MONTHLY" && rule.bymonthday && rule.bymonthday.length) base += " on day " + rule.bymonthday.join(", ");
    if (rule.count) base += " · " + rule.count + (rule.count === 1 ? " time" : " times");
    else if (rule.untilMs != null) {
      var d = new Date(rule.untilMs);
      base += " · until " + MONTHS_S[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
    }
    return base;
  }

  /* A short key for the form's repeat menu: 'daily'|'weekly'|'monthly'|'yearly'|'custom'|null */
  function simpleKey(ev) {
    if (!ev.rrule && !ev.repeat) return null;
    if (ev.repeat && ev.repeat !== "custom") return ev.repeat;
    var rule = ruleOf(ev);
    if (!rule) return ev.repeat || null;
    var simple = rule.interval === 1 && !rule.byday && !rule.bymonthday && !rule.bymonth && rule.untilMs == null && rule.count == null;
    if (!simple) return "custom";
    return { DAILY: "daily", WEEKLY: "weekly", MONTHLY: "monthly", YEARLY: "yearly" }[rule.freq] || "custom";
  }

  global.RRule = {
    parse: parse, stringify: stringify, fromSimple: fromSimple, ruleOf: ruleOf,
    expand: expand, occurrenceIndex: occurrenceIndex, countBefore: countBefore,
    describe: describe, simpleKey: simpleKey
  };
})(window);
