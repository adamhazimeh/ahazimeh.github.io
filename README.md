# Adam Hazimeh’s website

Personal website at [ahazimeh.com](https://ahazimeh.com), published by GitHub Pages from the root of `main`.

## Local preview

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Open <http://127.0.0.1:8765/>. No build step, dependencies, or external assets are required.

## Editing

- `index.html`: biography, upcoming blogposts, publications, and contact details.
- `blog.html`: blogpost listing. The three entries are unlinked placeholders with titles and illustrations only.
- `style.css`: layout, typography, and dark/light themes.
- `appearance.js`: dark default and a remembered theme preference.
- `slideshow.js`: seven-second research slideshow with a progress bar. Hover or focus pauses it; arrow keys change slides. Reduced motion and disabled JavaScript show both illustrations statically.
- `illustrations/`: editable SVGs in dark and light versions.
- `CNAME`: custom domain configuration.

When a blogpost is written, add its page and link its title in both listings. Add the arXiv link for “Beyond the Prompt” when available.
