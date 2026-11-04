# Junior Word Chaser — handover

Updated 4 November 2026, after renaming the game Junior Word Chaser and adding particle fireworks with sound.

## Start here next time

The HTML game is working and has 21 JSON investigations. The user is refining
the gameplay with screenshots, especially difficulty, clues, touch interaction
and compact layout. Preserve those decisions; this is still an evolving
prototype. Read `data/AUTHORING.md` before adding content.

The game is **Junior Word Chaser**. Keep the project folder named `word-investigator`.
The audience is an eight-year-old, often playing with an adult, on desktop or
iPad. The aim is to investigate how English words change locally over time and
travel between languages—not simply follow the only available correct pin.

## Gameplay decisions to preserve

- The compact top toolbar puts search, the word chooser and a two-button mode
  selector on one row when space allows. The word count sits directly below
  the chooser; the redundant “Your word mystery” label is removed. Mode buttons
  have hover/focus descriptions and 44px touch targets. Search and the native
  word dropdown share a 48px height and matching borders/type with the mode
  group, including explicit Safari select styling. The selected word has a
  short hover/focus description from its JSON summary.
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

- Investigator gives a playful location nudge after 60 seconds of searching,
  with a clearly visible “Hint in 1:00” badge among the map tools. Location
  hints stay in that badge until the next inspection or reset rather than
  disappearing after 12 seconds. Returning via browser Back/Forward resumes
  the timer (pagehide previously stopped it without a pageshow restart). Configure `searchHintSeconds` per mode
  (0 disables it); riddles live in `catalog.places[*].searchHint`. It points to
  an available connected lead without showing its word or giving the answer.
  The timer pauses in the opening story or a hidden tab, stops on theory cards,
  and resets after each correct answer, dismissal, restart or case/mode switch.
  Completion disables it. Nudges repeat each minute while still searching and
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
- Each case has two distinct false trails, including an immediately available
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
art, maths and house. The seven days are grouped together in weekday order.

Examples of intentional teaching distinctions:

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

`npm test` builds first. Last full run: **43 tests passed**. DOM tests do not verify actual
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
