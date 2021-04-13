/*
For instructions:
{
    trial_type
    instruct_type (initial_practice, faster_practice, exposure, test (end will be baked in))
    ~instruct_text~ (would want to embed, but we want to give user-specific feedback for first practice & no great sprintf equivalent in JS)
    // user data (necessary? probably nice-to-have in case excessive time between exposure & test...)
    trial_start_time
    response_time (relative to beginning of section)
}
For practice/exposure:
{
    trial_type (instruct, practice, exposure, test)
    stimulus_index (stimulus shown, 0-23)
    stimulus_id (A, B, C, ...)
    cover_vis (true or false)
    exposure_time (millis)
    feedback_time (millis or null) (if null, no feedback)
    iti_time (millis)
    triplet_id (e.g. ABC, DEG) ()
    // user data
    trial_start_time
    reaction_time(s) (list of millis or null if no resp)
    correct (pressed & cover image present, no press & cover image absent)
}

For test:
{
    trial_type
    familiar_triplet (e.g. ABC)
    foil_triplet (e.g. LMN)
    first_side_shown (left/right)
    familiar_side (left/right) (foil on opposite side)
    // user data
    chosen_side (left/right)
    reaction_time (from end of animating the second triplet)
}
*/

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
      ;[array[i], array[j]] = [array[j], array[i]]
  }
}

function randCoord() {
  // TODO: adjust during debug
  return { x: Math.round(Math.random() * 200 - 100), y: Math.round(Math.random() * 200 - 100) }
}
const stim_ids = 'ABCDEFGHIJKLMNOPQRSTUVWX'
export default function makeTrials(debug) {
  // first, generate the triplets of interest
  let stim_id_list = stim_ids.split('')
  shuffleArray(stim_id_list)
  // take 3 at a time
  let familiar_triplets = []
  for (let i = 0; i < 12; i += 3) {
    familiar_triplets.push(stim_id_list.slice(i, i + 3))
  }
  // now generate foils (3 unique items from 3 different triplets,
  // elements never appearing consecutively)
  let foil_triplets = []
  for (let i = 0; i < 4; i++) {
    foil_triplets.push([
      familiar_triplets[i % 4][0],
      familiar_triplets[(i + 1) % 4][1],
      familiar_triplets[(i + 2) % 4][2],
    ])
  }

  // for practice stim, use each one twice
  let practice_stim = stim_id_list.slice(12, 22)
  //
  let trial_list = []
  let trial_counter = 0
  // practice 1 (easy, online feedback)
  trial_list.push({
    trial_type: 'instruct',
    instruct_type: 'initial_practice',
    instruct_text:
      'In this study, you will see a sequence of images. Whenever you see\n\n[img=noise]\n\n\non top, press the [color=yellow]spacebar[/color].',
  })
  shuffleArray(practice_stim)
  let tmp_inds = [1, 4, 7, 8]
  for (let i of practice_stim) {
    trial_list.push({
      trial_type: 'practice',
      stimulus_index: stim_ids.indexOf(i),
      stimulus_id: i,
      cover_vis: tmp_inds.includes(trial_counter),
      exposure_time: 1500,
      feedback_time: 500,
      iti_time: 1000,
      triplet_id: null,
      trial_number: trial_counter++,
    })
  }
  if (debug) {
    trial_list.splice(-7, 7)
  }
  // practice 2 (harder, no feedback)
  trial_list.push({
    trial_type: 'instruct',
    instruct_type: 'faster_practice',
    instruct_text:
      'Great job! We will do one more practice round.\n\nThis time, the images will [color=yellow]change more quickly[/color]. Try your best to press the [color=yellow]spacebar[/color] whenever you see this image:\n\n[img=noise]\n\n\n ',
  })
  shuffleArray(practice_stim)
  tmp_inds = [12, 13, 15, 16]
  for (let i of practice_stim) {
    trial_list.push({
      trial_type: 'practice',
      stimulus_index: stim_ids.indexOf(i),
      stimulus_id: i,
      cover_vis: tmp_inds.includes(trial_counter),
      exposure_time: 500,
      feedback_time: null,
      iti_time: 500,
      triplet_id: null,
      trial_number: trial_counter++,
    })
  }
  if (debug) {
    trial_list.splice(-7, 7)
  }
  // exposure
  trial_list.push({
    trial_type: 'instruct',
    instruct_type: 'exposure',
    instruct_text:
      'Excellent, just two sections to go.\n\nThis next section will be the same as the previous section, except we will show many images (should take about five minutes).',
  })
  // generate order of triplets (AA and ABAB disallowed)
  // divide section into thirds, so 8 triplet repeats per third
  // respect repeats across thirds boundaries
  let base = Array(8).fill([0, 1, 2, 3]).flat()
  let triplet_sequence = []
  for (let i = 0; i < 3; i++) {
    loop2: while (true) {
      shuffleArray(base)
      // check constraints
      // check thirds violations
      let len = triplet_sequence.length
      if (base[0] === triplet_sequence[len - 1]) {
        continue loop2
      }
      if (base[1] === triplet_sequence[len - 1] && base[0] === triplet_sequence[len - 2]) {
        continue loop2
      }
      for (let idx = 1; idx < base.length; idx++) {
        // AA not allowed
        if (base[idx] === base[idx - 1]) {
          continue loop2
        }
        // ABAB not allowed
        if (idx > 2 && base[idx] === base[idx - 2] && base[idx - 1] === base[idx - 3]) {
          continue loop2
        }
      }
      break loop2
    }
    // make a copy so we can reuse base
    triplet_sequence = triplet_sequence.concat(base)
  }
  // sequence of triplets should be good to go now
  // expand to trials
  let num_cover = Math.ceil(3 * triplet_sequence.length * 0.2)
  let num_not = 3 * triplet_sequence.length - num_cover
  let cover_true = Array(num_cover).fill(true)
  let cover_false = Array(num_not).fill(false)
  let cover_arr = cover_true.concat(cover_false)
  let cover_counter = 0
  shuffleArray(cover_arr)
  // loop over sequence of triplets
  for (let triplet_idx of triplet_sequence) {
    // loop within triplet
    let tmp_triplet = familiar_triplets[triplet_idx]
    for (let stim_idx of tmp_triplet) {
      trial_list.push({
        trial_type: 'exposure',
        stimulus_index: stim_ids.indexOf(stim_idx),
        stimulus_id: stim_idx,
        cover_vis: cover_arr[cover_counter++],
        exposure_time: 500,
        feedback_time: null,
        iti_time: 500,
        triplet_id: tmp_triplet.join(''),
        trial_number: trial_counter++,
      })
    }
  }
  if (debug) {
    trial_list.splice(-284, 284)
  }
  // test phase
  trial_list.push({
    trial_type: 'instruct',
    instruct_type: 'test',
    instruct_text:
      'One more section to go. In this section, we will see if one set of images is [color=yellow]more familiar[/color] to you than another set.\n\nWe will show one set of images on the [color=yellow]left[/color], and another set on the [color=yellow]right[/color]. After seeing both, use the [color=yellow]left[/color] and [color=yellow]right[/color] arrow keys to pick which seemed [color=yellow]more familiar[/color] to you.\n\nDo not be afraid to guess!',
  })

  // all combinations of familiar x foil, repeated twice (for 32 total trials)
  let combos_1 = []
  let combos_2 = []
  let tmp = 0
  let first_side_1 = Array(4).fill(['left', 'left', 'right', 'right']).flat()
  let first_side_2 = Array(4).fill(['right', 'right', 'left', 'left']).flat()

  for (let fam of familiar_triplets) {
    for (let foil of foil_triplets) {
      let foo = ['left', 'right']
      if (tmp % 2 === 1) {
        foo = ['right', 'left']
      }
      combos_1.push({
        trial_type: 'test',
        familiar_triplet: fam,
        familiar_indices: fam.map((e) => {
          return stim_ids.indexOf(e)
        }),
        foil_triplet: foil,
        foil_indices: foil.map((e) => {
          return stim_ids.indexOf(e)
        }),
        familiar_side: foo[0],
        first_side: first_side_1[tmp],
      })
      combos_2.push({
        trial_type: 'test',
        familiar_triplet: fam,
        familiar_indices: fam.map((e) => {
          return stim_ids.indexOf(e)
        }),
        foil_triplet: foil,
        foil_indices: foil.map((e) => {
          return stim_ids.indexOf(e)
        }),
        familiar_side: foo[1],
        first_side: first_side_2[tmp],
      })

      tmp++
    }
  }

  // shuffle sections (no specific restrictions on order AFAIK?)
  shuffleArray(combos_1)
  shuffleArray(combos_2)

  // plug into trial list
  for (let t of combos_1) {
    trial_list.push(t)
  }
  for (let t of combos_2) {
    trial_list.push(t)
  }
  if (debug) {
    trial_list.splice(-28, 28)
  }
  return {
    trials: trial_list,
    familiar_triplets: familiar_triplets,
    foil_triplets: foil_triplets,
  }
}
