# Place-name investigations — proposed engine integration

Design proposal, 4 November 2026. Not implemented or playable yet.

## Keep one investigation engine

Place names are another kind of case, playable at either existing difficulty.
They do not need a separate UK difficulty or a separate scoring/state system.
A case can start at a British town and follow its language history across Europe.

Keep `Investigation` responsible for available evidence, decisions, rewards,
recorded links and goals. Keep camera changes outside investigation state.
Existing `formation`, `borrowing`, `spelling`, `related` and `comparison`
relationships already cover most of the necessary distinctions.

## Represent the whole name and its parts

Keep a node as one particular form in a language and period. Add optional
structured `segments` to a form, for example:

```json
{
  "form": "Grimsby",
  "segments": [
    {"text": "Grims"},
    {"text": "by", "id": "settlement-ending"}
  ]
}
```

Add an optional `sourceSegmentId` on a relationship. A formation link can
then investigate the `by` segment rather than imply the entire name developed
from that one element. The target is an ordinary evidence node for the older
element, with its own meaning, pronunciation, period and sources.

Validate that segment text concatenates exactly to `form`, segment IDs are
unique within a node, and each segment reference exists on the source node.
Render segments as text spans, not HTML from content. Highlight the part being
tested without using colour alone. Other existing word cases need no segments.
Initial cards must still avoid revealing the answer through their descriptions.

A first Manchester case could focus explicitly on its ending; completing it
means explaining that ending, not claiming to have explained the whole name.
Investigating other components can be a later, larger case with multiple goals.

## Separate geography from display layout

Today `placeId` resolves to a 900×650 map anchor and `offset` moves the marker.
That works for broad country clues but cannot reliably locate neighbouring
towns or separate several historical forms at the same town.

Introduce geographic coordinates for new place anchors and one shared map
projection, retaining legacy anchors while existing content is migrated.
Centralize position calculation: `main.js` and `map-view.js` currently each
calculate place plus offset independently.

Keep the town's geographic anchor fixed. Use screen-space label placement and,
where necessary, a local stack of evidence cards with leaders to that anchor.
Do not move a historical form into another county to avoid a collision.
Distinguish an exact evidence site from a broad language region; a regional
anchor is representative and must not pretend to be the word's birthplace.

Extend `MapView` with deeper zoom, pan and bounds fitting, detailed coastline,
and regional/city labels that appear at useful zoom levels. Current zoom stops
at a view width of 225 (4×); merely increasing that cap will enlarge the coarse
basemap and the pins rather than provide the required detail. Size pins and
hit targets in screen pixels so nearby towns stay usable on iPad.

Optional case camera data supplies the opening area, such as northern England.
Once a connection is earned, a camera action can frame the current place and
the discovered European evidence together. Never frame hidden Investigator
targets automatically: that would reveal where to search. Retain a manual
overview control, respect reduced motion, and keep camera moves out of scoring.

## Distinguish the links being investigated

- A whole name **built from** an element uses `formation`, scoped to its segment.
- An older local spelling uses `spelling` at the same geographic location.
- An element borrowed between languages uses `borrowing` when supported.
- Another town containing the same element needs an explicit `shared-element`
  relation: it is a parallel example, not the source of the first town's name.
- Plausible false trails use precise questions and sourced feedback as today.

Confirmed lines should describe a name/language connection and its dates.
They do not establish a particular person's journey or migration route.

For the first cases, keep each candidate node reachable by one tested link.
The current `linkTo()` chooses one incoming relationship and `leads()` deduplicates
by target; a visited target does not get another independent challenge. Thus a
shared root node does not currently support separately testing several towns'
connections to that root. If later cases require this, make the selected edge
explicit in inspect/answer/follow and add edge-based completion requirements,
with snapshot migration. Do not silently mark all incoming connections solved.

## Suggested first slice

1. Add optional segment data, relationship scope and their validation/rendering.
2. Add geographic anchors and the detailed zoomable map, preserving old cases.
3. Author one sourced Grimsby case about its ending and one Manchester case
   about its ending, with plausible Yes and No decisions in each.
4. Add a parallel-name example only once its precise relationship and goal
   are expressed in data. Consider reusable element definitions later, after
   two actual cases demonstrate the need; avoid a global shared-progress system.

Verify segment references, both difficulties, geographically fixed local forms,
zoom/pan/tap interactions, no hidden-location leakage, scoring, restart and
current-case-only persistence. Review actual iPad rendering and map accuracy.

## Research starting points

Content authoring still requires checking each claim and attaching citations
inside the case JSON. These are research entry points, not complete case data:

- https://www.snsbi.org.uk/exploring-names/largest-towns-and-cities/
- https://www.snsbi.org.uk/exploring-names/languages-in-the-place-names-of-britain-and-ireland/
- https://halogen.le.ac.uk/query/kepn

Distinguish documented name elements from later founding legends. Check the
Latin borrowing's form and inflection when authoring Manchester's trail rather
than treating modern `-chester` as a direct jump to a single Latin spelling.
