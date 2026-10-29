# Changelog

How to update your copy: [dozokit.com/ideas/guide#updating](https://dozokit.com/ideas/guide#updating).

## 1.2.2 – 2026-10-29

- The pages themselves are now served straight by Cloudflare too, so opening a board only counts its 3 data calls toward the free plan's 100,000 requests a day (it was 8 before 1.2.1). The app's files are kept in the browser for a year, since each build gives them new names.

## 1.2.1 – 2026-10-29

- The app's files (scripts, styles, fonts, icon) are served straight by Cloudflare instead of through the Worker, so a board view uses about half as many of the free plan's 100,000 requests a day.
- "Boards" and "+ New board" sit side by side, the version shows at the top of Updates, and the ideas list has more room under the filters.

## 1.2.0 – 2026-10-29

- The admin page is now three screens: **Admin** shows one card per board (Copy link, Open, Settings) and creates a board behind **New board**; a board's **Settings** has the tabs Look, Statuses and Connect to your product; **Settings** in the top bar holds updates, the version and the password.
- **Connect to your product** walks you through it step by step: **Copy instructions for your developer** copies a ready-to-paste brief with the board's link, secret and an example, and **Open as a test person** opens the board as a made-up member.
- Signed in to the admin page, you suggest, vote and comment on any board as "<board name> team"; your comments show as **Official answer**.
- Each board can name your product and link to it: visitors who can't vote yet are told to open Ideas from it.
- On a board, the ideas come first: **Suggest an idea** opens the form in a side panel (a full-height sheet on phones), where matching ideas still show under the title.
- Whoever suggests an idea votes for it.
- Every idea in the list shows its status, the first one included.

## 1.1.1 – 2026-10-29

- Fixes the weekly backup schedule, which Cloudflare refused on deploy.

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
