# Working on Word Chaser

Read `STATUS.md` first for the current gameplay decisions, architecture,
publishing setup and outstanding work. Read `data/AUTHORING.md` before adding
or changing word investigations. `IDEAS.md` contains historical notes and ideas;
an idea there is not necessarily implemented.

Keep content and word-specific behavior in JSON. The JavaScript interprets the
data; do not add word-name conditions. Preserve child-friendly wording, single
answer progression and iPad support. Research historical claims and cite sources
inside case data.

Run `npm test` for behavior/content changes; it also rebuilds the generated
bundle. GitHub Pages serves the committed root on `main`, so source edits need
their rebuilt assets to appear online.

Update `STATUS.md` when substantial decisions or capabilities change. Keep
unverified deployment, browser and audio behavior clearly distinguished from
completed checks.
