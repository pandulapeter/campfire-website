#!/usr/bin/env python3
# Writes the home page, the support page, and the privacy policy in every language of LANGUAGES but English, each in a
# folder named after its language (hu/, hu/support/, …), from the English pages, which stay the only ones edited by
# hand. Every piece of text an English page shows is looked up in i18n/<language>.json, which maps it, exactly as the
# page's HTML has it (inline tags included, runs of white space as one space), to its translation, also as HTML: the
# text of each heading, paragraph, list item, button, and link, the alt text and the aria-label of each element, the
# page's title and description, the strings in its scripts that start with a capital and hold a space, and the
# description and features of its structured data. A translation that is missing stops the script, so a page never
# goes out half translated, and one no page uses any more is reported. Elements marked translate="no" are left as they
# are, with everything in them.
#
# Links to the three pages lead to the same language's pages, and a file in assets/ is swapped for the one of the same
# name in a folder named after the language beside it, where there is one (assets/screenshots/hu/phone-songs-dark.webp
# for assets/screenshots/phone-songs-dark.webp), so a screenshot taken in a language shows up on its pages as soon as
# it is there. Every page, the English ones included, gets its language picker, the addresses of its other languages
# for search engines, and its locale for link previews, written by this script; sitemap.xml lists them all.
#
# stamp.py runs it first, so the pre-commit hook keeps the translated pages in step. Run it alone to see what is
# missing; --check <language> checks one language's file without writing anything, and --keys prints every text of
# the English pages as the start of a new language's file.
import html
import json
import pathlib
import posixpath
import re
import sys
from urllib.parse import urljoin, urlsplit

root = pathlib.Path(__file__).resolve().parent
SITE = "https://campfire-songbook.com/"
# Each language's code, its name in itself as the picker shows it, its word for "Language", and its locale for Open
# Graph, in the order of the picker (by code, as the app lists them).
LANGUAGES = {
	"de": ("Deutsch", "Sprache", "de_DE"),
	"en": ("English", "Language", "en_US"),
	"es": ("Español", "Idioma", "es_ES"),
	"fr": ("Français", "Langue", "fr_FR"),
	"hu": ("Magyar", "Nyelv", "hu_HU"),
	"it": ("Italiano", "Lingua", "it_IT"),
	"ro": ("Română", "Limbă", "ro_RO"),
}
# The pages that are translated, by their address.
PAGES = {"/": "index.html", "/support/": "support/index.html", "/privacy/": "privacy/index.html"}

TOKEN = re.compile(r"<!--.*?-->|<![^>]*>|<(script|style)\b[^>]*>.*?</\1\s*>|</?[A-Za-z][^>]*>|[^<]+", re.S)
VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"}
# Elements that sit inside a sentence. A run of text and of these is translated as one piece, so that a translation
# can reorder the words around a link or an emphasis.
INLINE = {"a", "abbr", "b", "bdi", "br", "cite", "code", "em", "i", "kbd", "mark", "q", "s", "small", "span", "strong", "sub", "sup", "time", "u"}
TRANSLATED_ATTRIBUTES = ("alt", "aria-label", "title", "placeholder")
TRANSLATED_META = re.compile(r'(?:name="description"|property="og:(?:title|description|image:alt)")')
URL_ATTRIBUTES = re.compile(r'(\s(?:href|src|srcset|data-src|data-srcset|content)=")([^"]*)(")')
STYLE_URL = re.compile(r"(url\()([^)]*)(\))")
JSON_STRING = re.compile(r'"(?:[^"\\]|\\.)*"')
SCRIPT_STRING = re.compile(r'"([A-Z][^"\\\n]* [^"\\\n]*)"')
WORD = re.compile(r"[^\W\d_]{2,}")


class Element:
	def __init__(self, start):
		self.start = start
		self.tag = re.match(r"<([A-Za-z][\w-]*)", start)[1].lower()
		self.children = []
		self.end = ""

	def attribute(self, name):
		match = re.search(r'\s' + re.escape(name) + r'="([^"]*)"', self.start)
		return match[1] if match else None


def parse(text):
	"""The page as a tree of elements, each child a string (text, a comment, or a whole script) or an Element."""
	document = Element("<root>")
	stack = [document]
	for match in TOKEN.finditer(text):
		token = match[0]
		if token.startswith("</"):
			tag = token[2:-1].strip().lower()
			if stack[-1].tag != tag:
				sys.exit(f"localize.py: </{tag}> closes <{stack[-1].tag}> near: {text[max(0, match.start() - 80):match.start()]!r}")
			stack.pop().end = token
		elif re.match(r"<[A-Za-z]", token) and not match[1]:
			element = Element(token)
			stack[-1].children.append(element)
			if element.tag not in VOID and not token.endswith("/>"):
				stack.append(element)
		elif match[1]:
			element = Element(re.match(r"<[^>]*>", token)[0])
			element.children.append(token[len(element.start):token.rindex("</")])
			element.end = token[token.rindex("</"):]
			stack[-1].children.append(element)
		else:
			stack[-1].children.append(token)
	if len(stack) != 1:
		sys.exit(f"localize.py: <{stack[-1].tag}> is never closed.")
	return document


def serialize(node):
	if isinstance(node, str):
		return node
	return node.start + "".join(map(serialize, node.children)) + node.end


def is_inline(node):
	return isinstance(node, str) and not node.startswith("<!--") or isinstance(node, Element) and node.tag in INLINE and all(map(is_inline, node.children))


def plain(fragment):
	return html.unescape(re.sub(r"<[^>]+>", "", fragment))


class Translator:
	def __init__(self, language, strings):
		self.language = language
		self.strings = strings
		self.missing = []
		self.mismatched = []
		self.used = set()

	def __call__(self, key, preformatted=False):
		if not preformatted:
			key = " ".join(key.split())
		self.used.add(key)
		if key in self.strings:
			# A translation keeps every tag of the text, links and all, in whatever order its language needs them.
			if sorted(re.findall(r"<[^>]+>", key)) != sorted(re.findall(r"<[^>]+>", self.strings[key])) and key not in self.mismatched:
				self.mismatched.append(key)
			return self.strings[key]
		if key not in self.missing:
			self.missing.append(key)
		return key

	def attributes(self, element):
		start = element.start
		for name in TRANSLATED_ATTRIBUTES:
			value = element.attribute(name)
			if value and WORD.search(plain(value)):
				start = start.replace(f' {name}="{value}"', f' {name}="{self(value)}"', 1)
		if element.tag == "meta" and TRANSLATED_META.search(start):
			value = element.attribute("content")
			start = start.replace(f' content="{value}"', f' content="{self(value)}"', 1)
		element.start = start

	def script(self, element):
		code = element.children[0]
		if element.attribute("type") == "application/ld+json":
			# Only the strings are swapped, so that the data keeps the layout the English page gives it.
			translated = set()

			def collect(node):
				if isinstance(node, dict):
					for key, value in node.items():
						if key == "description" and isinstance(value, str):
							translated.add(value)
						elif key == "featureList":
							translated.update(value)
						else:
							collect(value)
				elif isinstance(node, list):
					for value in node:
						collect(value)

			collect(json.loads(code))
			code = JSON_STRING.sub(lambda match: json.dumps(self(json.loads(match[0])), ensure_ascii=False).replace("</", "<\\/") if json.loads(match[0]) in translated else match[0], code)
		else:
			code = SCRIPT_STRING.sub(lambda match: json.dumps(self(match[1]), ensure_ascii=False), code)
		element.children[0] = code

	def element(self, element, preformatted=False):
		"""Translates the element's attributes and what it holds, in place."""
		if element.attribute("translate") == "no" or element.tag in ("svg", "style"):
			return
		self.attributes(element)
		if element.tag == "script":
			self.script(element)
			return
		preformatted = preformatted or element.tag == "pre"
		children = element.children
		result = []
		index = 0
		while index < len(children):
			child = children[index]
			if not is_inline(child):
				if isinstance(child, Element):
					self.element(child, preformatted)
				result.append(child)
				index += 1
				continue
			end = index
			while end < len(children) and is_inline(children[end]):
				end += 1
			result.extend(self.run(children[index:end], preformatted))
			index = end
		element.children = result

	def run(self, nodes, preformatted):
		"""A run of text and inline elements: translated as one piece, or, when it is only elements side by side (a row of
		links), each from inside it."""
		if all(isinstance(node, Element) or not node.strip() for node in nodes):
			for node in nodes:
				if isinstance(node, Element):
					self.element(node, preformatted)
			return nodes
		raw = "".join(map(serialize, nodes))
		if not WORD.search(plain(raw)):
			return nodes
		core = raw.strip()
		leading = raw[:len(raw) - len(raw.lstrip())]
		trailing = raw[len(raw.rstrip()):]
		return [leading + self(core, preformatted) + trailing]


def page_address(language, path):
	return path if language == "en" else f"/{language}{path}"


def localized_url(url, source_path, language, target_path):
	"""The URL as the page at target_path in language links it, from the English page at source_path."""
	if not url or url.startswith(("#", "mailto:", "data:")):
		return url
	absolute = url.startswith(SITE)
	if re.match(r"^[a-z][a-z0-9+.-]*:", url) and not absolute:
		return url
	parts = urlsplit(urljoin(SITE + source_path.lstrip("/"), url))
	path = parts.path
	suffix = ("?" + parts.query if parts.query else "") + ("#" + parts.fragment if parts.fragment else "")
	if not absolute and (path in PAGES or path == "/index.html"):
		path = page_address(language, "/" if path == "/index.html" else path)
	elif path.startswith("/assets/"):
		variant = posixpath.join(posixpath.dirname(path), language, posixpath.basename(path))
		if (root / variant.lstrip("/")).is_file():
			path = variant
	if absolute:
		return SITE + path.lstrip("/") + suffix
	if url.startswith("/"):
		return path + suffix
	relative = posixpath.relpath(path, target_path)
	if path.endswith("/") and not relative.endswith("/"):
		relative += "/"
	return relative + suffix


def localize_links(text, source_path, language):
	target_path = page_address(language, source_path)

	def tag(match):
		start = match[0]
		if " hreflang=" in start or start.startswith("<link rel=\"canonical\""):
			return start
		if start.startswith("<meta") and 'property="og:image"' not in start:
			return start
		start = URL_ATTRIBUTES.sub(lambda attribute: attribute[1] + " ".join(localized_url(part, source_path, language, target_path) if index == 0 else part for index, part in enumerate(attribute[2].split(" "))) + attribute[3], start)
		return re.sub(r'(\sstyle=")([^"]*)(")', lambda style: style[1] + STYLE_URL.sub(lambda url: url[1] + localized_url(url[2], source_path, language, target_path) + url[3], style[2]) + style[3], start)

	text = re.sub(r"<[A-Za-z][^>]*>", tag, text)
	return re.sub(r'"(https://campfire-songbook\.com/assets/[^"]+)"', lambda match: '"' + localized_url(match[1], source_path, language, target_path) + '"', text)


def picker(source_path, language, indent):
	"""The language picker of the page at source_path in language: a list of links to the same page in every language."""
	name, word, _ = LANGUAGES[language]
	here = page_address(language, source_path)
	items = []
	for code, (own_name, _, _) in LANGUAGES.items():
		href = posixpath.relpath(page_address(code, source_path), here)
		href = "./" if href == "." else href + "/"
		current = ' aria-current="true"' if code == language else ""
		items.append(f'{indent}\t\t<li><a href="{href}" hreflang="{code}" lang="{code}"{current}>{own_name}</a></li>')
	return (
		f'<details class="languages" translate="no">\n'
		f'{indent}\t<summary aria-label="{word}: {name}"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M2.5 12h19M12 2.5c2.6 2.8 3.9 6 3.9 9.5s-1.3 6.7-3.9 9.5c-2.6-2.8-3.9-6-3.9-9.5s1.3-6.7 3.9-9.5Z"/></svg><span>{language.upper()}</span></summary>\n'
		f'{indent}\t<ul>\n' + "\n".join(items) + f'\n{indent}\t</ul>\n'
		f'{indent}</details>'
	)


def language_links(source_path, language, indent):
	"""The footer's row of links to the same page in every language, which is the picker on a phone."""
	here = page_address(language, source_path)
	items = []
	for code, (own_name, _, _) in LANGUAGES.items():
		href = posixpath.relpath(page_address(code, source_path), here)
		href = "./" if href == "." else href + "/"
		current = ' aria-current="true"' if code == language else ""
		items.append(f'{indent}\t<li><a href="{href}" hreflang="{code}" lang="{code}"{current}>{own_name}</a></li>')
	return f'<ul class="language-links" translate="no" aria-label="{LANGUAGES[language][1]}">\n' + "\n".join(items) + f"\n{indent}</ul>"


def head_and_picker(text, source_path, language):
	"""The page with its language, its addresses, its locale, and its picker written for language."""
	address = SITE + page_address(language, source_path).lstrip("/")
	text = re.sub(r'<html lang="[^"]*">', f'<html lang="{language}">', text, count=1)
	text = re.sub(r'(<link rel="canonical" href=")[^"]*(">)', lambda match: match[1] + address + match[2], text, count=1)
	text = re.sub(r'(<meta property="og:url" content=")[^"]*(">)', lambda match: match[1] + address + match[2], text, count=1)
	text = re.sub(r'\t<link rel="alternate" hreflang="[^"]*" href="[^"]*">\n', "", text)
	alternates = "".join(f'\t<link rel="alternate" hreflang="{code}" href="{SITE}{page_address(code, source_path).lstrip("/")}">\n' for code in LANGUAGES)
	alternates += f'\t<link rel="alternate" hreflang="x-default" href="{SITE}{source_path.lstrip("/")}">\n'
	text = re.sub(r'(\t<link rel="canonical" href="[^"]*">\n)', lambda match: match[1] + alternates, text, count=1)
	text = re.sub(r'\t<meta property="og:locale" content="[^"]*">\n', "", text)
	text = re.sub(r'(\t<meta property="og:site_name" content="[^"]*">\n)', lambda match: match[1] + f'\t<meta property="og:locale" content="{LANGUAGES[language][2]}">\n', text, count=1)
	match = re.search(r'([ \t]*)<details class="languages"[^>]*>.*?</details>', text, re.S)
	if not match:
		sys.exit(f"localize.py: {PAGES[source_path]} has no <details class=\"languages\"> for the language picker.")
	text = text[:match.start()] + match[1] + picker(source_path, language, match[1]) + text[match.end():]
	match = re.search(r'([ \t]*)<ul class="language-links"[^>]*>.*?</ul>', text, re.S)
	if not match:
		sys.exit(f"localize.py: {PAGES[source_path]} has no <ul class=\"language-links\"> for the footer's languages.")
	return text[:match.start()] + match[1] + language_links(source_path, language, match[1]) + text[match.end():]


def sitemap():
	urls = []
	for path in PAGES:
		links = "".join(f'\n\t\t<xhtml:link rel="alternate" hreflang="{code}" href="{SITE}{page_address(code, path).lstrip("/")}"/>' for code in LANGUAGES)
		for code in LANGUAGES:
			urls.append(f"\t<url>\n\t\t<loc>{SITE}{page_address(code, path).lstrip('/')}</loc>{links}\n\t</url>")
	return (
		'<?xml version="1.0" encoding="UTF-8"?>\n'
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
		+ "\n".join(urls) + "\n</urlset>\n"
	)


def write(path, text):
	if not path.exists() or path.read_text() != text:
		path.parent.mkdir(parents=True, exist_ok=True)
		path.write_text(text)
		print("Wrote", path.relative_to(root))


def main(only=None, check=False, finish=lambda page, text: text):
	"""Writes every page; finish is given each page of another language and its text, and returns the text to write."""
	failed = False
	if not check:
		for source_path, file in PAGES.items():
			source = root / file
			write(source, head_and_picker(source.read_text(), source_path, "en"))
	for language in LANGUAGES:
		if language == "en" or only and language != only:
			continue
		strings_file = root / "i18n" / f"{language}.json"
		translate = Translator(language, json.loads(strings_file.read_text()) if strings_file.exists() else {})
		pages = {}
		for source_path, file in PAGES.items():
			document = parse((root / file).read_text())
			translate.element(document)
			text = "".join(map(serialize, document.children))
			pages[source_path] = head_and_picker(localize_links(text, source_path, language), source_path, language)
		if translate.mismatched:
			failed = True
			print(f"localize.py: i18n/{language}.json changes the tags of {len(translate.mismatched)} texts:", file=sys.stderr)
			for key in translate.mismatched:
				print("  " + json.dumps(key, ensure_ascii=False), file=sys.stderr)
		if translate.missing:
			failed = True
			print(f"localize.py: i18n/{language}.json has no translation for {len(translate.missing)} of the English pages' texts:", file=sys.stderr)
			for key in translate.missing:
				print("  " + json.dumps(key, ensure_ascii=False), file=sys.stderr)
			continue
		unused = [key for key in translate.strings if key not in translate.used]
		for key in unused:
			print(f"localize.py: i18n/{language}.json translates a text no page has any more: {json.dumps(key, ensure_ascii=False)}", file=sys.stderr)
		if check or translate.mismatched:
			continue
		for source_path, file in PAGES.items():
			write(root / language / file, finish(root / language / file, pages[source_path]))
	if not check:
		write(root / "sitemap.xml", sitemap())
	if failed:
		sys.exit(1)


def keys():
	"""Every text of the English pages, in the order they show them, as the skeleton of a new language's file."""
	translate = Translator("en", {})
	for file in PAGES.values():
		translate.element(parse((root / file).read_text()))
	print(json.dumps({key: key for key in translate.missing}, indent="\t", ensure_ascii=False))


if __name__ == "__main__":
	if sys.argv[1:] == ["--keys"]:
		keys()
	elif sys.argv[1:2] == ["--check"]:
		main(only=sys.argv[2], check=True)
	else:
		main()
