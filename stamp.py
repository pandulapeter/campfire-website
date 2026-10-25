#!/usr/bin/env python3
# Marks every link to a file in assets/ with ?v= and the first characters of the file's hash, so browsers and Cloudflare,
# which keep those files for hours, fetch a file again as soon as it changes and keep it as long as it does not.
# The stylesheet goes first, as the fonts it links change its own hash. It also writes the questions and answers of the
# support page into that page's FAQPage structured data for search engines, so the two never disagree. Run it from
# anywhere before committing.
import hashlib
import html
import json
import pathlib
import re

root = pathlib.Path(__file__).resolve().parent
pages = [root / "assets/site.css", root / "index.html", root / "support/index.html", root / "privacy/index.html",
         root / "404.html", root / "s/index.html"]
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

def faq(page):
	text = page.read_text()
	section = re.search(r"<h2>Frequently asked questions</h2>(.*?)<h2", text, re.S)[1]
	parts = re.split(r"<h3>(.*?)</h3>", section)[1:]
	def plain(fragment):
		fragment = re.sub(r"</?(?:p|ul|ol|li|br)\b[^>]*>", " ", fragment)
		return " ".join(html.unescape(re.sub(r"<[^>]+>", "", fragment)).split())
	data = {
		"@context": "https://schema.org",
		"@type": "FAQPage",
		"mainEntity": [
			{"@type": "Question", "name": plain(question), "acceptedAnswer": {"@type": "Answer", "text": plain(answer)}}
			for question, answer in zip(parts[0::2], parts[1::2])
		]
	}
	block = json.dumps(data, indent="\t", ensure_ascii=False).replace("</", "<\\/").replace("\n", "\n\t")
	block = '\t<script type="application/ld+json">\n\t' + block + "\n\t</script>\n"
	existing = re.compile(r'\t<script type="application/ld\+json">\n.*?\n\t</script>\n', re.S)
	if existing.search(text):
		updated = existing.sub(lambda _: block, text, count=1)
	else:
		updated = text.replace("\t<link rel=\"icon\"", block + "\t<link rel=\"icon\"", 1)
	if updated != text:
		page.write_text(updated)
		print("Wrote the FAQ of", page.relative_to(root))

faq(root / "support/index.html")
for page in pages:
	stamp(page)
