# khai.love deployment handoff

## Current state

- Repository: `https://github.com/wildrabbet/khai.love.git`
- Branch: `main`
- GitHub Pages preview: `https://wildrabbet.github.io/khai.love/`
- Custom-domain file: `CNAME` containing `khai.love`
- Current DNS before migration: Namecheap/cPanel (`192.64.118.87`)

## One-time GitHub Pages setup

In the repository's GitHub settings:

1. Open **Settings → Pages**.
2. Set the source to **Deploy from a branch**.
3. Select branch `main` and folder `/ (root)`.
4. Set the custom domain to `khai.love`.
5. Wait for GitHub's HTTPS certificate check to pass.

In Namecheap **Advanced DNS**, remove the old cPanel apex record and set:

```text
@      A       185.199.108.153
@      A       185.199.109.153
@      A       185.199.110.153
@      A       185.199.111.153
www    CNAME   wildrabbet.github.io.
```

Do not leave the old `192.64.118.87` apex record alongside these records.
That would make DNS split between cPanel and GitHub and produce intermittent
results. Existing mail records such as MX, SPF, DKIM and DMARC must remain
untouched.

## Normal update flow from this workspace

From `C:\Users\kltim\OneDrive\Documents\Projects\TOOLS\Ripper\khai.love`:

```powershell
git pull --ff-only origin main
# edit the HTML files
git add .
git commit -m "Describe the site change"
git push origin main
```

GitHub Pages normally publishes the new `main` revision automatically. The
custom-domain HTTPS certificate and DNS can take longer than the page build.

## Important boundary

The previous cPanel copy is being preserved in
`C:\Users\kltim\OneDrive\Documents\Projects\WEBSITE\khai.love` as a rollback
copy. Do not delete it until the GitHub Pages version is verified from an
outside network and mail still works.
