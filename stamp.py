#!/usr/bin/env python3
# Marks every link to a file in assets/ with ?v= and the first characters of the file's hash, so browsers and Cloudflare,
# which keep those files for hours, fetch a file again as soon as it changes and keep it as long as it does not.
# The stylesheet goes first, as the fonts it links change its own hash. Run it from anywhere before committing.
import hashlib
import pathlib
import re

root = pathlib.Path(__file__).resolve().parent
pages = [root / "assets/site.css", root / "index.html", root / "support/index.html", root / "privacy/index.html",
         root / "404.html"]
link = re.compile(r'(?P<path>(?:https://campfire-songbook\.com/|/|(?:\.\./)*)?(?:assets/)?[\w./-]+\.(?:css|js|webp|png|jpg|svg|woff2))(?:\?v=\w+)?(?=["\')\s,])')

def stamp(page):
	def replace(match):
		path = match["path"]
		if path.startswith("https://campfire-songbook.com/") or path.startswith("/"):
			target = root / path.removeprefix("https://campfire-songbook.com").lstrip("/")
		else:
			target = page.parent / path
		target = target.resolve()
		if not target.is_file() or root / "assets" not in target.parents:
			return match[0]
		return path + "?v=" + hashlib.sha256(target.read_bytes()).hexdigest()[:8]
	text = page.read_text()
	stamped = link.sub(replace, text)
	if stamped != text:
		page.write_text(stamped)
		print("Stamped", page.relative_to(root))

for page in pages:
	stamp(page)
