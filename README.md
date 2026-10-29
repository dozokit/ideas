# Dozokit Ideas

A board where the people who use your product post ideas, vote once each, and comment on them. You choose each board's statuses (planned, in progress, done, or your own), its logo and colour, and merge the duplicates together. It lives in your Cloudflare account, and nobody can switch it off but you.

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/dozokit/ideas)

## Set it up in five minutes

You need a free Cloudflare account and a GitHub (or GitLab) account.

1. **Click Deploy to Cloudflare** above and sign in to Cloudflare. It asks for a `PASSWORD` (12 characters or more): that's the admin page's password. It then copies this repository into your account, builds it, and creates the Worker and its database.
2. **Open your address followed by `/admin`**, type that password, and create your first board.
3. **Have your product send people to it** with a signed link (below): that's how they vote, suggest and comment.

That's it.

- **Public or private**: anyone with a public board's link can read it; a private board shows nothing to anyone but you and the people your product sent there. Either way, only those people vote, suggest and comment.
- **Change the password**: Admin → Change password. Forgot it? In Cloudflare, open the Worker, then Settings → Variables and Secrets, and edit `PASSWORD`: that password works again.

## Send people in from your product

Your product already knows who its users are, so it vouches for them: when someone clicks "Ideas" in your product, it mints a short-lived, single-use token and sends their browser to this Worker. They land on the board, signed in to that board only.

Each board has its own secret, in your admin page under the board, in **For your developer** (Reveal). A token is an HS256-signed JWT with these claims: `name`, `email`, `sub` (a stable id for the person in your product), `iss` (the board's id), `aud` (your Ideas address, exactly as it appears in the browser, e.g. `https://ideas.example.com`), `exp` (now plus at most 5 minutes), and `jti` (a unique id — a token only ever works once). Send the browser there as a normal link or a top-level redirect, never inside an iframe:

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
  name: "Amy", email: "amy@example.com", sub: "42",
  iss: "support", aud: "https://ideas.example.com", exp: Math.floor(Date.now() / 1000) + 120, jti: crypto.randomUUID(),
})));
const sig = crypto.createHmac("sha256", "<the board's secret, from Admin>").update(header + "." + payload).digest("base64url");
const url = `https://ideas.example.com/sso?token=${header}.${payload}.${sig}&return_to=/b/support`;
```

Your admin page shows this same snippet already filled in with the board's own id, address and secret.

## Updates

Your admin page tells you when a newer version is out (Admin → Updates; untick **Check for new versions** and nothing is sent). Open your copy on GitHub, then **Actions** → **Update Dozokit Ideas** → **Run workflow**. It installs the latest release, once it checks the release is signed with Dozokit's release key (a wrong or missing signature stops it and changes nothing), and keeps your `wrangler.jsonc` (it holds your database's id); Cloudflare rebuilds and deploys within a couple of minutes, database changes included. [CHANGELOG.md](CHANGELOG.md) says what changed. **The first time**, add that button: Cloudflare's Deploy button copies everything except `.github`, so open **Admin → Updates**, paste your copy's address, click **Add the update button**, then **Commit changes** on GitHub.

## Backups

Every Sunday at 03:00 UTC, your boards, ideas, votes and comments are copied to the private Cloudflare R2 bucket `dozokit-ideas-backups`, as one file `backups/<day>.json` with every table's rows under its name; the last 4 are kept. A database over 200,000 rows isn't copied (each copy reads every row), and the admin password isn't either. To restore, insert each table's rows back into the table with the same name. The backup also holds each board's signing secret, so keep that bucket private. Coming from 1.0, the first weekly copy removes the old `backups/<day>/<table>/` files.

## How it counts

- No email is ever sent: no notifications, no digests.
- When your product sends someone in, their name and email are kept, so their name shows next to what they post and you can recognise who it is.
- One vote per person per idea; pressing the vote button again takes it back.
- While someone types a new idea's title, up to 3 ideas of the same board that match show under it, so they can vote for one instead.

## Run it locally

```bash
npm install
npm run db:migrate   # create the local D1 tables
cp .dev.vars.example .dev.vars   # then put a password of 12 characters or more in it
npm run dev:worker   # http://localhost:8787
```

To post or vote locally, mint a signed link with the board's secret (the example in **For your developer**, with `aud` set to `http://localhost:8787`).

## Limits

- Free Cloudflare plan: 10 ms of CPU time per request, and 5 million database rows read a day.
- One vote per person per idea.
- A board shows its 200 most recent or most voted ideas.

## Third parties

Ideas loads its General Sans font from Fontshare. Once a day, the Worker asks dozokit.com for the latest release, to tell you when a newer version exists; it sends its version number and a random id made for this copy, nothing else (Admin → Updates turns this off).

## License

[AGPL-3.0](LICENSE). You can run, change and share it; if you offer a changed version to others as a service, share your changes too.
