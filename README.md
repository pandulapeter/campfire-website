# Campfire website

The source of [campfire-songbook.com](https://campfire-songbook.com), the website of
[Campfire](https://github.com/pandulapeter/campfire), a free and open-source songbook app for lyrics and chords.

The site introduces the app, links to it on every platform, and hosts its [support](https://campfire-songbook.com/support/)
page and [privacy policy](https://campfire-songbook.com/privacy/).

## How it's built

Plain HTML and CSS served by GitHub Pages straight from the root of `main`, with no build step and no dependencies.

```
index.html            the home page, with the feature overview, screenshots and interactive ChordPro example
support/index.html    support and frequently asked questions
privacy/index.html    the privacy policy
404.html              the page GitHub Pages serves for an address that does not exist
assets/site.css       the one stylesheet every page shares
assets/fonts/         Inter and JetBrains Mono, the fonts the app itself uses, with their licenses
assets/screenshots/   the screenshots of the home page, in a light and a dark version
assets/icon.svg       the app icon, for the header and the browser tab
assets/icon-192.png   the Play Store icon (`app/android/appIcon.png` in the app's repository), for home screens
CNAME                 the custom domain, managed by GitHub Pages
```

The design follows the app: the colors are those of its default theme (`CampfireColorScheme.kt` in the app's repository),
in a light and a dark version that follow the visitor's system setting, as the app does.

The home page draws the device frames around its screenshots in CSS, so the screenshots are taken without frames. Each
is saved as WebP at quality 85, in a light and a dark version: 2000 wide for the laptop (with the black menu bar strip
cropped off the top of the Mac screenshot), 1400 for the tablet and 600 for the phones. `hero-light.webp` is the preview
image for links shared on social media.

## Running it locally

```
python3 -m http.server 8000
```

Then open http://localhost:8000. Any other static file server works too.

## Publishing

Every push to `main` is published by GitHub Pages within a minute or two.

Browsers keep `assets/site.css` for up to 4 hours (Cloudflare's browser cache setting), but the pages for only 10 minutes,
so a changed stylesheet could reach visitors long after the pages that need it. Every page links it as `site.css?v=N`:
when the stylesheet changes, raise `N` in all four pages (`index.html`, `support/`, `privacy/` and `404.html`) in the same commit.

## Credits

The store badges are copies of the ones in `documentation/images` in the app's repository. Inter and JetBrains Mono are licensed under
the SIL Open Font License 1.1, included next to them. The name Campfire and the app icon belong to
[Péter Pandula](https://pandulapeter.com), as described in the app's repository.
