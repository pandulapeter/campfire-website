# Campfire website

The source of [campfire-songbook.com](https://campfire-songbook.com), the website of
[Campfire](https://github.com/pandulapeter/campfire), a free and open-source songbook app for lyrics and chords.

The site introduces the app, links to it on every platform, and hosts its [support](https://campfire-songbook.com/support/)
page and [privacy policy](https://campfire-songbook.com/privacy/).

## How it's built

Plain HTML and CSS served by GitHub Pages straight from the root of `main`, with no build step and no dependencies.

```
index.html            the home page, with the main features next to their screenshots, the text size demo, and an interactive ChordPro example
support/index.html    support and frequently asked questions
privacy/index.html    the privacy policy
de/ es/ fr/ he/ hu/ it/ ro/  the three pages above in each of the other languages, written by localize.py, see Languages
i18n/                 the translations of the English pages' texts, one file per language
404.html              the page GitHub Pages serves for an address that does not exist
s/index.html          the landing page of a shared song or setlist link, see Shared links
.well-known/          assetlinks.json and apple-app-site-association, which let the Android and iOS apps open those links
assets/site.css       the one stylesheet every page shares
assets/home.js        the home page's ChordPro example, its slideshows of screenshots and the text size demo, and the placeholder of a screenshot that is missing
assets/fonts/         Inter, JetBrains Mono, and Noto Sans Hebrew, the fonts the app itself uses, as WOFF2 cut down to Latin and Hebrew, with their licenses
assets/screenshots/   the screenshots of the home page, in a light and a dark version, those of the other languages in a folder per language
assets/icon.svg       the app icon, for the header and the browser tab
assets/peter.webp     the photo of the author in the donation card, cropped square to 480 × 480
assets/icon-192.png   the Play Store icon (`app/android/appIcon.png` in the app's repository), for home screens
assets/demo-cover.png the cover of the app's demo songs, a copy of `app/android/appIcon.png` in the app's repository
CNAME                 the custom domain, managed by GitHub Pages
robots.txt            points search engines to the sitemap
llms.txt              a plain-text summary of the app and its links, for AI assistants (llmstxt.org)
sitemap.xml           the pages search engines should list: the home page, support, and privacy, in every language, written by localize.py
localize.py           writes the pages of the other languages from the English ones and their translations, see Languages
stamp.py              runs localize.py, marks the links to every file in assets/ with the file's hash, and writes the support pages' FAQ for search engines, see Publishing
.githooks/pre-commit  runs stamp.py before every commit
```

The design follows the app: the colors are those of its default theme (`CampfireColorScheme.kt` in the app's repository),
in a light and a dark version that follow the visitor's system setting, as the app does.

The fonts are made from the app's TTF files (in `composeResources/font` of its repository) with
[fontTools](https://github.com/fonttools/fonttools) (`pip install fonttools brotli`), keeping Latin (with Romanian's
Ș, ș, Ț, and ț), punctuation, arrows, and the ♭ ♮ ♯ signs chords are shown with:

```
pyftsubset inter_regular.ttf --unicodes="U+0000-017F,U+0218-021B,U+2000-206F,U+20AC,U+2122,U+2190-21FF,U+2212,U+266D-266F" \
    --layout-features='*' --flavor=woff2 --output-file=inter_regular.woff2
```

Hebrew, which neither has, is drawn in Noto Sans Hebrew, as in the app (`ScriptFaces.kt`). The app bundles only its regular
weight, so both weights are cut from the unhinted static instances of the
[notofonts release](https://github.com/notofonts/hebrew/releases), to the ranges the app keeps:

```
pyftsubset NotoSansHebrew-Regular.ttf --unicodes="U+0590-05FF,U+FB1D-FB4F" --layout-features='*' --no-hinting \
    --flavor=woff2 --output-file=noto_sans_hebrew_regular.woff2
```

The stylesheet names it after Inter, with the same ranges as its `unicode-range`, so a page with no Hebrew never downloads it.

Every visitor is offered two versions first: on Android, iOS, and iPadOS the app from the store, then the web app; on
Windows, macOS, and Linux the web app, then the app for that system. A short script in the head of `index.html`, `support/`,
and `privacy/` names the system, the stylesheet swaps the buttons marked `for-desktop` for those marked `for-mobile`, and
every link marked `data-native` is pointed at the system's own version (and renamed after it when also marked
`data-native-label`); the store links appear in all three scripts. The list of every platform follows in the download
section.

The home page draws the device frames around its screenshots in CSS, so the screenshots are taken without frames. Each
is saved as WebP at quality 85 and named `<device>-<screen>-<theme>.webp`: the device is `laptop` (1200 × 753,
with the black menu bar strip cropped off the top of the Mac screenshot), `tablet` (1200 × 900, an iPad held sideways),
or `phone` (450 × 978, an iPhone), about as wide as the page ever draws them on a 2x screen, and the theme `light` or `dark`. A screenshot that is missing keeps its place,
striped and named after the file it waits for. The two metronome screenshots show the click playing with no beat lit; `<name>-beats-<theme>.webp` holds
each beat lit, side by side on a transparent strip, and the stylesheet fades them in over the screenshot in turn at its
120 BPM; the page names the strips in the `--beats-light` and `--beats-dark` of each, so that every language can have
its own. The screenshots of the other languages are in `assets/screenshots/<language>/` under the same names. One that
is not there is shown in English, which is how a screenshot with nothing translated in it is kept: once. `og-image.jpg` (1200 × 630) is the preview image for links shared on
social media.

## Shared links

The app shares a song or setlist as `https://campfire-songbook.com/s/#<payload>`, where the payload names a zip in the
sharer's Dropbox (`ShareLinks.kt` in the app's repository holds the grammar). The payload sits in the fragment, so it
never reaches this site's server or a messenger's link preview, which see only the page's Open Graph text.

`s/index.html` reads the fragment with a hand copy of the app's regex, which must stay in step with `ShareLinks.kt`, and
fetches nothing. It shows the title as text and offers the ways to open the link on the visitor's system, in the
language picked in the site's picker or else the first of the browser's languages the site has, with its texts for
every language in the page. Two cards come first, in the order the rest of the site uses: the app at
`campfire://s/<payload>` (on Android an `intent://` address that falls back to Play with the link in the install
referrer) and the web app at `/app/#<payload>`. A line under them links to the system's store listing (on iOS and iPadOS
copying the link first, for the app's first launch), then come the file's direct download and a link to the home page.
It never tries to tell whether the app is installed: the store line is there for when nothing happened. Its few styles
of its own are in the page.

With the app installed, Android and iOS open these links themselves, which `.well-known/` allows: `assetlinks.json`
names the Android package and the SHA-256 of the certificate Play installs it with, and `apple-app-site-association`
the team and bundle ID. Both must be live before an app release that relies on them; Apple fetches its file through its
own CDN and keeps it for a day or more.

## Languages

The site is in English, German, Spanish, French, Hebrew, Hungarian, Italian, and Romanian, the languages of the app. The English
pages are at the root and are the only ones edited by hand; `localize.py` writes the others into `de/`, `es/`, `fr/`,
`he/`, `hu/`, `it/`, and `ro/` from them. Every text of an English page, as its HTML has it (a link or an emphasis inside a
sentence included), is looked up in `i18n/<language>.json` and replaced by its translation, which keeps the same tags in
whatever order the language needs. Elements marked `translate="no"` (the brand, the ChordPro example's song) are left as
they are. Links between the pages stay within the language, and a file in `assets/` is swapped for the one of the same
name in a folder named after the language beside it, where there is one: the screenshots taken in each language, and
`assets/<language>/og-image.jpg` should a language get its own link preview.

A text with no translation stops the script, and with it the commit, listing what is missing, so a page never goes out
half translated: change an English text and its seven translations together. `python3 localize.py --check hu` checks one
language without writing anything, and a translation no page uses any more is reported. The UI names the pages mention
(*Settings → Features*) are the app's own, from its `strings.xml` in each language.

`localize.py` also writes each page's language picker (a list of links to the same page in every language, in the
header on screens wider than 860 pixels, where it fits beside the longer languages' links and buttons, and as a row in
the footer on every screen), the addresses of its other languages for search engines (`hreflang`), its `og:locale`, and `sitemap.xml`.
The English pages are also those of every other language: a short script at the top of each page's head sends a visitor
who lands on one to the same page in the first of their browser's languages the site has, unless they picked a language
in the picker, which is remembered in the browser. A page in another language never sends anyone elsewhere, so a link to
it always opens in the language it names. The 404 page and the landing page of shared links choose their language in
the browser the same way.

Hebrew is written from the right. `localize.py` marks the pages of every language in its `RIGHT_TO_LEFT` with
`dir="rtl"`, and the 404 page and the landing page of shared links set it in the browser. The stylesheet lays the pages
out in logical properties (`inset-inline-start`, `margin-inline-end`, …), so such a page is the mirror image of the
others; the few things that differ beyond that are marked `[dir="rtl"]` in it: the arrows that point the way the page
reads, the text size slider's fill, and file names and folders in a sentence, which keep their own direction. The
ChordPro example's song is in English, so the example reads from the left on every page, as the app lays out a song in
its own language's direction. An English word next to another across a sentence break (*Péter. Campfire*) is read as one
run from the left, so a Hebrew sentence never starts with one right after another ends with one.

To add a language, add it to `LANGUAGES` in `localize.py` (and to `RIGHT_TO_LEFT` if it is written from the right), to the list in the head script of the three English pages, to
`languages` in `.githooks/pre-commit`, and to the texts of `404.html` and `s/index.html`; then start its file from
`python3 localize.py --keys`.

## Running it locally

```
python3 -m http.server 8000
```

Then open http://localhost:8000. Any other static file server works too.

## Publishing

Every push to `main` is published by GitHub Pages within a minute or two.

Browsers keep the files in `assets/` for up to 4 hours (Cloudflare's browser cache setting), but the pages for only 10
minutes, so a changed screenshot or stylesheet could reach visitors long after the pages that link it. Every link to a
file in `assets/` ends in `?v=` and the start of the file's hash, which `stamp.py` writes. Every page linking a changed
file asks for it anew within 10 minutes, while the files that did not change stay cached.

`stamp.py` first writes the pages of the other languages with `localize.py`, then marks the links of every page. It also
writes the questions and answers under *Frequently asked questions* on each support page into the structured data
(FAQPage JSON-LD) in that page's head, so edit the visible text only and let it follow.

The pre-commit hook in `.githooks/` runs `stamp.py` and stages the pages it updates. Git runs it once a clone is told
where it is:

```
git config core.hooksPath .githooks
```

## Credits

The store badges are copies of the ones in `documentation/images` in the app's repository. Inter, JetBrains Mono, and Noto Sans Hebrew are licensed under
the SIL Open Font License 1.1, included next to them. The name Campfire and the app icon belong to
[Péter Pandula](https://pandulapeter.com), as described in the app's repository.
