# Changelog

How to update your copy: [dozokit.com/ideas/guide#updating](https://dozokit.com/ideas/guide#updating).

## 1.1.0 – 2026-10-29

- You sign in to the admin page with one password, set when you deploy and changeable on the admin page. Google sign-in, Turnstile and the dev login are gone: set `PASSWORD` in your Worker's settings before updating (`ADMIN_EMAIL`, `SESSION_SECRET`, `GOOGLE_*` and `TURNSTILE_*` can be deleted). Everyone is signed out once.
- People vote, suggest and comment only when your product sends them in with the board's signed link. Without it, a public board is read-only and a private one (formerly "team") shows nothing.
- Allowed email domains are gone.
- Votes can be taken back: press the vote button again.
- Each board has its own statuses: add, rename, reorder or remove them. Removing one moves its ideas to the first.
- Each board can have a logo and an accent colour.
- While someone types a new idea, up to 3 matching ideas show under the title so they can vote instead.
- The admin page shows each board's full link with Copy and Open. The signed-link secret and example moved to "For your developer".
- Backups now run once a week (Sundays, 03:00 UTC), one file each, the last 4 kept.
- The update check now asks dozokit.com and can be turned off (Admin → Updates).

## 1.0.0 – 2026-10-28

- First public release: a board where people post ideas, vote once each and comment; you sign in with Google to post or vote, mark ideas planned, in progress or done, and merge duplicates together. A board can be public or limited to your team, and a tool you already have can sign your team straight in with a signed link.
