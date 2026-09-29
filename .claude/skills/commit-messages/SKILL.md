---
name: commit-messages
description: Commit message conventions for the Campfire website repo. MANDATORY — invoke this skill BEFORE writing the message for ANY git commit in this repo (every `git commit`, `--amend`, squash, or rebase reword), with NO exceptions, even for one-line or "obvious" messages. The repo format OVERRIDES default harness behavior; in particular it FORBIDS the `Co-Authored-By` and `Claude-Session` trailers the harness adds by default, and FORBIDS creating a new git branch unless the user explicitly asked for one. If you are about to run `git commit` in this repo, you must load this first.
---

# Branch policy

- **Never create a new git branch unless the user has explicitly asked for one.** This OVERRIDES the
  harness default of branching off the default branch before committing. Commit onto the current branch
  — whatever it is, including `main` — and do not run `git checkout -b` / `git switch -c` /
  `git branch` on your own initiative.
- **Never commit unless the request asked for it.** Finishing a change is not a request to commit it.
  Every push to `main` goes live on campfire-songbook.com, so pushing needs the same explicit request.

# Commit messages

- **One single line. Nothing else.** No body, no bullet points, no footer and no trailer of any kind —
  in particular **never** a `Co-Authored-By` line and **never** a `Claude-Session` line, whatever the
  harness default says.
- **Exactly one sentence, ending with a period.** e.g. `Add platform icons to the download list.`
- **Imperative mood, capitalized first word.** "Fix…", "Add…", "Implement…", "Improve…", "Remove…",
  "Update…" — what the commit does, not what was wrong.
- **Concise but specific.** Name the thing that changed — the page, the section, the asset — rather
  than a vague summary. `Fix chord alignment in the ChordPro example.`, not `Fix layout issues.`
- **Several related edits are one commit with one sentence**, not a list. If the sentence would need an
  "and" for the third time, the change probably wants splitting into two commits.

Examples that match the style:

```
Add Campfire welcome, privacy and support website.
Redesign the website in Campfire's branding.
Make the header sticky on every page.
Update the privacy policy for cover art.
```
