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
404.html              the page GitHub Pages serves for an address that does not exist
s/index.html          the landing page of a shared song or setlist link, see Shared links
.well-known/          assetlinks.json and apple-app-site-association, which let the Android and iOS apps open those links
assets/site.css       the one stylesheet every page shares
assets/home.js        the home page's ChordPro example, its slideshows of screenshots and the text size demo, and the placeholder of a screenshot that is missing
assets/fonts/         Inter and JetBrains Mono, the fonts the app itself uses, as WOFF2 cut down to Latin, with their licenses
assets/screenshots/   the screenshots of the home page, in a light and a dark version
assets/icon.svg       the app icon, for the header and the browser tab
assets/peter.webp     the photo of the author in the donation card, cropped square to 480 × 480
assets/icon-192.png   the Play Store icon (`app/android/appIcon.png` in the app's repository), for home screens
assets/demo-cover.png the cover of the app's demo songs, a copy of `app/android/appIcon.png` in the app's repository
CNAME                 the custom domain, managed by GitHub Pages
robots.txt            points search engines to the sitemap
sitemap.xml           the pages search engines should list: the home page, support, and privacy
stamp.py              marks the links to every file in assets/ with the file's hash, and writes the support page's FAQ for search engines, see Publishing
.githooks/pre-commit  runs stamp.py before every commit
```

The design follows the app: the colors are those of its default theme (`CampfireColorScheme.kt` in the app's repository),
in a light and a dark version that follow the visitor's system setting, as the app does.

The fonts are made from the app's TTF files (in `composeResources/font` of its repository) with
[fontTools](https://github.com/fonttools/fonttools) (`pip install fonttools brotli`), keeping Latin, punctuation, arrows,
and the ♭ ♮ ♯ signs chords are shown with:

```
pyftsubset inter_regular.ttf --unicodes="U+0000-017F,U+2000-206F,U+20AC,U+2122,U+2190-21FF,U+2212,U+266D-266F" \
    --layout-features='*' --flavor=woff2 --output-file=inter_regular.woff2
```

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
120 BPM. `og-image.jpg` (1200 × 630) is the preview image for links shared on
social media.

## Shared links

The app shares a song or setlist as `https://campfire-songbook.com/s/#<payload>`, where the payload names a zip in the
sharer's Dropbox (`ShareLinks.kt` in the app's repository holds the grammar). The payload sits in the fragment, so it
never reaches this site's server or a messenger's link preview, which see only the page's Open Graph text.

`s/index.html` reads the fragment with a hand copy of the app's regex, which must stay in step with `ShareLinks.kt`, and
fetches nothing. It shows the title as text and offers the ways to open the link on the visitor's system, in English or
Hungarian by the browser's language. Two cards come first, in the order the rest of the site uses: the app at
`campfire://s/<payload>` (on Android an `intent://` address that falls back to Play with the link in the install
referrer) and the web app at `/app/#<payload>`. A line under them links to the system's store listing (on iOS and iPadOS
copying the link first, for the app's first launch), then come the file's direct download and a link to the home page.
It never tries to tell whether the app is installed: the store line is there for when nothing happened. Its few styles
of its own are in the page.

With the app installed, Android and iOS open these links themselves, which `.well-known/` allows: `assetlinks.json`
names the Android package and the SHA-256 of the certificate Play installs it with, and `apple-app-site-association`
the team and bundle ID. Both must be live before an app release that relies on them; Apple fetches its file through its
own CDN and keeps it for a day or more.

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

`stamp.py` also writes the questions and answers under *Frequently asked questions* on the support page into the
structured data (FAQPage JSON-LD) in that page's head, so edit the visible text only and let it follow.

The pre-commit hook in `.githooks/` runs `stamp.py` and stages the pages it updates. Git runs it once a clone is told
where it is:

```
git config core.hooksPath .githooks
```

## Credits

The store badges are copies of the ones in `documentation/images` in the app's repository. Inter and JetBrains Mono are licensed under
the SIL Open Font License 1.1, included next to them. The name Campfire and the app icon belong to
[Péter Pandula](https://pandulapeter.com), as described in the app's repository.
