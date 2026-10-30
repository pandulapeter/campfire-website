#!/usr/bin/env node
// Engraves the sheet music of the home page's ChordPro example as the app does, with the abc2svg of the app's repository
// and the header lines it puts in front of a tune (AbcRendererImpl.kt), once for every transposition the example offers,
// and writes the staves into assets/staves.js for home.js to swap between. Run it after changing the example's ABC, with
// the app's repository next to this one or named as the first argument: node engrave.js [../campfire]
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = __dirname;
const resources = path.join(path.resolve(process.argv[2] || path.join(root, "../Campfire")), "abc/implementation/src/jvmSharedMain/resources");
// SVG units across, about as wide as the page draws the example's column at its 15 pixels, which the app's 16 units of
// text then match.
const width = 460;

const page = fs.readFileSync(path.join(root, "index.html"), "utf8");
const tune = page.match(/\{start_of_abc\}\n([\s\S]*?)\n\{end_of_abc\}/)[1]
	.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

function render(transposition) {
	// An engine of its own for every rendering, as abc2svg numbers its font classes on from the last one.
	var context = { hostLoadModule: function (name) { return /^[a-z0-9]+-1\.js$/.test(name) ? fs.readFileSync(path.join(resources, "abc2svg", name), "utf8") : null; } };
	vm.createContext(context);
	vm.runInContext(fs.readFileSync(path.join(resources, "campfire-abc-host.js"), "utf8"), context);
	vm.runInContext(fs.readFileSync(path.join(resources, "abc2svg/abc2svg-1.js"), "utf8"), context);
	context.hostRenderInput = function () {
		return [
			"%%pagewidth " + width + "px",
			"%%leftmargin 0",
			"%%rightmargin 0",
			"%%gchordfont sans-serif-Bold 16 class=gch",
			"%%annotationfont sans-serif 16",
			"%%vocalfont sans-serif 17.6 class=lyr",
			"%%transpose " + transposition,
			""
		].join("\n") + tune;
	};
	var output = vm.runInContext("campfireRender()", context);
	if (output.charAt(0) === "\0") throw new Error(output.slice(1));
	// The first image holds only abc2svg's styles, which the stylesheet has in its own words (see .staff in site.css), and
	// every one of the others a system, drawn at the column's width by its viewBox. The music symbols are characters of
	// the music font, written as references so that the file stays ASCII.
	return output.split("\0").map(function (svg) {
		var height = svg.match(/viewBox="0 0 [\d.]+ ([\d.]+)"/)[1];
		var body = svg.slice(svg.indexOf(">", svg.indexOf("viewBox")) + 1, svg.lastIndexOf("</svg>"))
			.replace(/<style>[\s\S]*?<\/style>\n?/g, "")
			.replace(/xlink:href/g, "href")
			// The strokes as attributes rather than classes, which a stylesheet cannot reach in the copy a <use> draws.
			.replace(/ class="(stroke|bW|bthW|slW|sW)"/g, function (_, name) {
				return ' fill="none" stroke="currentColor"' + (name === "bW" ? ' stroke-width="1"' : name === "bthW" ? ' stroke-width="3"' : "");
			})
			.replace(/ class="f\d+ (gch|lyr)"/g, ' class="$1"')
			.replace(/[^\x00-\x7f]/g, function (character) { return "&#x" + character.charCodeAt(0).toString(16) + ";"; })
			.trim();
		return body && '<svg viewBox="0 0 ' + width + " " + Number(height) + '">\n' + body + "\n</svg>";
	}).filter(Boolean).join("\n");
}

var staves = {};
// Six semitones up lands on the key the page spells D flat, which abc2svg writes as C sharp unless told otherwise.
for (var transposition = -5; transposition <= 6; transposition++) staves[transposition] = render(transposition === 6 ? "6b" : transposition);
fs.writeFileSync(path.join(root, "assets/staves.js"),
	"// Written by engrave.js: the staves of the home page's ChordPro example, by how many semitones it is transposed.\n" +
	"var staves = " + JSON.stringify(staves, null, "\t") + ";\n");
// The music font is cut down to these (see README.md), so a symbol the staves did not use before needs it cut again.
var symbols = {};
Object.keys(staves).forEach(function (key) {
	staves[key].replace(/<text(?! class)[^>]*>([^<]*)</g, function (_, text) { text.replace(/&#x(\w+);/g, function (_, code) { symbols["U+" + code.toUpperCase()] = true; }); });
});
console.log("Engraved assets/staves.js, with the music symbols " + Object.keys(symbols).sort().join(","));
