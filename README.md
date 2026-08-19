# khai.love

The public company site for **KHAI**. Six static pages, no build step at deploy
time, no JavaScript framework, no external requests.

## Editing from the Codex workspace

This checkout is now the direct-edit and publish source for the public site.
Edit the HTML files here, preview them locally, commit to `main`, and push to
GitHub. GitHub Pages publishes the `main` branch.

The older generator still exists in the YGO-AI repo:

| Source | What it holds |
| --- | --- |
| `manager/public.py` | All page content, the roster, open positions, and the exporter |
| `manager/templates/pub_base.html` | Shell: design tokens, nav, footer, scroll reveals |
| `manager/templates/pub_*.html` | One template per page |

If that generator is run later, it may overwrite the HTML in this checkout.
Treat this repository as the active publishing source unless we deliberately
migrate the generator into it.

To regenerate from the older source instead:

```bash
python public.py
```

That rewrites this folder. Hand-edits here are lost on the next export.

## Pages

| File | |
| --- | --- |
| `index.html` | Front page — headcount, programs, method, leadership, principles |
| `programs.html` | The five programs in detail |
| `team.html` | Org chart with Khai at the top, plus the department structure |
| `careers.html` | Open positions, each with the failure that made it necessary |
| `about.html` | How the company works, the principles, about the founder |
| `contact.html` | One email address and what to put in the first message |

## What is deliberately NOT here

The public site is a **frozen snapshot**, not a live read of the internal
coordination log. It contains no ports, no host names, no local paths, no
internal filenames, and no write API. `public.py` is scanned for leakage before
each publish — keep it that way.

The internal board (live roster, meeting rooms, the channel itself) stays local
and is a separate application.

## Hosting

**Production: Namecheap cPanel.** khai.love uses Namecheap Web Hosting DNS, so
cPanel owns the DNS records and serves whatever is in the account's docroot.
Deploying is a file upload:

1. cPanel → **File Manager** → `public_html` (or `public_html/khai.love` if it
   is set up as an addon domain).
2. Delete the parking placeholder if present — a leftover `index.php` takes
   priority over `index.html` and you will keep seeing the old page.
3. Upload all six `.html` files.

**GitHub Pages** — <https://wildrabbet.github.io/khai.love/>, built from `main`.
The repository contains a `CNAME` file for `khai.love`; the domain will serve
from GitHub once its DNS records are changed from Namecheap/cPanel to the
GitHub Pages records listed in the deployment handoff.

## Contact address

`hello@khai.love` is referenced on the contact and careers pages. It is a cPanel
mailbox and must exist, or those links are dead. Create it under
cPanel → **Email Accounts**.
