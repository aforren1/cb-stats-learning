export default class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' })
  }
  preload() {
    // load feedback images (check? x? sparks?)
    this.load.spritesheet('stimuli', 'assets/ss.png', {
      frameWidth: 200,
      frameHeight: 200,
      endFrame: 23,
      spacing: 4,
    })
    this.load.image('check', 'assets/check_small.png')
    this.load.image('x', 'assets/x_small.png')
    this.load.image('noise', 'assets/white_noise.png')
    this.load.image('arrow', 'assets/arrow.png')
  }
  create() {
    let height = this.game.config.height
    let center = height / 2
    let user_config = this.game.user_config

    let start_txt = this.add
      .rexBBCodeText(center, center, '[b]Click to start.[/b]\n\nThis will enter fullscreen mode.\n\nPlease remain in fullscreen mode until the end of the experiment.\n\nYou will not be able to pause after starting.', {
        fontFamily: 'Verdana',
        fontStyle: 'bold',
        fontSize: 40,
        wrap: {
          mode: 'word',
          width: 650,
          useAdvancedWrap: true,
        },
        align: 'center',
      })
      .setOrigin(0.5, 0.5)

    this.flash = this.tweens.add({
      targets: start_txt,
      alpha: { from: 0.3, to: 1 },
      ease: 'Linear',
      duration: 1000,
      repeat: -1,
      yoyo: true,
    })

    // we do a pointer event so that it counts as a page interaction (& fullscreen
    // is allowed to kick in)
    this.input.once('pointerdown', (evt) => {
      // https://supernapie.com/blog/hiding-the-mouse-in-a-ux-friendly-way/
      // we don't need the cursor, but we also don't need pointer lock or the like
      let canvas = this.sys.canvas
      canvas.style.cursor = 'none'
      canvas.addEventListener('mousemove', () => {
        canvas.style.cursor = 'default'
        clearTimeout(mouseHideTO)
        let mouseHideTO = setTimeout(() => {
          canvas.style.cursor = 'none'
        }, 1000)
      })
      this.flash.stop()
      this.scale.startFullscreen()
      this.tweens.addCounter({
        from: 255,
        to: 0,
        duration: 2000,
        onUpdate: (t) => {
          let v = Math.floor(t.getValue())
          this.cameras.main.setAlpha(v / 255)
        },
        onComplete: () => {
          this.scene.start('MainScene')
        },
      })
    })
  }
}
