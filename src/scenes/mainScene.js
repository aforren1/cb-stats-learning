import { Enum } from '../utils/enum'
import makeTrials from '../utils/trialgen'
import postData from '../utils/postdata'
import { onBeforeUnload } from '../game'

const states = Enum([
  'INSTRUCT', // show text instructions/take breaks
  'EXPOSURE',
  'TEST',
  'END',
])

export default class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainScene' })
    this._state = states.INSTRUCT
    this.entering = true

    // these line up with trial_type
    this.all_data = {
      instruct: [],
      exposure: [],
      test: [],
    }
  }

  preload() {
    this.exp_info = makeTrials(this.game.user_config.debug)
    // console.log(this.exp_info)
  }

  create() {
    let config = this.game.config
    let user_config = this.game.user_config
    this.is_debug = user_config.debug
    this.cameras.main.setBounds(-config.width / 2, -config.height / 2, config.width, config.height)
    let height = config.height
    let hd2 = height / 2
    this.trial_counter = 0
    this.trials = this.exp_info.trials
    this.current_trial = {}
    this.next_trial()

    this.instructions = this.add
      .rexBBCodeText(0, -hd2 + 200, '', {
        fontFamily: 'Verdana',
        fontSize: 26,
        align: 'center',
        wrap: {
          mode: 'word',
          width: 650,
          useAdvancedWrap: true,
        },
      })
      .setOrigin(0.5, 0)
      .setVisible(false)

    this.start_txt = this.add
      .text(0, 300, 'Press the spacebar\nto continue.', {
        fontFamily: 'Verdana',
        fontStyle: 'bold',
        fontSize: 60,
        color: '#dddddd',
        stroke: '#444444',
        strokeThickness: 6,
        align: 'center',
      })
      .setOrigin(0.5, 0.5)
    this.start_txt.visible = false

    this.fixation = this.add
      .text(0, 0, '+', {
        fontFamily: 'Verdana',
        fontStyle: 'bold',
        fontSize: 25,
      })
      .setOrigin(0.5, 0.5)
      .setVisible(false)

    this.stim = this.add.sprite(0, 0, 'stimuli').setVisible(false) // this is 250px then

    this.divider = this.add.rectangle(0, 0, 4, height * 0.66, 0xffffff).setVisible(false)

    this.test_txt = this.add
      .rexBBCodeText(
        0,
        -320,
        'Which sequence of images is\n[color=yellow]more familiar[/color], [color=#9FC0DE]left[/color] or [color=#F2C894]right[/color]?',
        {
          fontFamily: 'Verdana',
          fontStyle: 'bold',
          fontSize: 36,
          color: '#dddddd',
          align: 'center',
        }
      )
      .setOrigin(0.5, 0.5)
      .setVisible(false)

    this.larrow = this.add.image(-200, 250, 'arrow').setScale(1.5).setVisible(false)
    this.rarrow = this.add.image(200, 250, 'arrow').setScale(-1.5, 1.5).setVisible(false)
    this.arrow_txt = this.add
      .rexBBCodeText(
        0,
        320,
        'Use the [color=#9FC0DE]left[/color] or [color=#F2C894]right[/color] arrow keys to pick.',
        {
          fontFamily: 'Verdana',
          fontStyle: 'bold',
          fontSize: 30,
          color: '#dddddd',
          align: 'center',
        }
      )
      .setOrigin(0.5, 0.5)
      .setVisible(false)

    this.complete_txt = this.add
      .text(0, 0, 'Complete,\nplease wait...', {
        fontFamily: 'Verdana',
        fontStyle: 'bold',
        fontSize: 60,
        color: '#dddddd',
        stroke: '#444444',
        strokeThickness: 6,
        align: 'center',
      })
      .setOrigin(0.5, 0.5)
      .setVisible(false)
    this.details = this.add
      .text(0, 200, 'Will redirect shortly...', {
        fontFamily: 'Verdana',
        fontStyle: 'bold',
        fontSize: 60,
        color: '#dddddd',
        stroke: '#444444',
        strokeThickness: 6,
        align: 'center',
      })
      .setOrigin(0.5, 0.5)
      .setVisible(false)
    this.space_timestamps = []
    // this.input.keyboard.on('keydown-SPACE', (evt) => {
    //   // capture all space events, and dole out to whatever needs them
    //   this.space_timestamps.push(evt.timeStamp)
    // })
  }

  update() {
    // unpack current_trial to save typing
    const current_trial = this.current_trial
    switch (this.state) {
      case states.INSTRUCT:
        if (this.entering) {
          this.fixation.visible = false
          this.entering = false
          this.instructions.visible = true
          this.instructions.text = current_trial.instruct_text
          // NB that this and all other reference times are *wrong*
          // slightly better would be to take the next rAF time,
          // but that's more complicated & we don't care much about
          // precise RTs here anyway
          let trial_start_time = window.performance.now()

          this.time.delayedCall(5000, () => {
            this.start_txt.visible = true
            let flash = this.tweens.add({
              targets: this.start_txt,
              alpha: { from: 1, to: 0.3 },
              ease: 'Linear',
              duration: 2000,
              repeat: -1,
              yoyo: true,
            })
            this.input.keyboard.once('keydown-SPACE', (evt) => {
              this.all_data.instruct.push({
                trial_type: current_trial.trial_type,
                instruct_type: current_trial.instruct_type,
                trial_start_time: trial_start_time,
                response_time: evt.timeStamp,
              })
              //console.log(this.all_data)
              flash.stop()

              this.tweens.add(
                {
                  targets: [this.instructions, this.start_txt],
                  alpha: 0,
                  duration: 1500,
                  ease: 'Power2',
                },
                this
              )
              this.time.delayedCall(2000, () => {
                this.instructions.visible = false
                this.start_txt.visible = false
                this.start_txt.alpha = 1
                this.instructions.alpha = 1
                this.next_trial()
              })
            })
          })
        }
        break
      case states.EXPOSURE:
        if (this.entering) {
          this.entering = false
          // empty out space queue
          this.space_timestamps = []
          let trial_start_time = window.performance.now()
          // set the frame
          this.stim.setVisible(true).setFrame(current_trial.stimulus_index)

          this.time.delayedCall(current_trial.exposure_time, () => {
            // turn off noise & stim
            this.stim.visible = false
            // (optional) show feedback
            // if (current_trial.feedback_time) {
            //   let feedback_stim = this.x
            //   if (current_trial.cover_vis && this.space_timestamps.length > 0) {
            //     // good
            //     feedback_stim = this.check
            //   } else if (!current_trial.cover_vis && this.space_timestamps.length === 0) {
            //     // good
            //     feedback_stim = this.check
            //   }
            //   feedback_stim.visible = true
            //   this.time.delayedCall(current_trial.feedback_time, () => {
            //     feedback_stim.visible = false
            //     this.fixation.visible = true
            //   })
            // } else {
            this.fixation.visible = true
            // }

            this.time.delayedCall(current_trial.iti_time, () => {
              this.all_data[current_trial.trial_type].push({
                trial_type: current_trial.trial_type,
                stimulus_index: current_trial.stimulus_index,
                stimulus_id: current_trial.stimulus_id,
                cover_vis: current_trial.cover_vis,
                exposure_time: current_trial.exposure_time,
                //feedback_time: current_trial.feedback_time,
                iti_time: current_trial.iti_time,
                trial_start_time: trial_start_time,
                //press_times: this.space_timestamps.length > 0 ? this.space_timestamps.slice() : null,
                trial_number: current_trial.trial_number,
              })
              this.next_trial()
              this.fixation.visible = false
            })
          })
          // empty out space queue
          this.space_timestamps = []
        }
        break
      case states.TEST:
        if (this.entering) {
          this.entering = false
          this.test_txt.visible = true
          this.divider.visible = true
          let trial_start_time = window.performance.now()
          // show pair over course of 500ms, then switch sides & show second pair
          let poses = { left: -200, right: 200 }
          // pull out sets of indices
          let first_pair =
            current_trial.first_side === current_trial.familiar_side
              ? current_trial.familiar_indices
              : current_trial.foil_indices
          let second_pair =
            current_trial.first_side !== current_trial.familiar_side
              ? current_trial.familiar_indices
              : current_trial.foil_indices

          this.fixation.visible = true
          this.fixation.setPosition(poses[current_trial.first_side], 0)
          this.stim.setPosition(poses[current_trial.first_side], 0)

          let leftkey = this.input.keyboard.addKey('LEFT')
          let rightkey = this.input.keyboard.addKey('RIGHT')
          leftkey.enabled = false
          rightkey.enabled = false
          function handleInput(ctx, resp, time) {
            leftkey.enabled = false
            rightkey.enabled = false
            ctx.start_txt.visible = true
            ctx.input.keyboard.once('keydown-SPACE', (evt) => {
              ctx.all_data.test.push({
                trial_type: current_trial.trial_type,
                attn: current_trial.attn,
                familiar_pair: current_trial.familiar_pair,
                familiar_indices: current_trial.familiar_indices,
                foil_pair: current_trial.foil_pair,
                foil_indices: current_trial.foil_indices,
                familiar_side: current_trial.familiar_side,
                first_side: current_trial.first_side,
                trial_start_time: trial_start_time,
                response_time: time,
                continue_time: evt.timeStamp,
                choice: resp,
                trial_number: current_trial.trial_number,
              })
              //console.log(ctx.all_data)
              ctx.start_txt.visible = false
              ctx.test_txt.visible = false
              ctx.divider.visible = false
              ctx.next_trial()
            })
          }

          let second_side = current_trial.first_side === 'left' ? 'right' : 'left'

          this.tweens.timeline({
            targets: this.stim,
            tweens: [
              // first set
              {
                alpha: 1,
                duration: 1000,
                onComplete: () => {
                  this.fixation.visible = false
                  this.stim.visible = true
                  this.stim.setFrame(first_pair[0])
                },
              },
              {
                alpha: 1,
                duration: 500,
                onComplete: () => {
                  this.stim.visible = false
                },
              },
              {
                alpha: 1,
                duration: 500,
                onComplete: () => {
                  this.stim.visible = true
                  this.stim.setFrame(first_pair[1])
                },
              },
              {
                alpha: 1,
                duration: 500,
                onComplete: () => {
                  this.stim.visible = false
                  this.fixation.visible = true
                  this.fixation.setPosition(poses[second_side], 0)
                  this.stim.setPosition(poses[second_side], 0)
                },
              },
              // second set
              {
                alpha: 1,
                duration: 1000,
                onComplete: () => {
                  this.fixation.visible = false
                  this.stim.visible = true
                  this.stim.setFrame(second_pair[0])
                },
              },
              {
                alpha: 1,
                duration: 500,
                onComplete: () => {
                  this.stim.visible = false
                },
              },
              {
                alpha: 1,
                duration: 500,
                onComplete: () => {
                  this.stim.visible = true
                  this.stim.setFrame(second_pair[1])
                },
              },
              {
                alpha: 1,
                duration: 500,
                onComplete: () => {
                  this.stim.visible = false
                  leftkey.enabled = true
                  rightkey.enabled = true
                  this.larrow.visible = true
                  this.rarrow.visible = true
                  this.arrow_txt.visible = true
                  this.larrow.setTint(0xffffff)
                  this.rarrow.setTint(0xffffff)
                  let bounce = true
                  leftkey.once('down', (evt) => {
                    if (bounce) {
                      bounce = false
                      this.larrow.setTint(0x555555)
                      this.time.delayedCall(200, () => {
                        this.larrow.visible = false
                        this.rarrow.visible = false
                        this.arrow_txt.visible = false
                        handleInput(this, 'left', evt.originalEvent.timeStamp)
                      })
                    }
                  })
                  rightkey.once('down', (evt) => {
                    if (bounce) {
                      bounce = false
                      this.rarrow.setTint(0x555555)
                      this.time.delayedCall(200, () => {
                        this.larrow.visible = false
                        this.rarrow.visible = false
                        this.arrow_txt.visible = false
                        handleInput(this, 'right', evt.originalEvent.timeStamp)
                      })
                    }
                  })
                },
              },
            ],
          })
        }
        break
      case states.END:
        if (this.entering) {
          this.entering = false
          this.complete_txt.visible = true

          this.scale.stopFullscreen()
          let data = {
            config: this.game.user_config,
            data: this.all_data,
            mapping: { familiar: this.exp_info.familiar_pairs, foil: this.exp_info.foil_pairs },
          }
          if (data.config.is_prolific) {
            this.details.visible = true
          }
          let url = 'https://google.com/?cc='
          if (data.config.is_prolific) {
            url = 'https://app.prolific.co/submissions/complete?cc='
          }
          Promise.all(postData(data)).then((values) => {
            window.removeEventListener('beforeunload', onBeforeUnload)
            let delay = 0
            if (this.is_debug) {
              delay = 1000
            }
            this.time.delayedCall(delay, () => {
              if (data.config.is_prolific) {
                window.location.href = url + '10A2899D'
              } else {
                this.complete_txt.text = 'Thank you for\nparticipating!\nYou may now\nclose this window.'
              }
            })
          })
        }
        break
    }
  }

  get state() {
    return this._state
  }

  set state(newState) {
    this.entering = true
    this._state = newState
  }
  next_trial() {
    this.prev_trial = this.current_trial
    this.current_trial = this.trials.shift()
    let ct = this.current_trial
    if (ct === undefined) {
      this.state = states.END
    } else if (ct.trial_type === 'instruct') {
      this.state = states.INSTRUCT
    } else if (ct.trial_type === 'practice' || ct.trial_type === 'exposure') {
      this.state = states.EXPOSURE
    } else if (ct.trial_type === 'test') {
      this.state = states.TEST
    } else {
      // undefine
      console.error('Oh no, wrong next_trial.')
    }
  }
}
