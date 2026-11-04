# Author a Junior Word Chaser investigation

A new word is a **JSON case file** plus a path and collection membership in `catalog.json`. No per-word JavaScript, callback, or renderer extension is needed.

Use `cases/fart.json` for a small example or `cases/treasure.json` for a graph with three leads and a converging root.

## 1. Describe the word forms

Each node represents a **specific word form in a language and era**, not a country or an entire word family. England can contain more than one node when the word changes locally.

```json
{
  "id": "example-old-form",
  "form": "an older spelling",
  "languageId": "middle-english",
  "eraId": "medieval",
  "placeId": "england",
  "offset": [-12, -70],
  "period": "A sourced period description",
  "meaning": "A child-friendly meaning",
  "pronunciation": {
    "text": "the text to speak",
    "languageId": "middle-english"
  },
  "evidence": {
    "kind": "manuscript",
    "title": "An English manuscript",
    "text": "What the child finds, and what the sourced evidence supports.",
    "notice": "A question encouraging the child to compare the evidence.",
    "sourceIds": ["dictionary"],
    "illustrative": true,
    "pages": [
      {"title": "A small clue", "text": "One short observation to help the child compare."},
      {"title": "A little more evidence", "text": "Another small piece of the history."}
    ]
  }
}
```

IDs are stable lowercase identifiers with hyphens. They must be unique within a case, including across nodes and edges. Language, era, place, and artifact IDs refer to the shared catalog. Add a new catalog definition when needed; the interpreter does not need to know its name.

Map positions use a shared place anchor in the 900×650 Europe coordinate system. `offset` separates objects sharing a place. It is a display offset, not a historical claim about an exact city. Keep objects separate and within the map.

The evidence kind selects an icon and label from catalog data. Text is rendered as text, never evaluated as HTML or JavaScript. Mark teaching reconstructions `illustrative: true`; real transcriptions require appropriate sources and provenance.

Pronunciation has its own language reference. The language catalog defines the voice tag, whether the reading is approximate, and any explicitly labelled fallback. Greek word parts can have Greek-script speech text while retaining a transliteration for display. Never assume that a modern voice reconstructs historical speech.

## 2. Connect the evidence

Edges point **in the direction the detective investigates**: usually from a later form towards an earlier source.

```json
{
  "id": "example-borrowing",
  "source": "example-later-form",
  "target": "example-old-form",
  "type": "borrowing",
  "challenge": {
    "prompt": "Could this earlier word help explain our English word?",
    "choices": [
      {"id": "yes", "label": "Yes, I think so", "correct": true, "feedback": "The historical evidence supports this connection."},
      {"id": "no", "label": "No, another trail", "correct": false, "feedback": "Compare the meaning and the historical clue again."}
    ]
  },
  "evidence": {
    "title": "A borrowing clue",
    "text": "Why the evidence supports this relationship.",
    "sourceIds": ["dictionary"]
  }
}
```

Available types are defined by `catalog.relations`. Their category controls general interpretation and action labels:

| Type | Meaning |
| --- | --- |
| `spelling` | Earlier local form/spelling |
| `borrowing` | Borrowing from another language |
| `inheritance` | Development from an earlier form, with omitted intermediates explained |
| `formation` | A name built from earlier word parts |
| `related` | A family connection, without asserting direct borrowing |
| `comparison` | A useful meaning comparison, with a different or unestablished ancestry |

An edge is **evidence**, not a guess inferred from spelling. Similarity alone is insufficient. Say when a connection is a comparison, a shared ancestor, or an actual borrowing. Explain selected or omitted intermediate forms.

Outgoing edges become leads when the child reaches their source. A comparison can be a leaf. Previously visited nodes remain available, so a child can return from a comparison and inspect another lead. Multiple outgoing paths can converge on one root node. Cycles are allowed for genuine investigative relationships; do not add fake ancestry to create a game route.

## 3. Define the case

At the top level supply:

- `schemaVersion: 1`, a unique case `id`, `title`, `icon`, `summary`, `question`, `partner` and `completion` text.
- `startNodeId`, identifying the initial known word.
- `goalNodeIds`: **all** these nodes must be reached for completion. Their order is flexible.
- `nodes`, `edges`, and `sources` as shown in the example cases.
- `milestones`: an ordered list of `{ "nodeId": "...", "label": "..." }` objects defining the notebook progress trail, including the starting node.
- `puzzles`: optional additional word-part puzzles, or an empty array.

Every source needs an ID, title, and HTTPS URL. Every evidence object and relationship cites source IDs from its own case. Source references are checked mechanically; authors must still verify that each source supports its claim.

Treasure's goals include both Old French `tresor` and Latin `thesaurus`. Finding Latin through Italian `tesoro` is useful, but the English-through-French evidence still needs to be established. Goal selection makes the teaching objective explicit in data.

## 4. Register and check it

Add the case's path to the `cases` array in `catalog.json`, for example `"cases/new-word.json"`. Then run:

```sh
npm run validate
npm test
```

The build reads all registered JSON files and packages the validated content for the direct-file HTML game. The game catalog, time controls, object markers, relationships, sources, pronunciation controls and goal logic are generated from that data.

For a quick manual review, open `../index.html`, select the word, and try every lead. Check dates, label collisions, spoken language, returning from a comparison, and completion through more than one valid investigation order.

## Library and scale

Cytoscape.js represents each case as an in-memory directed graph. Only opened cases have active sessions; the catalog can contain hundreds of JSON entries. The current prototype bundles all registered case data so `file://` use remains possible. A later server could load the same JSON files on demand without changing their content format.

## Make it an investigation

Give each decision several plausible leads. Unconfirmed connection lines are hidden, so the graph should not point to the correct answer before the player investigates. A different word in a modern language does not automatically rule out a more distant shared ancestor; formulate the question around the actual claim your evidence can test.

Each edge has `challenge.prompt` and 2–4 choices, with exactly one marked `correct`. Comparison edges often require a No answer, but the author defines the actual question and truth value. French and Italian leads can use the same interaction while the underlying relationship types remain historically distinct.

Each evidence object has `pages`: 1–5 short optional clue reveals, each with a title and up to 260 characters. The initial `meaning` should be one short, child-friendly line. Keep the full explanation in `evidence.text`; it is available for later reading. Avoid repeating the whole answer in the first small clue.

Correct answers record the clue automatically in one action; there is no additional confirmation. A comparison is recorded while the current stop remains the source, leaving the other leads available. Reaching a historical or related node changes the current stop. The generic engine awards points according to catalog data, tracks help/mistakes, and prevents repeat scoring.

`catalog.rules` declares `correctPoints`, `assistedPoints`, and `wrongPenalty`. `milestones` defines visual case progress independently of optional comparisons. The case still completes only when its `goalNodeIds` have been found.

New example trails include `thursday.json` (a translated naming idea),
`january.json` (English spelling change, French, Latin and an Italian cousin),
`robot.json` (a Czech invention plus an outward English-to-German borrowing),
and `algebra.json` (medieval Latin translations and an Arabic source in Baghdad).
The `translation` relation follows an idea rather than borrowed sounds. The
`export` relation explicitly follows a word outwards from English; its challenge
must ask about that direction. A map stop represents the particular evidence,
not every speaker of its language: Arabic does not mean a single country.

Optional display data: `node.mapCaption` adds a short caption to a discovered
pin; `node.mapTitle` labels a candidate artifact without exposing its word;
`node.mapLabelSide` can be `left` or `right` to keep neighbouring labels apart.
An optional `edge.timeLabel`, such as `1100s → around 820`, adds a clock label to
a confirmed trail. Author the dates from the evidence; do not substitute a
language's entire era for the date of a particular book or borrowing.

The UI saves only the active case. Reloading resumes it; selecting another
word replaces that saved attempt and starts the selected word fresh.

Each current case has two distinct false trails, with at least one No decision
available immediately. Mix real words with misleading sounds (robot/rabot),
matching spellings (English art/German Art), and matching meanings with different
histories (house/casa/maison). Never invent words or call a genuine cousin
unrelated just to make a wrong option. Ask a precise question about a borrowing
or source, and put the historical explanation in help and feedback rather than
announcing the verdict in the initial card.

## Play modes

`catalog.modes` defines marker detail, peeks, hints and restart-on-wrong rules.
These apply to every case without word-specific logic. Investigator hides
optional help until completion and resets the current attempt after an incorrect
choice. Author precise questions that remain answerable without optional clue
pages; the word form and challenge are still visible when a marker is tapped.

Investigator's automatic location nudges use `catalog.places[*].searchHint`.
Write a short, child-friendly geographical riddle without revealing the word
or whether a theory is correct. Mode `searchHintSeconds` sets the search delay
in seconds (currently 60 for Investigator, 0 to disable in Word Chaser).


## Place-name cases and close geography

Grimsby and Manchester are working examples. Use the same case graph, scoring,
Yes/No decisions and difficulty modes as any other word.

A node may have `segments`, for example
`[{"text":"Man"},{"text":"chester","id":"ending"}]`. Their text must
concatenate exactly to `form`; IDs must be unique within the node. Set
`sourceSegmentId: "ending"` on an edge to investigate that part of its source.
The question context highlights it. A `formation` link explains a component;
completion text must not claim the whole name is explained if other parts remain.

New catalog places may use `coordinates: [longitude, latitude]` instead of
legacy `x`/`y`. Shared projection is in `src/geography.js`. Use accurate town
centres. Set `offset: [0, 0]` for new geographic cases; optional `displayOffset`
separates cards in screen pixels and draws leaders back to their real anchor.
Several historical forms at one town should share its place, not be placed in
other counties. Label vocabulary examples and broad language-region anchors
honestly; they are not exact word birthplaces.

Optional `camera: {"center": [-1.5, 53.4], "width": 170}` opens a local view.
The centre is longitude/latitude and width is in the shared projected map units
(35–900). Town view returns there; Whole Europe resets the camera only. The map
may expand after a distant connection is earned, never to reveal a hidden
Investigator target. UK/Ireland detailed outlines and close-zoom labels are
bundled in `uk-map.json`; there are no runtime map downloads.

A `related` connection is not automatically a shared ending. The first cases
avoid requiring multiple independent answers to one shared target: the engine
currently chooses one incoming challenge per target. See `../PLACE-NAME-DESIGN.md`
before authoring a case that requires testing several towns against one root.


## Grouped word browser

`catalog.collections` is an ordered array of `{id, title, description, caseIds}`.
Add every registered case to exactly one collection. Order within `caseIds`
controls browsing order (keep weekdays Monday–Sunday). Validation rejects missing,
unknown or multiply grouped case IDs and duplicate collection IDs. No rendering
code needs to know a category or word by name.

Search opens suggestions at two characters. It prefers title prefixes, then
substrings, and uses collection titles, summaries and languages when no title
matches. Browse all exposes the complete grouped library. Merely searching or
browsing never resets the investigation; selecting a word does.
