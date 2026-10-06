# Campfire website

The source of [campfire-songbook.com](https://campfire-songbook.com), the website of
[Campfire](https://github.com/pandulapeter/campfire), a free and open-source songbook app for lyrics and chords.

The site introduces the app, links to it on every platform, and hosts its [support](https://campfire-songbook.com/support/)
page and [privacy policy](https://campfire-songbook.com/privacy/).

## How it's built

Plain HTML and CSS served by GitHub Pages straight from the root of `main`, with no build step and no dependencies.

```
index.html            the home page, with the main features next to their screenshots and an interactive ChordPro example
support/index.html    support and frequently asked questions
privacy/index.html    the privacy policy
404.html              the page GitHub Pages serves for an address that does not exist
assets/site.css       the one stylesheet every page shares
assets/home.js        the home page's ChordPro example, and the placeholder of a screenshot that is missing
assets/fonts/         Inter and JetBrains Mono, the fonts the app itself uses, as WOFF2 cut down to Latin, with their licenses
assets/screenshots/   the screenshots of the home page, in a light and a dark version
assets/icon.svg       the app icon, for the header and the browser tab
assets/peter.webp     the photo of the author in the donation card, cropped square to 480 × 480
assets/icon-192.png   the Play Store icon (`app/android/appIcon.png` in the app's repository), for home screens
CNAME                 the custom domain, managed by GitHub Pages
```

The design follows the app: the colors are those of its default theme (`CampfireColorScheme.kt` in the app's repository),
in a light and a dark version that follow the visitor's system setting, as the app does.

The fonts are made from the app's TTF files (in `composeResources/font` of its repository) with
[fontTools](https://github.com/fonttools/fonttools) (`pip install fonttools brotli`), keeping Latin, punctuation and arrows:

```
pyftsubset inter_regular.ttf --unicodes="U+0000-017F,U+2000-206F,U+20AC,U+2122,U+2190-21FF,U+2212" \
    --layout-features='*' --flavor=woff2 --output-file=inter_regular.woff2
```

On Android, iPhone and iPad, the home page and the header offer the device's app store instead of the web app. A short
script in the head of `index.html`, `support/` and `privacy/` marks the page, and the stylesheet swaps the buttons marked
`for-desktop` for those marked `for-mobile`; the store links appear in all three scripts.

The home page draws the device frames around its screenshots in CSS, so the screenshots are taken without frames. Each
is saved as WebP at quality 85 and named `<device>-<screen>-<theme>.webp`: the device is `laptop` (2000 × 1255,
with the black menu bar strip cropped off the top of the Mac screenshot), `tablet` (1400 × 1050, an iPad held sideways)
or `phone` (600 × 1304, an iPhone), and the theme `light` or `dark`. A screenshot that is missing keeps its place,
striped and named after the file it waits for. `og-image.jpg` (1200 × 630) is the preview image for links shared on
social media.

## Running it locally

```
python3 -m http.server 8000
```

Then open http://localhost:8000. Any other static file server works too.

## Publishing

Every push to `main` is published by GitHub Pages within a minute or two.

Browsers keep `assets/site.css` for up to 4 hours (Cloudflare's browser cache setting), but the pages for only 10 minutes,
so a changed stylesheet could reach visitors long after the pages that need it. Every page links it as `site.css?v=N`:
when the stylesheet changes, raise `N` in all four pages (`index.html`, `support/`, `privacy/` and `404.html`) in the same commit. `home.js?v=N` in `index.html` is raised the same way when the script changes.

## Credits

The store badges are copies of the ones in `documentation/images` in the app's repository. Inter and JetBrains Mono are licensed under
the SIL Open Font License 1.1, included next to them. The name Campfire and the app icon belong to
[Péter Pandula](https://pandulapeter.com), as described in the app's repository.
