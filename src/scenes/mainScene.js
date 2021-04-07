import { Enum } from '../utils/enum'

const states = Enum([
  'INSTRUCT', // show text instructions/take breaks
  'MAIN_LOOP', // run through trials
  'END_SECTION', // pretty much like TAKE_A_BREAK, but more final
])

export default class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' })
    this._state = states.INSTRUCT
    this.entering = true
    // these line up with trial_type
    this.all_data = {
      practice_basic: [],
      unif: [],
      adapt: [],
    }
  }

  preload() {}

  create() {}
}
