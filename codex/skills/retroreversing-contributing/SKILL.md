## RetroReversing Contributing (Repo Skill)
Use this skill whenever you create or edit content in the `retroReversing` repo (Markdown pages/posts, `_includes`, or related site content). The goal is to keep changes consistent with `CONTRIBUTING.md`.

### Non-negotiables
* Target audience is technical: assume programming literacy, don't assume reverse-engineering literacy.
* Prefer linking to high-quality sources over duplicating other sites' content; still provide a short summary so the page reads coherently without clicking out.
* Reference sources for technical claims and dates; Wikipedia only as a last resort.

### Workflow (content edits)
1) Decide fit: does this belong on RetroReversing (retro game dev + reverse engineering / digital archaeology; ~1980–2015)?
2) Choose location + frontmatter:
   * Follow the "standard shape" from `CONTRIBUTING.md` (use modern minimal frontmatter; don't clone old pages blindly).
   * `title` must not contain colons.
   * `permalink` must not end with a trailing `/`.
   * `tags`/`recommend` values must be valid and used appropriately (`recommend` can be omitted and will fall back to `tags`).
3) Write like a technical handbook (not a blog post):
   * Short paragraphs, short sentences, encourage hands-on experimentation.
   * Present terminology first, then explain/justify.
   * Sections should be readable non-linearly (don't rely on strict reading order).
4) Apply Markdown/structure rules:
   * Don't bold headings; don't put emojis or backticks in headings.
   * Use `---` before major section jumps, and when jumping back up the heading hierarchy.
   * No blank line between `---` and the next heading.
   * No blank line between a heading and its first paragraph.
   * Lists: never use numbered lists; use `*` bullets; always introduce a list with a sentence ending in `:`, with no blank line before the list.
   * Tables: always introduce with a sentence; keep formatting compact (no padded spacing; don't start rows with `|`).
   * Table of contents: don't write your own; the site generates it at runtime from headings.
5) Character hygiene:
   * Use straight quotes (`"`), not smart quotes (`“`).
   * Use `-` hyphen, not em dashes (`—`).
   * Avoid non-standard keyboard characters.
6) Glossaries (when acronym-heavy):
   * Add a glossary near the top.
   * Add explicit anchors like `<a id="glossary-foo"></a>` so in-page links are stable.
   * Link the first meaningful mention per section, not every occurrence.
7) Links and references:
   * Use footnotes for citations under an H1 `# References` at the end.
   * If a footnote is at sentence end: put it before the period (`text [^1].`).
   * For external "standalone" links (own paragraph/line), use the include:
     * `link-to-other-site.html` with `title`, `url`, `description`.
   * For links to other RetroReversing pages, prefer:
     * `{% include_cached link-to-other-post.html post="/permalink" %}`
8) Code examples:
   * Use TypeScript when it's runnable interactively in-browser; otherwise use Python for local scripts.
   * Use fenced code blocks with a language tag; use `nasm` for assembly highlighting.
   * Mermaid diagrams: use sparingly; keep labels short; bold the first line in nodes when there's a title + explanation.

### Preferred Site Components (use instead of ad-hoc HTML)
* External "standalone" link blocks: `link-to-other-site.html`.
* Internal links to RetroReversing pages: `link-to-other-post.html` via `{% include_cached ... %}`.
* Folder listings / nested trees: `connected-folder-tree.html` rather than raw HTML or bullet dumps.
* Source-file callouts: `source-code-card.html` / `source-code-card-grid.html` when actually showing real file contents/symbols.
  * The `functions`, `variables`, and `lines` fields must be exact numeric counts from the file.
  * Omit the card if you can't provide exact counts yet.
* Tabs: prefer the `rr-tabs` pattern shown in `CONTRIBUTING.md` when comparing variants (e.g., C vs ASM).

### Images
* Prefer linking externally hosted box-art (e.g. MobyGames) for "section about a specific game" figures when appropriate.
* Lazy loading: use `<img class="lazy-load" data-image-full="/images/highres.jpg" ...>` (optionally with a placeholder `src`).
* Lightbox: images with `postImage` are auto-wrapped; for custom galleries, wrap in `<a ... data-lightbox='{"gallery":"name"}'>`.

### Visual readability helpers
* Emoji callout under heading (not in the heading): add `<div class="emoji">...</div>` on the line after the heading.

### Workflow (_includes edits)
* Prefer Liquid comments (`{% comment %}...{% endcomment %}`) over HTML comments to avoid shipping docs into generated pages.

### Spelling
* Use cspell blocks when needed:
  * `<!-- cspell:disable -->` / `<!-- cspell:enable -->`

### Reminder
* `CONTRIBUTING.md` is the source of truth for edge-cases and newer patterns; consult it if unsure.
