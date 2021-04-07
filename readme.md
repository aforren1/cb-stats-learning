https://docs.google.com/drawings/d/1e_DbdycUV3cR6wGl0nLgx05iv2e5GRe7jKPuSzC3bpw/edit

https://docs.google.com/document/d/18J9oLLlHHtOEKnxLaZg8jFG2Q7HZpozbR0I2jkwAf5U/edit

use ←, ↓, → arrows (down arrow for cover task, L/R for probe)

Spritesheet has 100x100 images, 24 images total (see e.g. https://labs.phaser.io/edit.html?src=src/loader/sprite%20sheet/load%20sprite%20sheet.js&v=3.54.0 for spritesheet loading)

(TODO: scale images up a little more, and add spacing between so that antialias doesn't lead to bleeding of nearby pixels in the sheet)
(or keep as pixel art, so the patch actually stays intact)
Should target IE? Older people, older browsers

# Learning/Exposure Phase

- 0.5s exposure to shape, 0.5s ISI
- Press key when see patch on stimulus
- Each triplet presented 24 times (4 triplet types x 24 repeats = 288 trials)
- Triplets never in immediate succession (x ABC-ABC)
- Pairs of triplets never in immediate succession (x ABC-DEF-ABC-DEF)
- Evenly space triplets by thirds (so 8 repeats of each triplet type per third)
- no breaks
- No feedback about cover performance (until end of block?)
- Show fractal on 20% of trials (ish-- 288/5 doesn't work) (so 58 trials?)
- Do a few practice trials before jumping in via novel stimuli (just to get the gist)

# Test phase

- Counterbalance left vs right shown first, and foil vs real shown first (4 repeats, so can do one of each)
- Be clear that left arrow means left side, right means right (one person from original did left for first, right for second)
- Press L/R to choose, down arrow to continue to next trial
- 0.5s exposure + 0.5s ISI for each triplet presentation, with 1s between presentation
- Add fixation cue to presentation side 1s before presentation
- down button hit -> 1s delay (show fix cue on side) -> triplet presentation -> 1s delay (cue on opposite side) -> triplet presentation
- If not sure, guess!
-
