# khai.love

The public company site for **KHAI**. Nine static studio pages, no build step at deploy
time, no JavaScript framework, no external requests on the studio pages.

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
| `team.html` | Pyramid org chart with Khai at the top and the current agent roles |
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

**Production: GitHub Pages.** The `main` branch is the deployment source and
the repository's `CNAME` file binds it to `khai.love`.

Normal deployment is:

```powershell
git add .
git commit -m "Describe the site change"
git push origin main
```

Namecheap remains the domain registrar and DNS provider. Its BasicDNS records
point the website at GitHub Pages; Private Email records are separate and must
not be removed. The old cPanel copy is retained only as a rollback reference.

Preview: <https://wildrabbet.github.io/khai.love/>

## Contact address

`hello@khai.love` is referenced on the contact and careers pages. It is handled
by Namecheap Private Email and is independent of the GitHub Pages website.

## September 2026 studio redesign

The shared presentation is in `studio.css` and the menu, template filters and email-brief behaviour are in `studio.js`. HTML is served directly without a build. The homepage retains its original opening markup, stylesheets and animation script.

The collection has 29 public designs: 24 new demos under `templates/` with six layout families in `templates/demo.css`, plus the five existing public demos under `websites/`. The private bakery showcase remains at its existing URL and is excluded from the sales catalogue. New designs use the existing $41 AUD price point; Harbor & Cole remains $34 AUD. Purchases are enquiries, not automated checkout. Licensing, delivery, customisation and payment are confirmed by email.

`template-catalog.json` and `team-roster.json` record the content used for this revision. Pages are static: when editing catalogue entries or roster membership, update both the reference JSON and affected HTML. The team preserves all 39 published roster entries (Khai plus 38 agents), grouped in their original tiers. The public roster is a snapshot, not a live internal directory.

Validation: check JavaScript syntax with `node --check studio.js`; verify relative assets, page links and fragment targets before publishing. The contact form prepares a mailto draft and never stores or sends submissions.
