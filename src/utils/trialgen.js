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
    pair_id (e.g. AB, DE) ()
    // user data
    trial_start_time
    reaction_time(s) (list of millis or null if no resp)
    correct (pressed & cover image present, no press & cover image absent)
}

For test:
{
    trial_type
    familiar_pair (e.g. AB)
    foil_pair (e.g. LM)
    first_side_shown (left/right)
    familiar_side (left/right) (foil on opposite side)
    // user data
    chosen_side (left/right)
    reaction_time (from end of animating the second pair)
}
*/

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
}

const stim_ids = 'ABCDEFGHIJKLMNOPQRSTUVWX'
export default function makeTrials(debug) {
  // first, generate the pairs of interest
  let stim_id_list = stim_ids.split('')
  shuffleArray(stim_id_list)
  // take 2 at a time
  let familiar_pairs = []
  for (let i = 0; i < 6; i += 2) {
    familiar_pairs.push(stim_id_list.slice(i, i + 2))
  }
  // now generate foils (2 unique items from 2 different pairs,
  // elements never appearing consecutively)
  let foil_pairs = []
  for (let i = 0; i < 3; i++) {
    foil_pairs.push([familiar_pairs[i % 3][0], familiar_pairs[(i + 1) % 3][1]])
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
      'In this study, you will see a sequence of images. Whenever you see\n\n[img=noise]\n\n\non top of the image, press the [color=yellow]spacebar[/color].',
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
      pair_id: null,
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
      pair_id: null,
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
  // generate order of pairs
  // no restrictions on order
  let pair_sequence = Array(48).fill([0, 1, 2]).flat()
  shuffleArray(pair_sequence)
  // sequence of pairs should be good to go now
  // expand to trials
  let num_cover = Math.ceil(2 * pair_sequence.length * 0.2)
  let num_not = 2 * pair_sequence.length - num_cover
  let cover_true = Array(num_cover).fill(true)
  let cover_false = Array(num_not).fill(false)
  let cover_arr = cover_true.concat(cover_false)
  let cover_counter = 0
  shuffleArray(cover_arr)
  // loop over sequence of pairs
  for (let pair_idx of pair_sequence) {
    // loop within pair
    let tmp_pair = familiar_pairs[pair_idx]
    for (let stim_idx of tmp_pair) {
      trial_list.push({
        trial_type: 'exposure',
        stimulus_index: stim_ids.indexOf(stim_idx),
        stimulus_id: stim_idx,
        cover_vis: cover_arr[cover_counter++],
        exposure_time: 500,
        feedback_time: null,
        iti_time: 500,
        pair_id: tmp_pair.join(''),
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
      'This last section will be different.\n\nWe will show you two sequences of images, one on the [color=#9FC0DE]left[/color] side and one on the [color=#F2C894]right[/color].\n\nIf you think the sequence of images shown on the [color=#9FC0DE]left[/color] are more [color=yellow]familiar[/color], click the [color=#9FC0DE]left arrow[/color] key. If you think the sequence of images on the [color=#F2C894]right[/color] are more [color=yellow]familiar[/color], click the [color=#F2C894]right arrow[/color].\n\nDo not be afraid to guess!',
  })

  // all combinations of familiar x foil, repeated twice (for 32 total trials)
  let combos_1 = []
  let combos_2 = []
  let tmp = 0
  let first_side_1 = Array(3).fill(['left', 'right', 'left']).flat()
  let first_side_2 = Array(3).fill(['right', 'left', 'right']).flat()
  let foo = ['left', 'left', 'right', 'right', 'left', 'left', 'right', 'right', 'left']
  let bar = ['right', 'right', 'left', 'left', 'right', 'right', 'left', 'left', 'right']

  for (let fam of familiar_pairs) {
    for (let foil of foil_pairs) {
      combos_1.push({
        trial_type: 'test',
        attn: false,
        familiar_pair: fam.join(''),
        familiar_indices: fam.map((e) => {
          return stim_ids.indexOf(e)
        }),
        foil_pair: foil.join(''),
        foil_indices: foil.map((e) => {
          return stim_ids.indexOf(e)
        }),
        familiar_side: first_side_1[tmp],
        first_side: foo[tmp],
      })
      combos_2.push({
        trial_type: 'test',
        attn: false,
        familiar_pair: fam.join(''),
        familiar_indices: fam.map((e) => {
          return stim_ids.indexOf(e)
        }),
        foil_pair: foil.join(''),
        foil_indices: foil.map((e) => {
          return stim_ids.indexOf(e)
        }),
        familiar_side: first_side_2[tmp],
        first_side: bar[tmp],
      })

      tmp++
    }
  }

  // shuffle sections (no specific restrictions on order AFAIK?)
  shuffleArray(combos_1)
  shuffleArray(combos_2)

  // plug into trial list
  for (let t of combos_1) {
    t.trial_number = trial_counter++
    trial_list.push(t)
  }
  // insert foil vs novel test (one halfway, one end)
  trial_list.push({
    trial_type: 'test',
    attn: true,
    familiar_pair: foil_pairs[0].join(''),
    familiar_indices: foil_pairs[0].map((e) => {
      return stim_ids.indexOf(e)
    }),
    foil_pair: practice_stim.slice(0, 2).join(''),
    foil_indices: practice_stim.slice(0, 2).map((e) => {
      return stim_ids.indexOf(e)
    }),
    familiar_side: 'left',
    first_side: 'left',
    trial_number: trial_counter++,
  })
  for (let t of combos_2) {
    t.trial_number = trial_counter++
    trial_list.push(t)
  }
  // insert the second foil vs novel
  trial_list.push({
    trial_type: 'test',
    attn: true,
    familiar_pair: foil_pairs[1].join(''),
    familiar_indices: foil_pairs[1].map((e) => {
      return stim_ids.indexOf(e)
    }),
    foil_pair: practice_stim.slice(2, 4).join(''),
    foil_indices: practice_stim.slice(2, 4).map((e) => {
      return stim_ids.indexOf(e)
    }),
    familiar_side: 'right',
    first_side: 'right',
    trial_number: trial_counter++,
  })

  if (debug) {
    trial_list.splice(-14, 14)
  }
  return {
    trials: trial_list,
    familiar_pairs: familiar_pairs,
    foil_pairs: foil_pairs,
  }
}
