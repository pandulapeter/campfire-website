# Campfire website

Static welcome, privacy and support pages for Campfire, hosted on GitHub Pages.

## Local preview

Run `python3 -m http.server 8000` from this directory, then open http://localhost:8000.

## Publishing

GitHub Pages publishes the root of `main`. No build step or dependencies are required.
The app buttons intentionally link to https://pandulapeter.com/campfire/ during migration.
The app itself has not been moved yet.

## Connect campfire-songbook.com

1. In GitHub account Settings → Pages, add and verify the domain using the provided TXT record in GoDaddy DNS.
2. In this repository's Settings → Pages, set the custom domain to `campfire-songbook.com`. GitHub will create the CNAME file; pull that commit before further edits.
3. In GoDaddy DNS, replace parking A records for `@` with these four A records: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`.
4. Point the `www` CNAME to `pandulapeter.github.io`. Preserve unrelated email and verification records.
5. Wait for DNS and the certificate, then enable Enforce HTTPS in repository Settings → Pages.

## App migration checklist

- Publish the app under `/app/`, update its base-path configuration and deploy process, and adapt its SPA 404 routing.
- Check Dropbox OAuth redirect URLs and any absolute links or song-source URLs.
- Browser storage does not transfer across origins. Keep the original app available while users export/import or sync their libraries.
- Only then change the welcome-page app links and introduce redirects for old addresses, preserving paths, query strings and fragments.
- Update published app-store privacy and support URLs as appropriate.

Privacy and support content was copied from the existing personal website, with shared styling and local navigation added. macOS availability is linked to the app README because its store release was pending when this site was created.
