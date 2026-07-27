# khai.love

Static site for **khai.love**. A single-page placeholder — no build step, no dependencies.

## Where it's served

**Production: Namecheap shared hosting (cPanel).** The domain uses Namecheap Web Hosting
DNS, so cPanel owns the DNS records and serves whatever sits in the account's
`public_html`. Deploys are file uploads, not git pushes.

**Preview: GitHub Pages** at <https://wildrabbet.github.io/khai.love/>, built from `main`.
Handy for checking a change before uploading it. No custom domain attached — that's
deliberate, so GitHub doesn't compete with the real host for khai.love.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | The whole site. Inline CSS, no assets. |
| `.nojekyll` | Skips Jekyll on the Pages preview. |

## Local preview

Open `index.html` in a browser, or:

```bash
python -m http.server 8000
```

## Deploying to production

1. cPanel → **File Manager** → the docroot (`public_html`, or `public_html/khai.love`
   if khai.love is an addon domain).
2. Delete the parking placeholder (`default.html` / `index.php`) if present — a stale
   `index.php` will win over `index.html`.
3. Upload `index.html`.

To automate later, cPanel's **Git Version Control** can clone this repo and deploy on
pull.

## Email

`amanda@khai.love` is a cPanel mailbox (cPanel → Email Accounts), included with the
hosting plan. Webmail lives at `khai.love/webmail`.
