# Places, books and word history — design and implementation

5 November 2026. First slice implemented: chortle, shared book cards and evidence timeline. The original proposal below supplies design context; current schema-valid content is in data/cases/chortle.json.

The user's UK brief is to trace familiar English words back through evidence.
An investigation can move geographically, historically, or both. Regional
vocabulary alone is not the brief. Literary evidence may reveal a borrowing,
an early use, a meaning change or a documented coinage.

## First example: chortle

Collins attributes the coinage to Lewis Carroll in Through the Looking-Glass.
The book was published in December 1871, although its first edition is dated
1872. Carroll's association with Christ Church supplies an Oxford map link;
it is not proof that a particular passage was written there. The probable
chuckle/snort blend must retain its uncertainty rather than become a mandatory
Yes answer phrased as an established fact.

Research:
- https://www.collinsdictionary.com/dictionary/english/chortle
- https://lewiscarrollsociety.org.uk/publishing-of-alice/
- https://www.chch.ox.ac.uk/college/library-archives/lewis-carroll-collection

Player flow:
1. Start with chortle and its modern meaning: a happy, chuckling laugh.
2. Explore a book clue associated with Oxford, alongside sourced false trails.
3. Open a short readable passage from Jabberwocky, with chortled highlighted,
   author/work details and a publication date. Provide a text view even if a
   scan is included. Do not require children to read an entire page.
4. Test whether that passage supplies earlier evidence for today's word.
   A correct answer records the 1871 example in the notebook and timeline.
5. The earned explanation attributes the coinage to Carroll, on independent
   dictionary evidence. The passage alone proves use, not invention.
6. Optionally explore the proposed chuckle/snort construction, labelled
   probable, or continue to earlier roots where the evidence actually allows.

## Minimal changes to the current graph

Keep current word-form nodes. Add an optional node kind `attestation` for a
particular occurrence of a form in a dated text. Preserve the existing form,
language, period, pronunciation and evidence fields so old cases still work.
Attestations can be visited/tested clues and declared goals, using existing
scoring, modes, clue reveals, notebook and persistence.

Add `attested-in` as a relationship distinct from ancestry and namesake.
It means a word is evidenced by a text, not that it was borrowed from a book.
Do not add a coinage relationship unless a source supports that stronger claim.

Optional structured text-evidence metadata, authored as JSON:

```json
{
  "kind": "book",
  "workTitle": "Through the Looking-Glass",
  "creator": "Lewis Carroll",
  "publicationYear": 1871,
  "editionDate": "1872",
  "section": "Jabberwocky",
  "excerpt": "He chortled in his joy.",
  "focusText": "chortled",
  "locationRole": "author-associated",
  "claim": "attested-use",
  "sourceIds": ["primary-text"]
}
```

This is a metadata sketch; the actual fields live under node.evidence.textSource, alongside node.kind and node.date. A separate source
supports a `coinage` claim; do not infer it from publicationYear or the excerpt.
Other claim values can cover early known use, regional evidence or meaning
change. Record uncertainty and historical coverage explicitly. A work's first
publication and the date printed on a particular edition need not coincide.

## One case, two coordinated views

Map: where the particular evidence or a documented association belongs.
Timeline: when that evidence dates from. Selecting a stop in either view
opens the same card; the child does not solve the same decision twice.

A text need not have a precise map point. Distinguish publication location,
author association, documented use region and fictional setting. Never infer a
word's birthplace from its author's birthplace or place a book at a fictional
setting as if that established geographic origin.

Add a usable timeline of dated evidence, not just the current broad era filter.
Use ranges/unknown dates where necessary. Only available evidence appears;
Investigator must not expose hidden dates or locations through the other view.
Geographic and date uncertainty must survive into the child's explanation.

## First implementation slice

1. Extend schemas and validation for optional attestation kind, book metadata,
   dates, claims and location roles; preserve all existing case data.
2. Add the generic book card and attested-in relationship presentation.
3. Add one shared selection/action path for map and timeline; no duplicate
   rewards. Retain the existing difficulty rules and current-case-only saving.
4. Author chortle with a primary-text citation and independently sourced
   coinage attribution. Add two real, precisely questioned false trails.
5. Test chronology, restoration, one-tap progression, map/timeline selection,
   hidden clues in Investigator and small-screen reading.

After this, a Shakespeare or Chaucer example can use the same machinery.
First attested use is not automatically coinage, influence or popularity.


## Implemented length rule

The first one-hop chortle case was too short. It now requires three links:
modern word → the poem → probable chuckle ingredient → Middle English chukken.
Snort is another probable ingredient on a parallel optional branch. The
probability belongs in the question and relationship label, not just a footnote.
New cases must require three earned connections; optional/rejected leads cannot
inflate that minimum. The 24 legacy exceptions are an explicit expansion backlog.
The book/timeline slice still requires place anchors, and final phone layout
needs real device review; neither fully mapless text evidence nor all legacy
case expansions are complete.
