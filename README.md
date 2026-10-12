# Adam Hazimeh’s website

Personal website at [ahazimeh.com](https://ahazimeh.com), published by GitHub Pages from the root of `main`.

## Local preview

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Open <http://127.0.0.1:8765/>. No build step, package installation, or external asset requests are required.

## Editing

- `index.html`: biography, upcoming blogposts, publications, and contact details.
- `blog.html`: blogpost listing. The three entries are unlinked placeholders with titles and illustrations only.
- `style.css`: layout, typography, and dark/light themes.
- `appearance.js`: dark default and a remembered theme preference.
- `site.js`: mounts the illustrations and runs the brief model-addition demonstration.
- `figures/`: the loss landscape, prompt loupe, document layers, and model-addition drawings. Motion uses one shared clock, sleeps offscreen, and respects reduced-motion preferences. The landscape's pointer interaction creates a downward spike; the model diagrams stack and collapse into one.
- `fonts/`: locally served Space Grotesk variable fonts and their SIL Open Font License.
- `vendor/`: the unmodified [Hairline](https://github.com/lucasmarkes/hairline) 0.5.0 renderer (commit `a2217852fed6d1a4f20bc7d43d4fad1a3de117b8`) and MIT license. The loupe and document layers adapt its original figures.
- `CNAME`: custom domain configuration.

When a blogpost is written, add its page and link its title in both listings. Add the arXiv link for “Beyond the Prompt” when available.

The default theme is dark navy; the toggle remembers an explicit light/dark choice. Bio paragraphs after the introduction share a font size. Email is plain text. Without JavaScript, the text and navigation remain available and interactive illustrations are hidden.
