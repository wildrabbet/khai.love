# khai.love

The public company site for **KHAI**. Six static pages, no build step at deploy
time, no JavaScript framework, no external requests.

## Do not hand-edit the HTML

Every `.html` file here is **generated**. The source of truth is in the
YGO-AI repo:

| Source | What it holds |
| --- | --- |
| `manager/public.py` | All page content, the roster, open positions, and the exporter |
| `manager/templates/pub_base.html` | Shell: design tokens, nav, footer, scroll reveals |
| `manager/templates/pub_*.html` | One template per page |

To change the site, edit those and re-export:

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

**Preview: GitHub Pages** — <https://wildrabbet.github.io/khai.love/>, built
from `main`. No custom domain attached, deliberately, so GitHub never competes
with the real host for khai.love.

## Contact address

`hello@khai.love` is referenced on the contact and careers pages. It is a cPanel
mailbox and must exist, or those links are dead. Create it under
cPanel → **Email Accounts**.
