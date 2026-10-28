# Dozokit Ideas

A board where your customers or your team post ideas, vote once each, and comment on them. You mark ideas planned, in progress or done, and merge the duplicates together. It lives in your Cloudflare account, and nobody can switch it off but you.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/dozokit/ideas)

## Set it up in ten minutes

You need a free Cloudflare account, a Google Cloud project, and a GitHub (or GitLab) account.

1. **Click Deploy to Cloudflare** above and sign in to Cloudflare. It copies this repository into your account, builds it, and creates the Worker and its database.
2. **Turn on Google sign-in.** In Google Cloud Console (APIs & Services → Credentials), create an OAuth client, and set its redirect address to `https://<your address>/auth/google/callback`. Open your Worker's Settings → Variables and Secrets, and paste the client id and secret into `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
3. **Turn on Turnstile**, which keeps bots from posting, voting and commenting. In Cloudflare, add a Turnstile site, then paste its site key and secret into `TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET`.
4. **Set who's admin.** Paste your Google account's email into `ADMIN_EMAIL`: that's the only account that can create boards, change statuses, and merge or delete ideas. Set `SESSION_SECRET` to a random string of 32 characters or more, used to sign people's sessions.
5. **Open your address followed by `/admin`**, sign in with Google, and create your first board.

That's it.

## Sign your team in from your own tool

A team board only lets in people you choose. If a tool you already have signs people in — an intranet, a support desk, an admin panel — it can send them straight into a team board without going through Google here: mint a short-lived, single-use token and send their browser to this Worker.

Each board has its own secret, shown under its row in your admin page (Reveal). A token is an HS256-signed JWT with these claims: `sub` (a stable id for the person), `email`, `name`, `iss` (the board's id), `aud` (your Ideas address, exactly as it appears in the browser, e.g. `https://ideas.example.com`), `exp` (now plus at most 5 minutes), and `jti` (a unique id — a token only ever works once). Send the browser there as a normal link or a top-level redirect, never inside an iframe:

```
https://<your address>/sso?token=<the token>&return_to=/b/<board id>
```

This signs the person in to that one board. It never gives them admin rights, whatever the token says.

In Node:

```js
const crypto = require("node:crypto");
const b64url = (buf) => buf.toString("base64url");
const header = b64url(Buffer.from(JSON.stringify({ alg: "HS256" })));
const payload = b64url(Buffer.from(JSON.stringify({
  iss: "support", aud: "https://ideas.example.com", sub: "42", email: "amy@example.com", name: "Amy",
  exp: Math.floor(Date.now() / 1000) + 120, jti: crypto.randomUUID(),
})));
const sig = crypto.createHmac("sha256", "<the board's secret, from Admin>").update(header + "." + payload).digest("base64url");
const url = `https://ideas.example.com/sso?token=${header}.${payload}.${sig}&return_to=/b/support`;
```

Your admin page shows this same snippet already filled in with the board's own id, address and secret.

## Updates

Your admin page tells you when a newer version is out (Admin → Updates). Open your copy on GitHub, then **Actions** → **Update Dozokit Ideas** → **Run workflow**. It installs the latest release, once it checks the release is signed with Dozokit's release key (a wrong or missing signature stops it and changes nothing), and keeps your `wrangler.jsonc` (it holds your database's id); Cloudflare rebuilds and deploys within a couple of minutes, database changes included. [CHANGELOG.md](CHANGELOG.md) says what changed. **The first time**, add that button: Cloudflare's Deploy button copies everything except `.github`, so open **Admin → Updates**, paste your copy's address, click **Add the update button**, then **Commit changes** on GitHub.

## Backups

Every 15 minutes, a small piece of your boards, ideas, votes and comments is copied to the private Cloudflare R2 bucket `dozokit-ideas-backups`; a full copy of everything completes within a day (more for very large boards). Old backups are kept for 14 days. The layout is `backups/<day>/<table>/0001.json`, `0002.json`, and so on, one file per batch of rows. To restore, insert the rows of each file back into the table with the same name. The backup also holds each board's signing secret (the one used for signed-link sign-in), so keep that bucket private.

## How it counts

- No email is ever sent: no notifications, no digests.
- When someone signs in, their name and email are kept, so their name shows next to what they post and you can recognise who it is.
- One vote per person per idea. There's no way to take a vote back.

## Run it locally

```bash
npm install
npm run db:migrate   # create the local D1 tables
cp .dev.vars.example .dev.vars
npm run dev:worker   # http://localhost:8787
```

Locally, `/auth/dev?email=you@example.com&name=You` signs you straight in, no Google needed. Use the email you put in `.dev.vars`' `ADMIN_EMAIL` to open the admin page.

## Limits

- Free Cloudflare plan: 10 ms of CPU time per request, and 5 million database rows read a day.
- One vote per person per idea, and votes can't be taken back.
- A board shows its 200 most recent or most voted ideas.

## Third parties

Ideas talks to Google (sign-in) and Cloudflare Turnstile (keeping bots from posting, voting and commenting), and loads its General Sans font from Fontshare. Once a day, the Worker asks GitHub for the latest release, to tell you when a newer version exists.

## License

[AGPL-3.0](LICENSE). You can run, change and share it; if you offer a changed version to others as a service, share your changes too.
