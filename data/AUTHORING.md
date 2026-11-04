# Author a Word Chaser investigation

A new word is a **JSON case file** plus a path in `catalog.json`. No per-word JavaScript, callback, or renderer extension is needed.

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
