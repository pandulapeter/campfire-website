# Campfire website

The source of [campfire-songbook.com](https://campfire-songbook.com), the website of
[Campfire](https://github.com/pandulapeter/campfire), a free and open-source songbook app for lyrics and chords.

The site introduces the app, links to it on every platform, and hosts its [support](https://campfire-songbook.com/support/)
page and [privacy policy](https://campfire-songbook.com/privacy/).

## How it's built

Plain HTML and CSS served by GitHub Pages straight from the root of `main`, with no build step and no dependencies.

```
index.html            the home page, including the small script behind the interactive ChordPro example
support/index.html    support and frequently asked questions
privacy/index.html    the privacy policy
404.html              the page GitHub Pages serves for an address that does not exist
assets/site.css       the one stylesheet every page shares
assets/fonts/         Inter and JetBrains Mono, the fonts the app itself uses, with their licenses
assets/platforms/     the platform icons of the download list
assets/icon.svg       the app icon
CNAME                 the custom domain, managed by GitHub Pages
```

The design follows the app: the colors are those of its default theme (`CampfireColorScheme.kt` in the app's repository),
in a light and a dark version that follow the visitor's system setting, as the app does.

The screenshots are not copied here. They are loaded from `documentation/screenshots` in the
[app's repository](https://github.com/pandulapeter/campfire) through [jsDelivr](https://www.jsdelivr.com), so replacing
them there updates the website too. jsDelivr caches them for up to 12 hours; to publish a new one sooner, open its
address with `purge.jsdelivr.net` in place of `cdn.jsdelivr.net`.

## Running it locally

```
python3 -m http.server 8000
```

Then open http://localhost:8000. Any other static file server works too.

## Publishing

Every push to `main` is published by GitHub Pages within a minute or two.

## Credits

The platform icons are from [Simple Icons](https://simpleicons.org) (CC0). Inter and JetBrains Mono are licensed under
the SIL Open Font License 1.1, included next to them. The name Campfire and the app icon belong to
[Pandula Péter](https://pandulapeter.com), as described in the app's repository.
