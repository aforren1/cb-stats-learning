export default class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TitleScene' })
  }
  preload() {
    // load feedback images (check? x? sparks?)
    this.load.spritesheet('stimuli', 'assets/stim-sprite-sheet.png', {
      frameWidth: 100,
      frameHeight: 100,
      endFrame: 23,
    })
  }
  create() {
    let height = this.game.config.height
    let center = height / 2
    let user_config = this.game.user_config

    var config = {
      key: 'test',
      frames: this.anims.generateFrameNumbers('stimuli', { start: 0, end: 23 }),
      frameRate: 5,
      repeat: -1,
    }

    this.anims.create(config)

    this.add.sprite(center, center, 'stimuli').setScale(2).play('test')

    this.add
      .text(center, center - 200, 'TITLE', {
        fontSize: 160,
        fill: true,
        fontFamily: 'Arial',
        strokeThickness: 2,
        shadow: {
          blur: 1,
          color: '#ffffff',
          stroke: true,
          fill: true,
        },
      })
      .setOrigin(0.5, 0.5)

    let start_txt = this.add
      .text(center, center + 200, 'Click the left mouse\nbutton to start.', {
        fontFamily: 'Verdana',
        fontStyle: 'bold',
        fontSize: 60,
        color: '#dddddd',
        stroke: '#444444',
        strokeThickness: 6,
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
    this.input.once('pointerdown', (ptr) => {
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
