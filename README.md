# Junior Word Chaser

An HTML word investigation game for a young detective. Move a magnifying glass across Europe, inspect dated books and letters, and follow evidence through languages and time.

**Continuing development? Read [the current status and handover](STATUS.md) first.** It records gameplay decisions, publishing setup and open work. See [the ideas notebook](IDEAS.md) for possibilities still under discussion.

## Open and develop

Open **`index.html`** directly in Chrome. The built game includes its library and content, so no server or account is required. Optional fonts and some device speech voices may need a connection.

```sh
npm install
npm run build
npm test
```

For an HTTP preview, run `npm start` and open http://localhost:8000. `npm test` builds the current JSON before running its checks.

## Content is data

All 36 current cases are JSON. The interpreter contains no word-name conditions, word-specific click handlers, or hand-written exceptions for branches.

| File | Purpose |
| --- | --- |
| `data/catalog.json` | Case manifest, languages/voices, eras, map anchors, artifact types, relationship definitions |
| `data/cases/*.json` | Individual word graphs: forms, evidence, sources, relationships, goals and optional name puzzles |
| `data/case.schema.json` | Machine-checked format for a word case |
| `data/catalog.schema.json` | Machine-checked format for shared catalog data |
| `src/investigation.js` | Generic graph traversal, evidence review, branching progress and save restoration |
| `src/map-view.js` | Geographic rendering, object interaction, lens, zoom and keyboard/touch controls |
| `src/speech.js` | Consistent language voices, loading and explicitly configured approximations |
| `src/main.js` | Shared interface interpreting the case and catalog data |

**Add a word by adding JSON, registering its file and assigning a catalog collection. No JavaScript change is required.** See [the content guide](data/AUTHORING.md) and [the complete treasure example](data/cases/treasure.json).

The source of truth is JSON. `npm run build` validates it and bundles the data with the interpreter into `assets/app.js` using esbuild. Bundling keeps direct-file/offline opening usable; edit the JSON source, not the generated bundle.

## Graph library

[Cytoscape.js](https://js.cytoscape.org/) manages each case's graph, connections and traversal in memory. There is no database. The SVG map is a geographic view of this graph: object coordinates are authored as place anchors plus offsets. Only the active case needs a graph session; a searchable catalog supports many cases.

Relationships have separate meanings:

- **Ancestry:** an earlier spelling, borrowing, inheritance, or a scientific name built from roots.
- **Related branch:** a word with a family connection, without asserting direct borrowing between the two forms.
- **Comparison:** a useful same-meaning lead that does not establish ancestry.

A case can have multiple branches, converging paths, and comparison leaves. Every case currently opens with at least three candidates. Unconfirmed lines are hidden; confirmed connections appear only after a theory is tested. Every connection keeps the same endpoints throughout play. Goals are declared in data: treasure requires the French evidence as well as the Latin source, even if the player reaches Latin through the Italian relative first.

## Play

Type two letters in **Find a word…** to see matching words immediately, then tap a result. **Browse all** shows the complete collection grouped into weekdays, town/city names, familiar words with local roots, time/calendar, colours, food/meals, learning/inventions and everyday discoveries. Opening or searching the browser keeps your current progress; choosing a word starts its case fresh.

Choose **Word Chaser** for guided play or **Investigator** to search for hidden words with the glass, with a location riddle after 30 seconds and a full case restart after any wrong answer. Changing modes starts a fresh attempt. Investigator keeps the starting word visible, reveals other words as you hover or drag the glass over them, and unlocks notebook stories after completion.

Share a level directly with `?mode=chaser` (or `?mode=word-chaser`) or `?mode=investigator`. A valid URL mode overrides the saved mode; switching modes resets the attempt.

1. Move the glass (or drag it with a finger) over an object to peek at its word. Moving away dismisses the peek.
2. Tap an object to open a short meaning and a Yes/No theory. Ask for optional clue pages if needed.
3. One correct answer records the clue, awards points and returns to the map. There is no second Continue click. A false lead can be ruled out and kept without abandoning the other leads.
4. Longer explanations remain in the notebook. Clicking outside a question closes it.

The catalog also includes herring, red/black/white, meat/lunch/dinner, day/night, and familiar words with local connections: sandwich (Kent via an Earl’s title), mackintosh (Glasgow chemist) and pixie (south-west dialect and folklore, exact origin uncertain).

The catalog includes all seven days of the week, grouped Monday to Sunday. Their trails distinguish older English words from translated Roman naming ideas. Solving a case places a stamp on the map and celebrates with rising rockets, glowing spark trails and optional synthesized firework sounds. The “Firework sounds” checkbox mutes them; reduced-motion support keeps the solved stamp without animation.

Quiet original detective music starts after your first tap. Use **♪ Music** in the header to mute it. It lowers while a word is spoken and pauses when the page is hidden. The score is in `data/detective-music.json` and plays without audio downloads.

Grimsby and Manchester are place-name cases: investigate the highlighted ending, then follow its history across Europe. They open on a close UK map with detailed coastline and town labels. **Town view** returns locally; **Whole Europe** opens the wider map. Pins keep a readable size as you zoom. Two fingers pan; Shift-drag or Shift + arrows also pan.

Camera movement never advances progress. Clicking empty map space smoothly zooms. Arrow keys move the glass, Enter inspects an object, +/− zoom, P speaks the object under the glass, and H gives a brief hint. Hints are explicitly requested and disappear after four seconds.

Only the current case is saved locally when browser storage is available. Reload resumes it; selecting another word starts that word fresh and replaces the saved attempt. Each case can be restarted. Missing or invalid storage does not stop the game.

## Historical accuracy

Evidence objects are **illustrative teaching objects**, not reproductions of specific manuscripts or letters. Each object and relationship references a source in its case data. Era bands and map anchors are broad teaching references, not precise dates or routes of transmission. Modern borders remain a geographic reference.

Scientific Latin in the dinosaur case is a modern naming convention: Dinosauria was published in Owen's 1842 report. It is not placed in Roman times. Historical pronunciations use explicitly labelled modern-voice approximations. The matching speaker remains consistent; unrelated English accents are not substituted for Greek or Italian. Latin's optional Italian-voice approximation is declared in catalog data.

## Validation and checks

`npm run validate` checks JSON schemas, referenced languages/eras/places, duplicate IDs, evidence sources, dangling relationships, and unreachable nodes/goals. Tests cover branching and convergence, independent inspection/progress, stable endpoints, restoring comparisons after backtracking, malformed data, a newly authored case with no engine changes, a 500-case catalog, built-page interactions, temporary hints, search, and language voices.

DOM checks do not replace live visual or audio testing. Browser automation was unavailable during this rebuild; the game was opened locally for review.

## Earlier prototypes

The previous atlas is preserved at `prototype/atlas-v1/index.html`. The original case-file version remains at `case-files.html`. The project folder keeps its original name. Ideas and research notes live in `IDEAS.md`.

## Decisions, reveals and rewards

Questions, answer choices, correct answers, feedback, short reveal pages and progress milestones are authored in the case JSON. Point rules are in `catalog.rules`: 3 points for an unaided correct theory, 1 after extra clues or an earlier mistake, and a 1-point deduction for a mistaken theory when points are available. A clue cannot award points twice. The current potential reward is visible before choosing.

The notebook shows points, tested theories, a progress bar and compact evidence rows with result badges. Scores, guesses, help and discovered comparisons for the current case survive backtracking and reload. The local progress format is `word-chaser-current-v1`; previous cases are discarded when switching words.

Touch interaction is covered by simulated pointer-event tests; actual iPad rendering/audio still needs device review.


Books now form a **Words from books** collection. Chortle follows a readable
poem excerpt and a three-hop word/sound investigation. Map and dated timeline
share decisions and points; discovered books can be read again without scoring.
New cases must require three connected hops. `npm run validate` also lists the
24 older short cases awaiting expansion; those remain playable during migration.
See [authoring rules](data/AUTHORING.md) for the exact length and evidence checks.
