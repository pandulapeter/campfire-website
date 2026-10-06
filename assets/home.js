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
	var key = "Am";
	var offset = 0;
	var notation = "standard";

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

	function escape(text) {
		return text.replace(/&/g, "&amp;").replace(/</g, "&lt;");
	}

	function render() {
		var html = "";
		source.split("\n").forEach(function (line) {
			var section = line.match(/^\{(?:start_of_verse|sov)(?::\s*(.*?))?\}$/);
			if (section) {
				html += '<p class="section-label">' + escape(section[1] || "Verse") + "</p>";
				return;
			}
			if (line.charAt(0) === "{" || line.charAt(0) === "#" || line.trim() === "") return;
			html += '<div class="line">';
			line.split("[").forEach(function (part, index) {
				var chord = "", text = part;
				if (index > 0) {
					var end = part.indexOf("]");
					chord = transposeChord(part.slice(0, end), notation);
					text = part.slice(end + 1);
				}
				if (chord || text) html += '<span class="segment"><b>' + chord + "</b>" + escape(text || " ") + "</span>";
			});
			html += "</div>";
		});
		sheet.innerHTML = html;
		// Keys stay in letters under Nashville numbers and Roman numerals, which mean nothing without one.
		value.textContent = (offset > 0 ? "+" : "") + offset + " · " + transposeChord(key, notation === "nashville" || notation === "roman" ? "standard" : notation);
	}

	sourceElement.innerHTML = escape(source)
		.replace(/\{[^}]*\}/g, '<span class="directive">$&</span>')
		.replace(/\[[^\]]*\]/g, '<span class="chord">$&</span>');
	document.querySelector(".transpose").hidden = false;
	document.querySelector(".notation").hidden = false;
	document.querySelectorAll(".notation button").forEach(function (button, _, buttons) {
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

// A screenshot that is not there yet keeps its place, striped and named after the file it waits for, so the page can
// be laid out before the screenshots are taken.
function watchScreenshot(img) {
	var screen = img.closest(".screen");
	function missing() {
		screen.classList.add("missing");
		screen.dataset.file = (img.currentSrc || img.src).split("/").pop();
	}
	img.addEventListener("error", missing);
	img.addEventListener("load", function () { screen.classList.remove("missing"); });
	if (img.complete && img.getAttribute("src") && img.naturalWidth === 0) missing();
}
document.querySelectorAll(".screen img").forEach(watchScreenshot);
