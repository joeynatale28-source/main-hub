/* daylight — bundled US holidays snapshot, 2026–2027 (js/holidays.js)
   Static hosting cannot guarantee CORS access to a live holiday feed, so the
   US Holidays subscription is seeded from this bundled iCal data (federal
   holidays, plus Election Day and federal observed dates). It is parsed by
   the same ICAL pipeline as any other feed, and Settings → Data & sync can
   refresh it from the live feed URL whenever the network allows. */
"use strict";
(function (global) {
  // [yyyymmdd, title]
  var DAYS = [
    // 2026
    ["20260101", "New Year's Day"], ["20260119", "Martin Luther King Jr. Day"],
    ["20260216", "Washington's Birthday"], ["20260525", "Memorial Day"],
    ["20260619", "Juneteenth National Independence Day"], ["20260703", "Independence Day (observed)"],
    ["20260704", "Independence Day"], ["20260907", "Labor Day"],
    ["20261012", "Columbus Day"], ["20261103", "Election Day"],
    ["20261111", "Veterans Day"], ["20261126", "Thanksgiving Day"],
    ["20261225", "Christmas Day"],
    // 2027
    ["20270101", "New Year's Day"], ["20270118", "Martin Luther King Jr. Day"],
    ["20270215", "Washington's Birthday"], ["20270531", "Memorial Day"],
    ["20270618", "Juneteenth National Independence Day (observed)"], ["20270619", "Juneteenth National Independence Day"],
    ["20270704", "Independence Day"], ["20270705", "Independence Day (observed)"],
    ["20270906", "Labor Day"], ["20271011", "Columbus Day"],
    ["20271102", "Election Day"], ["20271111", "Veterans Day"],
    ["20271125", "Thanksgiving Day"], ["20271224", "Christmas Day (observed)"],
    ["20271225", "Christmas Day"]
  ];
  function nextDay(yyyymmdd) {
    var d = new Date(+yyyymmdd.slice(0, 4), +yyyymmdd.slice(4, 6) - 1, +yyyymmdd.slice(6, 8) + 1);
    function p(n) { return (n < 10 ? "0" : "") + n; }
    return "" + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate());
  }
  function buildICS() {
    var lines = ["BEGIN:VCALENDAR", "PRODID:-//daylight//US Holidays snapshot//EN", "VERSION:2.0", "X-WR-CALNAME:US Holidays"];
    DAYS.forEach(function (row) {
      lines.push("BEGIN:VEVENT");
      lines.push("UID:ushol-" + row[0] + "@daylight.local");
      lines.push("DTSTAMP:20260101T000000Z");
      lines.push("DTSTART;VALUE=DATE:" + row[0]);
      lines.push("DTEND;VALUE=DATE:" + nextDay(row[0]));
      lines.push("SUMMARY:" + row[1]);
      lines.push("END:VEVENT");
    });
    lines.push("END:VCALENDAR");
    return lines.join("\r\n");
  }
  global.US_HOLIDAYS_ICS = buildICS();
  global.US_HOLIDAYS_FEED_URL = "https://calendar.google.com/calendar/ical/en.usa%40holiday%40group.v.calendar.google.com/public/basic.ics";
})(window);
