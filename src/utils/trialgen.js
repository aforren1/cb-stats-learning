/*
For instructions:
{
    trial_type
    instruct_type (initial_practice, faster_practice, exposure, test (end will be baked in))
    ~instruct_text~ (would want to embed, but we want to give user-specific feedback for first practice & no great sprintf equivalent in JS)
    // user data (necessary? probably nice-to-have in case excessive time between exposure & test...)
    start_time (relative to beginning of section)
}
For practice/exposure:
{
    trial_type (instruct, practice, exposure, test)
    stimulus_index (stimulus shown, 0-23)
    stimulus_id (A, B, C, ...)
    cover_pos (x, y or null) (if null, no cover shown)
    exposure_time (millis)
    feedback_time (millis or null) (if null, no feedback)
    iti_time (millis)
    triplet_id (e.g. ABC, DEG) ()
    // user data
    reaction_time(s) (list of millis or null if no resp)
    correct (pressed & cover image present, no press & cover image absent)
}

For test:
{
    trial_type
    left_triplet (e.g. ABC)
    right_triplet (e.g. LMN)
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
  })
  shuffleArray(practice_stim)
  let tmp_inds = [1, 4, 7, 8]
  for (let i of practice_stim) {
    let pos = tmp_inds.includes(trial_counter) ? [Math.random() * 100 - 50, Math.random() * 100 - 50] : null
    trial_list.push({
      trial_type: 'practice',
      stimulus_index: stim_ids.indexOf(i),
      stimulus_id: i,
      cover_pos: pos,
      exposure_time: 1500,
      feedback_time: 500,
      iti_time: 1000,
      triplet_id: null,
      trial_number: trial_counter,
    })
    trial_counter++
  }
  // practice 2 (harder, no feedback)
  trial_list.push({
    trial_type: 'instruct',
    instruct_type: 'faster_practice',
  })
  shuffleArray(practice_stim)
  let tmp_inds = [12, 13, 15, 16]
  for (let i of practice_stim) {
    let pos = tmp_inds.includes(trial_counter) ? [Math.random() * 100 - 50, Math.random() * 100 - 50] : null
    trial_list.push({
      trial_type: 'practice',
      stimulus_index: stim_ids.indexOf(i),
      stimulus_id: i,
      cover_pos: pos,
      exposure_time: 500,
      feedback_time: null,
      iti_time: 500,
      triplet_id: null,
      trial_number: trial_counter,
    })
    trial_counter++
  }
  // exposure
  trial_list.push({
    trial_type: 'instruct',
    instruct_type: 'exposure',
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
  // should be good to go now
}
