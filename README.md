# khai.love

Static site for **khai.love**, served by GitHub Pages from the `main` branch root.

Right now it's a single-page placeholder — no build step, no dependencies.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | The whole site. Inline CSS, no assets. |
| `CNAME` | Tells GitHub Pages to serve on the custom domain. Don't delete it. |
| `.nojekyll` | Skips Jekyll processing so files starting with `_` are served as-is. |

## Local preview

Open `index.html` in a browser, or:

```bash
python -m http.server 8000
```

## Deploying

Push to `main`. Pages rebuilds automatically, usually within a minute.

## DNS

`khai.love` needs these records at the registrar:

```
A     @      185.199.108.153
A     @      185.199.109.153
A     @      185.199.110.153
A     @      185.199.111.153
CNAME www    wildrabbet.github.io.
```
