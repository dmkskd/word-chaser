# Word Chaser

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

All 15 current cases are JSON. The interpreter contains no word-name conditions, word-specific click handlers, or hand-written exceptions for branches.

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

**Add a word by adding JSON and registering its file in the manifest. No JavaScript change is required.** See [the content guide](data/AUTHORING.md) and [the complete treasure example](data/cases/treasure.json).

The source of truth is JSON. `npm run build` validates it and bundles the data with the interpreter into `assets/app.js` using esbuild. Bundling keeps direct-file/offline opening usable; edit the JSON source, not the generated bundle.

## Graph library

[Cytoscape.js](https://js.cytoscape.org/) manages each case's graph, connections and traversal in memory. There is no database. The SVG map is a geographic view of this graph: object coordinates are authored as place anchors plus offsets. Only the active case needs a graph session; a searchable catalog supports many cases.

Relationships have separate meanings:

- **Ancestry:** an earlier spelling, borrowing, inheritance, or a scientific name built from roots.
- **Related branch:** a word with a family connection, without asserting direct borrowing between the two forms.
- **Comparison:** a useful same-meaning lead that does not establish ancestry.

A case can have multiple branches, converging paths, and comparison leaves. Every case currently opens with at least three candidates. Unconfirmed lines are hidden; confirmed connections appear only after a theory is tested. Every connection keeps the same endpoints throughout play. Goals are declared in data: treasure requires the French evidence as well as the Latin source, even if the player reaches Latin through the Italian relative first.

## Play

1. Move the glass (or drag it with a finger) over an object to peek at its word. Moving away dismisses the peek.
2. Tap an object to open a short meaning and a Yes/No theory. Ask for optional clue pages if needed.
3. One correct answer records the clue, awards points and returns to the map. There is no second Continue click. A false lead can be ruled out and kept without abandoning the other leads.
4. Longer explanations remain in the notebook. Clicking outside a question closes it.

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
