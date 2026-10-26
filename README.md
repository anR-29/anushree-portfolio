# Anushree Roy — Portfolio

Static site: plain HTML, CSS and JavaScript, no build step. Every push to `main` deploys to GitHub Pages
through `.github/workflows/pages.yml`, which publishes the `.html`, `.css`, `.js` and `.pdf` files plus `assets/`.

## Run locally

```bash
python -m http.server 5173
```

Then open http://localhost:5173/.

## Pages

- `index.html`: intro animation, hero cards, who I am, selected work, what I want to build next, garden footer
  (`hero.css`/`hero.js`, `content.css`/`content.js`, `footer.css`/`footer.js`)
- `about.html`: bio, experience and photos (`about.css`, `about.js`)
- `playground.html`: draggable canvas of side projects and photos; edit cards in `playground-data.js`
- `version-control.html`, `desktop.html`, `social.html`, `decks.html`: case studies (images embedded in the page)
- `builder.html`: the Builders.mu application page

Images, videos and fonts live in `assets/`. `REVERSE-ENGINEERING.md` explains how the playground and about
layouts were rebuilt; it isn't published. `intro.html` is an older standalone intro demo and isn't published either.
