// What the visitor set the page's controls to, carried over to the same page in the language they pick in the picker,
// as the head script carries over how far down they were: that page has the same controls in the same order. The
// controls below start from what was carried over, and keep the state up to date as they change.
var state = { slides: {} };
var carried = {};
try {
	carried = JSON.parse(sessionStorage.getItem("controls")) || {};
	sessionStorage.removeItem("controls");
	if (carried.page !== location.pathname) carried = {};
} catch (e) {}
document.addEventListener("click", function (event) {
	var link = event.target.closest("a[hreflang]");
	if (link) try { sessionStorage.setItem("controls", JSON.stringify(Object.assign({ page: link.pathname }, state))); } catch (e) {}
});

// Renders the ChordPro example the way the app lays it out, chords above the syllables they belong to, and
// transposes it and shows it in another notation. The file on the left is left alone, as it is in the app.
(function () {
	var sharps = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
	var flats = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
	var indices = {};
	sharps.forEach(function (name, index) { indices[name] = index; indices[flats[index]] = index; });
	// The keys written with flats, by the index of their major (a minor key's relative major): F, Bb, Eb, Ab and Db.
	// The rest are written with sharps, so the song's chords are spelled the way its key signature has them.
	var flatKeys = [5, 10, 3, 8, 1];
	var latin = { "C": "Do", "D": "Re", "E": "Mi", "F": "Fa", "G": "Sol", "A": "La", "B": "Si" };
	// Nashville numbers and Roman numerals count from the key's own note, a minor key's too, so in A minor Am is 1- or
	// i and C is b3 or bIII. A bass note is a number in both, as in the app.
	var degrees = ["1", "b2", "2", "b3", "3", "4", "#4", "5", "b6", "6", "b7", "7"];
	var numerals = ["I", "bII", "II", "bIII", "III", "IV", "#IV", "V", "bVI", "VI", "bVII", "VII"];
	var sourceElement = document.getElementById("chordpro-source");
	var sheet = document.getElementById("chordpro-sheet");
	var value = document.getElementById("transpose-value");
	var source = sourceElement.textContent;
	// The names of the sections without one of their own, in the page's language, as the page first shows them.
	var labels = {};
	sheet.querySelectorAll(".section-label").forEach(function (label) { labels[label.dataset.section] = label.textContent; });
	var key = "G";
	// The example opens transposed to E, a key whose fifth, B, is spelled differently in every notation (H in German).
	var offset = typeof carried.offset === "number" ? carried.offset : -3;
	var notation = carried.notation || "standard";

	function noteName(index, notation) {
		var major = (indices[key.charAt(0)] + offset + (/m$/.test(key) ? 3 : 0) + 120) % 12;
		var name = (flatKeys.indexOf(major) === -1 ? sharps : flats)[index];
		switch (notation) {
			case "german": return name === "B" ? "H" : name === "Bb" ? "B" : name;
			case "latin": return latin[name.charAt(0)] + name.slice(1);
			default: return name;
		}
	}

	// The chord as HTML. Counted from the key, the quality is a minus after a number and the case of a numeral (small
	// for minor and diminished, with a ° or an ø, a + after an augmented one), and the rest follows as written: 57, V7.
	function transposeChord(chord, notation) {
		return chord.replace(/^([A-G][b#]?)(.*?)(?:\/([A-G][b#]?))?$/, function (_, root, rest, bass) {
			function note(name) { return escape(noteName((indices[name] + offset + 120) % 12, notation)); }
			if (notation === "nashville" || notation === "roman") {
				// The chord and the key move together, so the step stays the same whatever the transposition.
				var degree = (indices[root] - indices[key.charAt(0)] + 120) % 12;
				var after = bass ? "/" + degrees[(indices[bass] - indices[key.charAt(0)] + 120) % 12] : "";
				var quality = rest.match(/^(?:min|mi|m(?!aj)|-|dim|°|ø|aug|\+)/);
				quality = quality ? quality[0] : "";
				rest = rest.slice(quality.length);
				var minor = /^(?:min|mi|m|-)$/.test(quality);
				if (notation === "nashville") return degrees[degree] + (minor ? "-" : "") + escape(quality && !minor ? quality + rest : rest) + after;
				var step = numerals[degree];
				if (minor && rest.indexOf("7b5") === 0) return step.toLowerCase() + "ø" + escape("7" + rest.slice(3)) + after;
				if (minor) return step.toLowerCase() + escape(rest) + after;
				if (quality === "dim" || quality === "°") return step.toLowerCase() + "°" + escape(rest) + after;
				if (quality === "ø") return step.toLowerCase() + "ø" + escape(rest) + after;
				if (quality === "aug" || quality === "+") return step + "+" + escape(rest) + after;
				return step + escape(rest) + after;
			}
			return note(root) + escape(rest) + (bass ? "/" + note(bass) : "");
		});
	}

	// The sheet draws its accidentals as the app does, as signs: no quality, note, or Latin name holds a lowercase b, so
	// every b in a shown chord is a flat. The file on the left keeps the # and b every program reads.
	function signs(chord) {
		return chord.replace(/#/g, "\u266F").replace(/b/g, "\u266D");
	}

	function escape(text) {
		return text.replace(/&/g, "&amp;").replace(/</g, "&lt;");
	}

	// The sheet music, as the app draws it: the staves abc2svg engraved at this transposition (written by engrave.js into
	// staves.js), with every chord symbol named as the lyrics' chords are, in order. Without them it stays its text, as a
	// tune the app cannot render does.
	function sheetMusic(lines) {
		var html = '<p class="section-label" data-section="abc">' + escape(labels.abc) + "</p>";
		if (typeof staves === "undefined") return html + '<pre class="abc" translate="no">' + escape(lines.join("\n")) + "</pre>";
		var chords = [];
		lines.forEach(function (line) {
			if (!/^[A-Za-z]:/.test(line)) line.replace(/"([^"^_<>@][^"]*)"/g, function (_, chord) { chords.push(chord); });
		});
		var staff = document.createElement("div");
		staff.className = "staff";
		staff.setAttribute("translate", "no");
		staff.innerHTML = staves[offset];
		staff.querySelectorAll(".gch").forEach(function (symbol, index) {
			if (chords[index]) symbol.textContent = signs(transposeChord(chords[index], notation));
		});
		return html + staff.outerHTML;
	}

	// The tab, engraved in the proportions the app uses (TabEngraving.kt, in SVG units of 16 to the lyrics' em): the
	// strings as lines, broken by the fret numbers on them, the bar lines across them, the strings' names in front, and
	// the row of chords above. Transposing moves the frets and leaves the tuning, as the app does; the example's stay on
	// the neck at every offset, so none of it ever moves by an octave instead. A column widens or narrows on every string by
	// what its widest fret gained or lost in digits, which moves what follows, chords included.
	function tab(lines, label) {
		var fretSize = 11.2, stringSpacing = 9.6, column = fretSize * 0.62 * 1.25, chordSize = 16, top = 24;
		var staffLines = lines.filter(function (line) { return /-/.test(line) && /\|/.test(line); });
		var chordLines = lines.filter(function (line) { return staffLines.indexOf(line) === -1 && line.trim() !== ""; });
		var gained = [];
		var frets = staffLines.map(function (line) {
			var moved = [];
			line.replace(/\d+/g, function (digits, at) {
				var text = String(Number(digits) + offset);
				moved.push({ at: at, text: text });
				gained[at] = Math.max(at in gained ? gained[at] : -Infinity, text.length - digits.length);
			});
			return moved;
		});
		function x(at) {
			var columns = at;
			for (var i = 0; i < at; i++) columns += gained[i] || 0;
			return columns * column;
		}
		var length = Math.max.apply(null, staffLines.map(function (line) { return line.length; }));
		var width = x(length), bottom = top + (staffLines.length - 1) * stringSpacing, svg = "";
		chordLines.forEach(function (line) {
			line.replace(/\S+/g, function (chord, at) {
				svg += '<text class="chord" x="' + x(at).toFixed(1) + '" y="' + (top - 12) + '">' + signs(transposeChord(chord, notation)) + "</text>";
			});
		});
		staffLines.forEach(function (line, string) {
			var y = top + string * stringSpacing, nameEnd = line.search(/[-|]/);
			svg += '<text class="string" x="' + (x(nameEnd) + column / 2 - 3).toFixed(1) + '" y="' + (y + 4).toFixed(1) + '">' + escape(line.slice(0, nameEnd)) + "</text>";
			svg += '<path d="M' + (x(nameEnd) + column / 2).toFixed(1) + " " + y.toFixed(1) + "H" + (x(line.length - 1) + column / 2).toFixed(1) + '"/>';
		});
		staffLines[0].replace(/\|/g, function (_, at) {
			svg += '<path d="M' + (x(at) + column / 2).toFixed(1) + " " + top + "V" + bottom.toFixed(1) + '"/>';
		});
		frets.forEach(function (moved, string) {
			moved.forEach(function (fret) {
				svg += '<text class="fret" x="' + (x(fret.at) + fret.text.length * column / 2).toFixed(1) + '" y="' + (top + string * stringSpacing + 4).toFixed(1) + '">' + fret.text + "</text>";
			});
		});
		return '<p class="section-label"' + (label ? ' translate="no"' : ' data-section="tab"') + ">" + escape(label || labels.tab) + '</p><div class="tab" translate="no"><svg viewBox="0 0 ' + width.toFixed(1) + " " + (bottom + 6).toFixed(1) +
			'" style="width: ' + (width / chordSize).toFixed(2) + 'em">' + svg + "</svg></div>";
	}

	function render() {
		var html = "", environment = null, environmentLabel, environmentLines = [];
		source.split("\n").forEach(function (line) {
			if (environment) {
				if (line !== "{end_of_" + environment + "}") return environmentLines.push(line);
				html += environment === "abc" ? sheetMusic(environmentLines) : tab(environmentLines, environmentLabel);
				environment = null;
				return;
			}
			var start = line.match(/^\{start_of_(abc|tab)(?::\s*(.*?))?\}$/);
			if (start) {
				environment = start[1];
				environmentLabel = start[2];
				environmentLines = [];
				return;
			}
			var section = line.match(/^\{(?:start_of_verse|sov)(?::\s*(.*?))?\}$/);
			if (section) {
				html += '<p class="section-label"' + (section[1] ? "" : ' data-section="verse"') + ">" + escape(section[1] || labels.verse) + "</p>";
				return;
			}
			if (line.charAt(0) === "{" || line.charAt(0) === "#" || line.trim() === "") return;
			html += '<div class="line">';
			line.split("[").forEach(function (part, index) {
				var chord = "", text = part;
				if (index > 0) {
					var end = part.indexOf("]");
					chord = signs(transposeChord(part.slice(0, end), notation));
					text = part.slice(end + 1);
				}
				if (chord || text) html += '<span class="segment"><b>' + chord + "</b>" + escape(text || " ") + "</span>";
			});
			html += "</div>";
		});
		sheet.innerHTML = html;
		state.offset = offset;
		state.notation = notation;
		// Keys stay in letters under Nashville numbers and Roman numerals, which mean nothing without one.
		value.textContent = (offset > 0 ? "+" : "") + offset + " · " + signs(transposeChord(key, notation === "nashville" || notation === "roman" ? "standard" : notation));
	}

	sourceElement.innerHTML = escape(source)
		.replace(/\{[^}]*\}/g, '<span class="directive">$&</span>')
		.replace(/\[[^\]]*\]/g, '<span class="chord">$&</span>');
	document.querySelector(".transpose").hidden = false;
	document.querySelector(".notation").hidden = false;
	document.querySelectorAll(".notation button").forEach(function (button, _, buttons) {
		button.setAttribute("aria-pressed", button.dataset.notation === notation);
		button.addEventListener("click", function () {
			notation = button.dataset.notation;
			buttons.forEach(function (other) { other.setAttribute("aria-pressed", other === button); });
			render();
		});
	});
	value.addEventListener("click", function () {
		offset = 0;
		render();
	});
	document.querySelectorAll(".transpose button[data-step]").forEach(function (button) {
		button.addEventListener("click", function () {
			// Twelve steps bring a song back to its own key, so the offset goes around a circle, from -5 to +6
			// (+6 and -6 being the same key): past either end it carries on from the other one.
			offset = ((offset + Number(button.dataset.step) + 5) % 12 + 12) % 12 - 5;
			render();
		});
	});
	render();
})();

// A screen, or a pair of devices, under a row of pills that name its screenshots and jump to one.
document.querySelectorAll(".slides:not(.demo)").forEach(function (slides) {
	var frames = Array.prototype.slice.call(slides.children);
	var buttons = Array.prototype.slice.call(document.querySelectorAll('.slides-nav button[aria-controls="' + slides.id + '"]'));
	buttons.forEach(function (button, index) {
		button.addEventListener("click", function () {
			frames.forEach(function (frame, i) { frame.setAttribute("aria-hidden", i !== index); });
			buttons.forEach(function (button, i) { button.setAttribute("aria-pressed", i === index); });
			state.slides[slides.id] = index;
		});
	});
	var shown = (carried.slides || {})[slides.id];
	if (buttons[shown]) buttons[shown].click();
});

// The text size demo: one song at every size the slider stops at, which the slider picks, named for screen readers by
// its data-values. The page shows the first; the others wait in data-src and data-srcset, since a lazy image the browser
// lays out under the first would be fetched as early as a visible one, and are fetched together once a quarter of the
// demo is in view, so that a visitor who never scrolls to it never downloads them. The slider stays disabled until
// every one of them is there, so that a drag never lands on a screenshot still loading.
// It starts at the first whatever position the browser kept from an earlier visit, unless a language was just picked
// with another one shown, which it then moves to once it is enabled.
(function () {
	var slides = document.querySelector(".slides.demo");
	if (!slides) return;
	var frames = Array.prototype.slice.call(slides.children);
	var range = document.querySelector('input[type="range"][aria-controls="' + slides.id + '"]');
	var values = range.dataset.values.split(",");
	var images = frames.map(function (frame) { return frame.querySelector("img"); });

	function show(index) {
		frames.forEach(function (frame, i) { frame.setAttribute("aria-hidden", i !== index); });
		range.setAttribute("aria-valuetext", values[index]);
		range.style.setProperty("--fill", index / (frames.length - 1) * 100 + "%");
		state.textSize = index;
	}

	function start() {
		range.disabled = false;
		range.value = frames[carried.textSize] ? carried.textSize : 0;
		show(Number(range.value));
		range.addEventListener("input", function () { show(Number(range.value)); });
	}

	range.disabled = true;
	new IntersectionObserver(function (entries, observer) {
		if (!entries[0].isIntersecting) return;
		observer.disconnect();
		frames.forEach(function (frame) {
			frame.querySelectorAll("[data-srcset]").forEach(function (source) { source.srcset = source.dataset.srcset; });
			frame.querySelectorAll("[data-src]").forEach(function (image) { image.src = image.dataset.src; });
		});
		images.forEach(function (image) { image.loading = "eager"; });
		// A screenshot that fails to load counts as arrived, so that a missing one never locks the demo.
		var pending = images.filter(function (image) { return !image.complete; });
		if (pending.length === 0) start();
		pending.forEach(function (image) {
			function arrived() {
				pending.splice(pending.indexOf(image), 1);
				if (pending.length === 0) start();
			}
			image.addEventListener("load", arrived, { once: true });
			image.addEventListener("error", arrived, { once: true });
		});
	}, { threshold: 0.25 }).observe(slides);
})();

// A screenshot that is not there yet keeps its place, striped and named after the file it waits for, so the page can
// be laid out before the screenshots are taken.
function watchScreenshot(img) {
	var screen = img.closest(".screen");
	function missing() {
		screen.classList.add("missing");
		screen.dataset.file = (img.currentSrc || img.src).split("?")[0].split("/").pop();
	}
	img.addEventListener("error", missing);
	img.addEventListener("load", function () { screen.classList.remove("missing"); });
	if (img.complete && img.getAttribute("src") && img.naturalWidth === 0) missing();
}
document.querySelectorAll(".screen img").forEach(watchScreenshot);
