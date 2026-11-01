# Daylight Calendar

Monochrome, responsive, browser-first calendar.

## Running locally
Run a local static server from this directory for the interface. URL subscriptions use the Vercel Node.js endpoint at `api/feed.js` and require a Vercel deployment (or compatible functions host).

## Features
- Month, week, and agenda views with event creation, editing and deletion.
- Dark/light/system themes, settings page, keyboard navigation and onboarding.
- Browser-local storage for events and preferences.
- Import and export .ics files.
- Read-only URL subscriptions using the server endpoint, with manual refresh and per-provider restrictions.

## Integration limitations
- **Feed subscriptions are not generic:** security restrictions currently permit Google Calendar, Microsoft Outlook, iCloud and Teamup hosts only, and only when the URL returns a public iCalendar file directly. Redirected or authenticated URLs do not work.
- **CalDAV is not implemented.** A production CalDAV connector requires account authorization, discovery, REPORT/PROPFIND/PUT/DELETE, synchronization tokens or ETags, conflict management, timezone/recurrence support, and authenticated server storage.
- **ICS parser is basic:** recurring events, time zone definitions, exceptions and some alternative date formats are not fully supported. Do not rely on it as a complete RFC 5545 implementation.
- Events are not synchronized across browsers or devices; localStorage can be cleared.
- This repository has not passed a full cross-browser accessibility/end-to-end test, and is not certified production-ready.

## Security
The subscription endpoint uses HTTPS, denies redirects, restricts hostnames, limits response sizes and request time. It does not store credentials. Do not put passwords or tokens into URLs. Public calendar links can be sensitive: anyone who possesses a feed URL may be able to read that calendar.

## Deployment
Import `joeynatale28-source/main-hub` on Vercel with root directory `glass-calendar`. No build command is required. The project has not been deployed by this integration because Vercel returns HTTP 403 to project-creation requests.
