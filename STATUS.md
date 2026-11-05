# Junior Word Chaser — handover

Updated 5 November 2026, after the book/timeline slice and the three-hop minimum rule.

## Start here next time

The HTML game is working and has 36 JSON investigations. The user is refining
the gameplay with screenshots, especially difficulty, clues, touch interaction
and compact layout. Preserve those decisions; this is still an evolving
prototype. Read `data/AUTHORING.md` before adding content.

The game is **Junior Word Chaser**. Keep the project folder named `word-investigator`.
The audience is an eight-year-old, often playing with an adult, on desktop or
iPad. The aim is to investigate how English words change locally over time and
travel between languages—not simply follow the only available correct pin.

## Gameplay decisions to preserve

- The compact toolbar uses a search input and a custom **Browse all** button,
  replacing the native long word select. Typing two letters opens tappable
  suggestions as a compact flat list directly below the search input, without
  the library heading, category descriptions or count. Browse all alone uses
  the larger grouped panel. Panels suppress horizontal overflow. Prefer name prefixes, then name
  substrings; fall back to collection/summary/language matches (e.g. Greek).
  One letter or clearing search closes suggestions; Enter picks the first match.
- Browse all clears the query and shows all 36 cases grouped by
  `catalog.collections`: weekdays (Monday–Sunday), town/city names, familiar
  words with local roots, time/calendar, colours, food/meals, learning/inventions
  everyday discoveries and words from books. Each case must appear
  exactly once; schema/reference validation checks collections. Categories
  and membership are JSON data, not JavaScript word-name checks.
- The compact browser has a bounded scrolling panel, 44px word buttons, a
  current-word highlight, Close, Escape, outside-tap dismissal and keyboard
  navigation. Opening, searching or dismissing it preserves the active attempt.
  Choosing a case starts it fresh, closes the panel and clears search. The total
  word count stays beside Browse all; filtered counts are inside suggestions.
  `src/case-picker.js` owns this UI. Actual phone/Safari layout remains unverified.
- The mode buttons retain hover/focus descriptions and 44px targets. Search,
  Browse all and the mode group share a 48px height and matching styling.
- URL `?mode=chaser` (also `word-chaser`) or `?mode=investigator` overrides the
  saved level. A differing URL mode starts a fresh attempt; unknown values are
  ignored. Mode buttons update that URL parameter when browser history permits.
- The Mode selector offers the usual **Word Chaser** and advanced **Investigator**.
  Rules are data in `catalog.modes`, validated by the catalog schema. Changing
  mode resets the active case. The active mode is saved with the current case.
- Investigator shows the starting word and earned stops, always with their
  artifact pictures and decision badges inside/on the circles. Unvisited targets have
  no circles, labels or other location hints. Moving or dragging the glass over
  a hidden location reveals its word and the usual artifact circle with its
  picture and decision badge; moving away hides them again. Dates and language
  hints stay hidden. Tap or
  press Enter to test it. Manual H hints, clue reveals, lead suggestions, time controls
  and pre-solve stories are unavailable. Earned notebook stories unlock on
  completion. Any wrong answer immediately restarts the current case, clears
  points/progress and saves that fresh state. Word Chaser retains retries.

- Investigator gives a playful location nudge after 30 seconds of searching,
  with a clearly visible “Hint in 0:30” badge among the map tools. Location
  hints stay in that badge until the next inspection or reset rather than
  disappearing after 12 seconds. Returning via browser Back/Forward resumes
  the timer (pagehide previously stopped it without a pageshow restart). Configure `searchHintSeconds` per mode
  (0 disables it); riddles live in `catalog.places[*].searchHint`. It points to
  an available connected lead without showing its word or giving the answer.
  The timer pauses in the opening story or a hidden tab, stops on theory cards,
  and resets after each correct answer, dismissal, restart or case/mode switch.
  Completion disables it. Nudges repeat every 30 seconds while still searching and
  do not deduct points or unlock manual clue help.

- The first visit opens a short story: everyone has lost their memories; the
  player traces word histories to help bring them back. The reveal is “From now
  on, you are… THE JUNIOR WORD CHASER!” One button begins play. Dismissal is saved
  separately under `word-chaser-story-v1`; clicking the brand reopens the story
  without resetting the active investigation.
- Moving the magnifying glass over an object reveals its word automatically.
  Moving away dismisses that peek. Touch dragging also peeks.
- Tapping an object opens a short theory card. One Yes/No answer records a
  correct decision, awards points, closes the card and advances as appropriate.
  No additional Continue/Follow click. In Word Chaser, wrong guesses can be revised.
- Choices read “Yes, I think so” and “No, I don’t think so”. The × closes the
  card; no extra Keep exploring button is needed.
- Cards start with evidence, not the verdict. “An older English name for
  January” gave away the Jenever answer; it now says “A word on an old calendar”.
  Reveal explanations through optional clues, feedback and notebook stories.
- Each case has at least two distinct false trails, including an immediately available
  No decision. Mix similar sounds, identical spelling and identical meaning
  with different histories. All words must be real and sourced.
- Distinguish direct ancestry, related cousins, translated ideas and comparisons.
  A similar word such as German Schule is a genuine relative, not a random
  wrong answer. Questions must state the exact connection being tested.
- Unconfirmed lines stay hidden. Other leads remain available after exploring
  a branch; taking French dinosaure must not hide the Greek clue.
- Correct unaided decisions earn 3 points, helped/retried ones 1. Wrong theories
  deduct up to 1 existing point. No repeated point farming. Correct No answers
  receive rewards too. Rules live in the catalog.
- Keep actions near the map/object. Avoid controls that disappear when moving
  the glass toward them. Clicking empty map space zooms smoothly; camera changes
  do not change investigation progress.
- Hints are requested, temporary and near the glass. Optional card clues expand
  below their link; the card is top-anchored so it grows downwards.
- The “Good catch!” reward message lasts 2 seconds; other cues default to 4.

## Current visual and audio decisions

- Phone evidence cards are content-sized bottom sheets capped at 75% of the
  viewport, including narrow landscape screens; do not stretch them between
  top and bottom edges. Yes/No decisions sit in a
  separate non-scrolling footer; clue/story content scrolls above them. New
  cards reset their scroll positions. DOM behavior is covered; actual phone
  viewport/keyboard rendering still needs device review.

- Use short, soft translucent cards rather than dense opaque boxes.
- Map pins retain their artifact picture, with a small overlaid `?`, `✓` or `✕`.
  Correctly rejected words are crossed out. Child-facing copy says “Not our
  trail”, not “Ruled out” or “Decision needed”.
- The current stop has a green highlight. Red looked like a wrong answer.
- Completion places a persistent, tilted “CASE SOLVED” stamp directly on the
  map, with a short stamping animation followed by a 1.5-second wobble (both
  disabled for reduced motion). It does
  not intercept taps or require dismissal. Restart/switching cases removes it;
  restoring a completed current case shows it again.
- Newly solving a case adds three rising rockets and particle bursts for about 5 seconds.
  They do not block taps, are cancelled on restart/switching, and do not replay
  on reload. Reduced-motion users get the stamp without fireworks.
  Canvas sparks slow down, fall under gravity and leave glowing trails.
  Synthesized whooshes, booms and crackles use Web Audio; the “Firework sounds”
  checkbox mutes immediately and saves the preference separately. Unsupported
  audio is disabled gracefully. Real device rendering/audio still needs review.
- Keep pins in the correct country. Robot and robota initially looked like
  separate Czech/Hungarian stops; both now sit within Czechia with captions
  explaining “new name” versus “older word”.
- The notebook has a compact single-row header, small speaker and restart `↻`
  icon with a hover label. Touch targets remain larger than the visible icons.
- Notebook word headings are 16px. Each row has its own result badge; the
  duplicate list of words above the notebook was removed. Keep the score,
  count and progress bar. Full stories remain collapsed. The current entry is
  clearer while others are lighter; do not append “· here”.
- No extra “Word under the glass” audio bar. Speakers sit beside words;
  “Speak slowly” is below the map. P still speaks the word under the glass.
- Original detective music (“After Hours, On the Case”) starts after a user tap.
  The header’s “♪ Music” toggle saves its own preference; music continues across
  word changes, ducks during speech and stops when the page is hidden or left.
  The user wants cool Japanese detective-anime jazz (Case Closed/Conan as a
  mood reference), with an entirely original melody. Earlier waltz and reed-led
  versions were rejected. The current 32-bar, 116 BPM jazz-fusion arrangement
  uses a recurring call-and-response theme, syncopated electric piano, bass
  groove and kick/snare/hi-hats. JSON holds the score, velocities and mix;
  sample synthesis, rolled chord timing, stereo placement and light room reverb
  run offline. Normal gain .42, speech gain .012. Instrument envelopes and
  scheduling are tested; musical quality still needs the user's listening review.
- Voices must match the language and stay consistent. Wait for matching voices
  rather than falling back silently to English. Historical speech is an
  approximation; Latin’s explicit Italian-voice fallback is catalog data.

## Content at this checkpoint

Playable cases: treasure, piano, window, fart, dinosaur, school, all seven
days (Monday through Sunday), January, robot, algebra, geometry, geography,
art, maths, house, Grimsby and Manchester. New cases: herring; red, black, white;
meat, lunch, dinner; day, night; sandwich, mackintosh and pixie. The seven days
remain grouped together in weekday order. All cases have at least two false trails.

Examples of intentional teaching distinctions:

- The regional brief means **nationally familiar words with local histories**,
  not specialist local vocabulary. The user explicitly rejected bal maiden as
  an example: a London user should discover the regional connections of a word
  they recognise. Bal maiden and Devonian were researched but not added.
- Pixie’s early home is south-west English dialect/folklore, including Devon
  and Cornwall. It has a broad regional anchor and visible caption; the exact
  birthplace and deeper origin remain uncertain. Do not turn folklore evidence
  into a proven invention in a specific town.
- Sandwich honours an Earl, whose title connects to Sandwich in Kent. Do not
  say the filled-bread food was invented in the town or treat the card-table
  story as established fact. The Earl clue is in England; the title’s place
  connection is a separate step to Kent.
- Mackintosh follows the Glasgow chemist Charles Macintosh, not the later
  architect or computer. `catalog.relations.namesake` generically means named
  after; it is distinct from ordinary word-part formation. Waterproof-cloth
  patent date 1823 is not the date the coat word was first recorded (1836).
- Herring continues Old English hæring/hering; Dutch haring and German Hering
  are cousins. Danish sild names the same fish but is not the English source.
  The deeper origin is uncertain. Dutch, Danish and Swedish have their own
  voice tags; no unrelated English voice fallback was introduced.
- Red/rouge/rosso are distant cousins, with English Germanic and French/Italian
  Latin branches. They are not a chain of modern borrowings. French rouge
  follows Latin rubeus, Italian rosso Latin russus. Swedish bläck (ink) is a
  black-word relative; French blanc is never asserted to be wholly unrelated
  to black, only rejected as a direct borrowing source. White/weiß are cousins.
- Meat once meant food generally; English lunch is shortened from luncheon,
  whose deeper origin is uncertain (no definite Spanish route). Dinner comes
  from Old French disner and its mealtime shifted; modern French dîner is a
  relative rather than the older source. Meal names vary by community.
- Day/Tag are relatives, but Latin diēs is not English day’s source. Night/Nacht
  and Latin nox share ancestry; knight is a false sound-alike. Uncertain deep
  reconstructions are not authored as definitely attested words.
- Local map labels now include Glasgow, Sandwich, Exeter, Devon, Cornwall and
  Kent. New anchors represent vocabulary regions or particular evidence,
  rather than falsely assigning every word to one city of invention.

- Treasure changes in England before its French and Latin trail. Italian
  tesoro is a cousin, not a fabricated French → Italian borrowing step.
- Dinosauria is a scientific name from 1842, built using Greek parts. It is
  not an ancient Roman dinosaur name.
- All seven weekdays trace older English forms and Roman naming ideas.
  Translation edges represent the naming idea; do not label them all literal
  Latin borrowings. Saturday retains Saturn’s adapted name. Friday uses the
  Frīg/Frigg naming tradition; do not casually substitute Freyja. Sunday’s
  sundae option tests direction in time: the newer dessert cannot supply the
  older weekday, even if its own name may be connected with Sunday.
- January’s Latin clue explains Janus: doors, beginnings and two faces.
- Algebra starts with a child-sized hidden-number puzzle, `□ + 2 = 5`.
  Its Arabic book clue explains finding unknown numbers for practical problems.
  The Spain pin is **a Latin translation of an Arabic book**, not Latin’s
  birthplace. The Arabic source is associated with Baghdad, not North Africa.
- Geometry and geography share Greek earth/land vocabulary but measuring and
  describing are different. The history of the word is not necessarily the
  origin of the entire subject.
- House compares Old English hūs, German Haus and Old Norse hús with Italian
  casa and French maison: same building can have different word histories.
- False sound/spelling leads include robot/rabot and English art/German Art.

## Code and commands

| Location | Role |
| --- | --- |
| `data/catalog.json`, `data/cases/*.json` | Source of truth for content and rules |
| `data/*.schema.json`, `src/validation.js` | Schema and graph validation |
| `src/investigation.js` | Generic Cytoscape graph, decisions, scoring and state |
| `src/map-view.js` | SVG map, lens, zoom, touch and trails |
| `src/main.js`, `src/speech.js` | Shared UI and language voices |
| `src/fireworks.js`, `src/firework-sound.js` | Canvas particles and synchronized offline sound |
| `data/detective-music.json`, `src/detective-music.js` | Original score and quiet background-music player |
| `app.css`, `index.html` | Current layout and page |
| `scripts/build.mjs`, `assets/app.js` | esbuild source and generated bundle |
| `test/` | Engine, speech and built-page DOM tests |

Add cases as JSON, not word-specific JavaScript. Cytoscape is an in-memory graph,
not a database. Optional display fields are `mapTitle`, `mapCaption` and
`mapLabelSide`; `edge.timeLabel` renders a clock label on a confirmed trail.
Algebra demonstrates `Today → 1100s → around 820`. The seven weekday cases
also label their confirmed English/Roman time jumps.

```sh
npm run validate
npm test
```

`npm test` builds first. Last full run: **71 tests passed**. DOM tests do not verify actual
pixels, native voice quality or real iPad behavior. Open `index.html` directly,
or use `npm start` at `http://localhost:8000`.

Only the active case is saved, under `word-chaser-current-v1`. Reload resumes
it. Selecting another word starts that word fresh and replaces the saved case;
switching back does not recover the old attempt. Restart clears the active
case. The older multi-case storage key is removed on startup.

## Publishing

- Repository: `git@github.com:dmkskd/word-chaser.git`, branch `main`.
- User’s screenshot confirmed Pages settings: **Deploy from a branch → main
  → / (root)**. `.nojekyll` is tracked. No custom Actions workflow was added.
- Expected address: `https://dmkskd.github.io/word-chaser/`.
  Live deployment and device behavior were not independently verified here.
- Build before publishing, and commit the generated `assets/app.js` and map
  along with changed source/data. Pages serves committed files; it does not
  run npm to regenerate them in this setup.
- GitHub CLI exists, but this session could not resolve/reach GitHub. Browser
  access also reported an unavailable host. Do not assume the user’s login is
  broken merely because a sandboxed `gh auth status` fails during a network
  failure. User configured Pages outside this session.

## Useful next work, not promises already implemented

The user clarified that UK word hunting means tracing familiar words through
both places and historical texts, including Shakespeare/Chaucer-style literary
evidence. It is not limited to regional vocabulary or town names. Proposed
implementation and a researched chortle example are in `BOOK-TRAIL-DESIGN.md`.
Book-attestation nodes and a coordinated evidence timeline are now implemented in chortle; dated stops also appear for Manchester and Grimsby.
Keep attestation separate from coinage and an author's location separate from
the word's birthplace.

Place-name investigations Grimsby and Manchester are now implemented. See
`PLACE-NAME-DESIGN.md` for the design and remaining shared-root limitation.
Both are ordinary JSON cases at both existing difficulties, each with two false
trails. Grimsby follows Grimesbi (1086) and the Norse settlement element;
Manchester follows Mameceaster (923), ceaster and Latin castra. They explicitly
investigate endings rather than claim to explain the entire name.

- Optional `node.segments` reproduces the exact form; `edge.sourceSegmentId`
  scopes a theory to one part. The header and theory context underline that
  part. Validation rejects malformed parts/references.
- New catalog places use `[longitude, latitude]` coordinates, projected through
  `src/geography.js` into the original Europe map. Existing anchors are retained.
- `node.displayOffset` is in screen pixels with a leader back to the true
  anchor. Local historical forms remain associated with the same town.
- The map bundles public-domain Natural Earth 1:10m UK/Ireland outlines and
  reveals representative regional/city labels as zoom increases. Regenerate
  with `scripts/build-uk-map.py` using the upstream GeoJSON; play needs no map
  service or network. Nearby city labels are not administrative boundaries.
- Zoom reaches a 35-unit view width (about 26×). Markers and hit radii keep
  screen sizes. Buttons/pinch zoom; two fingers pan; Shift-drag or Shift-arrow
  keys pan on desktop. One-finger dragging still searches with the glass.
- `case.camera` opens a local view, with Town view and Whole Europe controls.
  Earned distant connections can expand the camera; undiscovered targets do
  not trigger framing or leader lines in Investigator. Camera changes preserve
  progress, and no word-name conditions were added.
- All 65 automated tests pass, including both new cases, shared-location
  geometry, segment validation, local/Europe navigation and two-finger pan.
  Browser access was unavailable; headless Chrome also could not launch in the
  sandbox. Actual close-map, label collision and phone/iPad visuals are unverified.

1. Test the published site and actual iPad touch/audio, including tiny speaker
   targets, card overflow and zoom near Baghdad at the map edge.
2. Review clue difficulty and historical terminology. In particular, audit era
   labels rather than assuming every medieval French form is “Old French”.
3. Check label collisions and geographic placement as more pins are added.
   Offsets must not suggest travel to the wrong country.
4. Time labels now cover algebra and all seven weekday cases. Extend to other
   cases using sourced dates; avoid inventing precise years from broad eras.
5. Consider consolidating the many appended CSS overrides when tackling layout
   more broadly. Preserve current touch and compactness decisions.
6. Ideas, not playable yet: tangerine/Tangier for a North African coastal clue;
   sputnik for Russia; sugar for a longer multilingual route. Research notes
   are in `IDEAS.md`. Arabic does not correspond to just one country.

Earlier prototypes remain in `prototype/atlas-v1/` and `case-files.html`.
Develop the active `src/`, JSON and `app.css`, not those archived versions.


## Latest implementation: books and minimum length

Chortle is playable under Words from books, bringing the library to 36 cases
in nine groups. The required route is today’s word → the 1871 poem → the
probable chuckle ingredient → Middle English chukken (clucking noise). Snort is
an optional parallel ingredient. Probable blend is a distinct, visibly qualified
relation; it must never become a claimed certainty. Chortle cannot complete
at the book, after two decisions, or by replacing the third hop with a false
trail or optional branch. Old saved one-hop chortle progress reopens as incomplete.

`src/text-evidence.js` renders a short highlighted quotation and collapsed
provenance. `src/evidence-timeline.js` opens the same inspection as the map;
there are no separate points or duplicate answers. Investigator timelines show
only earned dates. Hidden book credits/dates unlock after the decision. Earned
books can reopen read-only from either view. The schema/validator covers text
references, highlighted excerpts, date ranges and publication dates. The current
slice requires geographic anchors even for books; mapless texts remain future
work. Do not misrepresent author associations as a word’s geographic birthplace.

New rule: **at least three required connected hops**, excluding the start,
correct No answers, optional detours and revisits. Validation rejects a shorter
solution for new cases. `catalog.rules.shortCaseHopExceptions` explicitly holds
24 legacy cases awaiting researched expansion; their current lengths cannot
regress and expanded cases must leave the list. Do not add new exceptions.
Run `npm run validate` for their names and current one/two-hop lengths. The
whole existing library has NOT yet been expanded to meet the new rule.

71 automated tests pass, including three-hop completion, restoration, no repeat
rewards, map/timeline coordination and Investigator secrecy. The final extended
trail was not visually verified in Safari: native UI control was interrupted by
concurrent user activity. Automated DOM coverage does not establish phone/iPad
layout or audio quality. Generated assets were rebuilt; nothing published here.


## Sandwich expanded to four required hops

The old food → Earl → town route was still too short. It now continues through
Old English Sandwic and its wīc ending (settlement), for four required connected
hops. All historical town forms use the Sandwich, Kent anchor with screen
separation and leaders; the wīc pin represents its use in this town name, not a
claimed birthplace of the general word. The town-name evidence is cited to Kent
Archaeological Society research. No exact year is invented for the older form.

Panino and sandale remain initial false leads; witch is a later sound-alike at
the ending investigation. The two ending challenges highlight the wic segment.
The old filled-bread invention/card-table caveat is preserved. Sandwich has left
the short-case exceptions list, leaving 24 cases awaiting researched expansion.

71 tests pass. The built-page test verifies no completion at the Earl, town,
old name or rejected witch; completion needs the settlement ending. Reloading
old two-hop progress continues the expanded case rather than showing the stamp.
Generated assets rebuilt. This change has automated DOM/engine coverage, without
a new native-browser or phone visual review. No publishing action performed.
