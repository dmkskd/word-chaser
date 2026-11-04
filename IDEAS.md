# Word Chaser — ideas notebook

A place to collect possibilities, questions, and examples. An idea can be exciting before its history is verified. Keep hypotheses separate from facts used in the game.

## The heart of the game

- Audience: an eight-year-old exploring English with a grown-up.
- A funny investigation, inspired by the feeling of Detective Conan and The Inbestigators. Original characters and artwork.
- A magnifying glass, evidence board, case files, and a satisfying “Case solved!” moment.
- Discover meanings, sounds, roots, changes in spelling, and journeys through languages and centuries.
- Strong interest in Latin and Italian; include French, Germanic languages, and Viking / Norse connections.
- Place names are evidence too: Grimsby, Manchester, and other names that preserve traces of settlement.
- Let discoveries connect: a solved case should supply a clue for a later one.

## The sugar investigation — suggested by Filippo

**Starting observation:** Italian *zucchero*, French *sucre*, English *sugar* sound related. Could we follow a word through two or more hops?

**What is supported:** these words are historically related, and English borrowed its word through French. The wider trail reaches Arabic and further east. Sound resemblance is a great starting question, but is not enough by itself to establish a borrowing route.

**What still needs care:** sources differ on the intermediate European route. Do not present modern Italian → modern French → modern English as an established exact chain without explaining the historical forms and source choice.

- [Online Etymology Dictionary: sugar](https://www.etymonline.com/word/sugar) gives Old French → English, with Medieval Latin, Arabic, Persian, and Sanskrit earlier in the account; it also discusses Italian *zucchero*.
- [CNRTL: sucre](https://www.cnrtl.fr/etymologie/sucre) is a useful French reference to investigate for an Italian intermediary. Not yet checked for the prototype.
- [Oxford entry reproduced in a Stanford teaching handout](https://web.stanford.edu/class/think53/sugar17.pdf) gives another account and marks uncertainty about parts of the deeper route.

**Possible game:** “The sweet trail.” Listen to the three words; spot shared sounds; inspect historical word cards; connect a supported path. Reveal earlier stops as a surprise. Distinguish “borrowed from” arrows from “related through a shared ancestor” branches.

**Status:** researched starting point; not yet a playable case. Resolve the route and select historical forms before turning it into a scored question.

## Future mechanics

- A word passport: stamp each historical language stop, with a place and a broad period.
- Route building: arrange word cards in order by tapping, with optional dragging.
- A sound lab: hear words in their languages and notice changes; avoid treating modern pronunciation as a recording of medieval speech.
- A growing web: show direct borrowing and shared ancestry with different connections.
- “What do you notice?” before multiple choice, with room for a grown-up conversation.
- Funny false theories from Pip the owl. Revise them using evidence, with no lost lives or timer.
- Use a clue from a solved case in the next investigation.
- A local in-game ideas pad with export, if useful later. For now this Markdown file is the shared notebook.

## More case candidates

- **Manchester:** distinguish Roman / Latin elements and later forms. Research before using; avoid implying a place-name dates every part of the settlement.
- **Umbrella / ombra / shadow:** a Latin–Italian trail, pending verification of exact forms.
- **Sugar / zucchero / sucre:** the sound investigation above.
- **Treasure / trésor / tesoro / thesaurus:** a clear opportunity to show branching relatives, not just one straight chain. The prototype includes a simplified Latin → Old French → English route, explicitly labelled as selected stages.

## Questions to explore while playing

- Is the child more excited by a map, a funny character, or the word puzzle itself?
- How much reading feels comfortable before we need read-aloud clues?
- Should the first cases have two clues rather than three?
- Could the child tell someone the word’s story after solving it?

## Europe atlas direction — next prototype

- Make Europe the primary play surface.
- Start at the English word and **trace backwards**, one historical stop at a time.
- Move a real magnifying glass over the map to uncover local words and hints. Support mouse movement, touch dragging, keyboard arrows, and place buttons.
- Trying Germany can uncover a different word and a clue to look elsewhere. A different word alone is not proof; use researched case history for feedback.
- A similar word can uncover a related branch. Treasure / Italian tesoro is an example. Use different trail styles for borrowing and related-word connections.
- Allow several exploratory leads while keeping their historical relationships accurate. Multiple leads are not automatically multiple borrowing routes into English.
- Prototype: `index.html` now opens this map; the earlier case-file version is preserved in `case-files.html`.
- Next possibilities: branching root investigations, a time slider, spoken local words, and sugar once the European transmission is researched more closely.

## Time-lens experiment

- Illustrated time chapters below the map: Today (skyline), Medieval times (castle), Roman times (classical building).
- Piano adds a 1700s chapter marked with a violin. No modern printer icon.
- Choosing a time changes the clues available under the lens. Right place + wrong era gives a time hint rather than advancing.
- Each confirmed word leaves a stamp in its time chapter.
- Broad date bands are approximate; avoid false precision or pretending an earliest written record is the word’s birthday.
- Historical region labels change; present-day borders stay as a reference. A full historical map would be a separate enhancement.

## Closer-look interaction

- Click the glass to zoom into a place and read extra context; stop moving the lens while the detail is open.
- Back to Europe / Escape returns to exploration.
- Magnify discovered word markers and trails too, so the glass never erases them with a fresh background.
- Put the transient word label above the glass.
- Next stop automatically chooses the next era, reducing the number of separate actions required to advance.

## Keep progression on the map

- Every advance action belongs beside the stop the child is investigating.
- Clicking the glass over a confirmed clue follows it directly. A nearby Look closer button opens historical context.
- Anchor the action menu to the discovered place, not the moving cursor.
- Next time, next stop, related branch, and next word are all usable from map controls.
- The side panel is a notebook for reading, not a required control surface.

## Local language change before crossing a border

- Requested by Filippo: two stops in England before France, so the child sees that languages change locally as well as borrow from elsewhere.
- Example for the treasure prototype: present-day English treasure ← Middle English tresour ← Old French tresor ← Latin thesaurus.
- Shakespeare’s time is another possible time stop. Research each word’s actual written forms and pronunciation evidence before including it; do not invent an Elizabethan spelling or voice.
- Repeated location pins need distinct time stamps and readable labels. A trail can loop in place before crossing the Channel.

## Progressive zoom / clear play surface

- Remove the floating menu that covers the map.
- Click the glass for the next time step or click a discovered clue to follow it.
- Zoom gradually using wheel/trackpad, pinch, or keyboard +/−. Keep exploration active at every scale.

## Greek roots and dinosaur names

- Added two map cases: Dinosaur and School.
- Dinosaur uses modern scientific Latin Dinosauria (Owen’s report published in 1842), then ancient Greek deinos + sauros. Do not put Dinosauria in Roman times or imply ancient Greeks named the group.
- School follows English school ← Old English scol ← Latin schola ← Greek skholē. This supports the requested Greek → Latin → English story.
- Dinosaur examples requested by Filippo: Triceratops, Stegosaurus, Diplodocus, T. rex. All four are available as optional name puzzles.
- Triceratops: three-horned face; Stegosaurus: roof lizard; Diplodocus: double beam (tail bones); Tyrannosaurus rex: Greek tyrant/lizard ingredients plus Latin rex (king).
- Sources: Natural History Museum dinosaur directory and naming history, plus Online Etymology Dictionary for school and scientific Latin forms.
- Game name changed to Word Chaser; folder name stays unchanged.

## Pronunciation / spoken words

- Added manual speaker buttons to starting words, discoveries, notebook entries and dinosaur names.
- P speaks the word under the magnifying glass; Slowly gives more time to listen.
- Match installed language voices where available, and label historical readings as approximations.
- Future improvement: reviewed recordings or carefully sourced reconstructed pronunciation, especially for Middle English, Latin, Old Norse and Ancient Greek. A modern TTS voice should never stand in for evidence of how people actually sounded centuries ago.

## Similar words are useful evidence

- Schule should be explorable: English school and German Schule share a Latin source, schola, with the German line passing through older German forms.
- Added a collectable German branch and a dashed map connection that joins Latin schola once that source is found.
- In medieval views use the documented Old High German form scuola; in other earlier views explicitly label modern Schule as a comparison.
- Show short search feedback beside the magnifying glass. Keep it non-interactive so it cannot block mouse or touch exploration. The notebook keeps the longer explanation.
- Source: https://www.duden.de/rechtschreibung/Schule

## Funny words

- Added Fart at Filippo’s request: a funny, age-appropriate case grounded in etymology.
- Follow the action word fart ← Old English feortan. Keep the noun’s later record separate from the verb’s history.
- Old Norse freta is a collectable cousin branch, not an asserted source of the English word.
- Pip suspects a dragon and asks to collect evidence upwind.
- Source: https://www.etymonline.com/word/fart

## Data-driven graph rebuild — 4 November

- Use JSON as the authoring format. JavaScript interprets case data; it contains no word-specific investigation handlers.
- Cytoscape.js manages relationships and traversal in memory. There is no graph database.
- The six existing cases are migrated to `data/cases/`, registered in `data/catalog.json`.
- Nodes represent word forms with a language, era, place, pronunciation and evidence object. Edges have explicit meanings: ancestry, related branch, or comparison.
- Treasure offers an English manuscript, French book, Italian letter and German vocabulary card. The Italian/French investigations converge on Latin; the German comparison remains distinct.
- Case goals are data. Reaching Latin by an Italian relative does not remove the requirement to inspect the French borrowing evidence.
- Clicking visible objects inspects evidence; choosing its connection changes progress. Camera zoom never changes progress.
- Help is requested explicitly and disappears after four seconds.
- JSON Schema and graph checks catch missing fields, dangling links, missing sources and unreachable goals. A synthetic 500-case catalog is covered in tests.
- Authoring guide: `data/AUTHORING.md`. Previous atlas preserved at `prototype/atlas-v1/index.html`.

## A playable decision loop — 4 November

- The child peeks at a word with the moving glass, then taps for a theory question. Touch dragging also peeks; lifting a drag does not open an unwanted card.
- One Yes/No answer is enough. A correct choice records the clue, awards points and returns to the map; no second Continue button.
- German Schatz is a testable comparison: Yes can be a mistaken theory; No can correctly rule out that direct source.
- Correct unaided theories earn 3 points; helped/retried ones earn 1. A wrong theory deducts up to 1 existing point. Show the current potential reward.
- Every current case starts with at least three candidate objects. Hide lines until relationships are tested.
- Reveal short authored clues one at a time. Save longer explanations for the notebook.
- French and Italian are presented as equal investigative leads, while their relationship metadata remains precise.
- Softer translucent evidence notes replace the large opaque boxes.
- Points, tested clues, a progress bar and milestones make progress visible.

## Trails beyond the familiar routes

Implemented as JSON cases: Thursday (English/Norse thunder-god naming and a
translated Roman idea), January (English → Old North French → Latin, with an
Italian cousin), robot (Czech → English, plus English → German), algebra
(English ← medieval Latin translations ← Arabic, with a Baghdad source).

For a North African coastal destination, **tangerine → Tangier, Morocco** is a
strong candidate: the fruit's English name refers to its shipping port, rather
than proving that the fruit itself originated there. Source:
https://ahdictionary.com/word/search.html?q=tangerines

For Russia, **sputnik → спутник**, literally “fellow traveller”, could connect a
satellite object with an everyday meaning. Source:
https://www.oxfordlearnersdictionaries.com/definition/english/sputnik

These last two are ideas, not yet playable cases. Arabic is used across many
countries: locate each piece of evidence where its documented history belongs,
rather than giving all Arabic words one country pin.
